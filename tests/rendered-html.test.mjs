import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("keeps Panda Product copy, pricing and university catalog visible in rendered HTML", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("content-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const [home, services, universities] = await Promise.all([
    worker.fetch(new Request("http://localhost/"), env, context),
    worker.fetch(new Request("http://localhost/services"), env, context),
    worker.fetch(new Request("http://localhost/universities"), env, context),
  ]);

  assert.equal(home.status, 200);
  assert.equal(services.status, 200);
  assert.equal(universities.status, 200);

  const homeHTML = await home.text();
  assert.match(homeHTML, /Поступление, которое/);
  assert.match(homeHTML, /Управляемый продукт/);
  assert.match(homeHTML, /двойную проверку/);
  assert.doesNotMatch(homeHTML, /\/workspace\/scratch\//);

  const servicesHTML = await services.text();
  for (const text of ["RPS Strategy", "34 900 ₽", "RPS Start", "49 900 ₽", "RPS Admission", "119 900 ₽", "RPS Select", "189 900 ₽"]) {
    assert.ok(servicesHTML.includes(text), `services page must include ${text}`);
  }

  const universitiesHTML = await universities.text();
  assert.match(universitiesHTML, /Все направления/);
  assert.match(universitiesHTML, /Обучение/);
  assert.match(universitiesHTML, /\/год/);
});

test("builds a rules-first Compass strategy without exposing an API key", { concurrency: false }, async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("compass-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "red-panda-study-api.onrender.com" && url.pathname === "/api/v1/me") {
      return Response.json({
        user: { id: 42, role: "student", name: "Test Student", email: "student@example.com" },
      });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/compass/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "rps_session=test-session",
        },
        body: JSON.stringify({
          profile: {
            degree: "bachelor",
            field: "computer-science",
            destinations: ["china", "hong-kong"],
            gpaPercent: 84,
            ielts: 6.5,
            toefl: null,
            hsk: null,
            sat: 1360,
            annualBudgetUsd: 40000,
            intakeYear: 2027,
            priorities: "Сильная стажировочная база",
          },
        }),
      }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        GO_API_URL: "https://red-panda-study-api.onrender.com",
        VIBE_MODEL: "gpt-5.6-sol",
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.analysis.mode, "rules");
    assert.equal(payload.analysis.model, null);
    assert.ok(payload.analysis.programs.length >= 3);
    assert.ok(payload.analysis.programs.length <= 7);
    assert.ok(payload.analysis.programs.every((program) => program.ruleChecks.length === 4));
    assert.ok(JSON.stringify(payload).includes("VIBE_API_KEY"));
    assert.ok(!JSON.stringify(payload).includes("sk-"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("blocks all public demo routes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("demo-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/demo/student"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 404);
});

test("accepts a validated VibeMarketolog explanation without changing the shortlist", { concurrency: false }, async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("vibe-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "red-panda-study-api.onrender.com" && url.pathname === "/api/v1/me") {
      return Response.json({ user: { id: 77, role: "student", name: "AI Student", email: "ai@example.com" } });
    }
    if (url.hostname === "lk.vibemarketolog.ru" && url.pathname === "/api/agent/generate") {
      const body = JSON.parse(await request.text());
      const prompt = JSON.parse(body.prompt);
      const narratives = prompt.rule_engine_shortlist.map((program) => ({
        program_id: program.id,
        fit: "Программа соответствует выбранному направлению и текущему профилю.",
        risk: "Конкурс и требования нужно подтвердить перед подачей.",
        next_action: "Сверить официальный intake вместе с куратором.",
      }));
      return Response.json({
        status: "complete",
        text: JSON.stringify({
          summary: "Предварительный портфель собран и требует экспертной проверки.",
          program_narratives: narratives,
          scenarios: [
            { title: "Текущий профиль", change: "Без изменений", effect: "Сохраняется текущий баланс риска." },
            { title: "Усиление языка", change: "IELTS +0.5", effect: "Снижается языковой риск." },
          ],
          parent_report: "Compass сформировал предварительный маршрут без гарантий поступления.",
          questions_for_expert: ["Какие дедлайны подтвердить?", "Какие документы усилить?"],
        }),
      });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/compass/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "rps_session=ai-session" },
        body: JSON.stringify({
          profile: {
            degree: "bachelor",
            field: "computer-science",
            destinations: ["china", "hong-kong"],
            gpaPercent: 84,
            ielts: 6.5,
            toefl: null,
            hsk: null,
            sat: 1360,
            annualBudgetUsd: 40000,
            intakeYear: 2027,
            priorities: "Сильная стажировочная база",
          },
        }),
      }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        GO_API_URL: "https://red-panda-study-api.onrender.com",
        VIBE_API_KEY: "oc_test_only",
        VIBE_MODEL: "gpt-5.6-sol",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.analysis.mode, "ai");
    assert.equal(payload.analysis.model, "gpt-5.6-sol");
    assert.ok(payload.analysis.programs.length >= 3);
    assert.ok(payload.analysis.programs.every((program) => program.fit.includes("соответствует")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("checks the paid Compass path with a free generate estimate", { concurrency: false }, async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("vibe-status-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  let estimateCalled = false;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "red-panda-study-api.onrender.com" && url.pathname === "/api/v1/me") {
      return Response.json({ user: { id: 91, role: "student", name: "Status Student", email: "status@example.com" } });
    }
    if (url.hostname === "lk.vibemarketolog.ru" && url.pathname === "/api/agent/generate/estimate") {
      estimateCalled = true;
      assert.equal(request.method, "POST");
      assert.match(request.headers.get("authorization") ?? "", /^Bearer /);
      const body = JSON.parse(await request.text());
      assert.equal(body.model, "gpt-5.6-sol");
      return Response.json({ valid: true, estimated_cost: 0.01 });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/compass/status", { headers: { Cookie: "rps_session=status-session" } }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        GO_API_URL: "https://red-panda-study-api.onrender.com",
        VIBE_API_KEY: "oc_test_only",
        VIBE_MODEL: "gpt-5.6-sol",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.available, true);
    assert.equal(payload.reason, "ready");
    assert.equal(estimateCalled, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns a safe Compass configuration reason without exposing provider secrets", { concurrency: false }, async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("vibe-scope-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "red-panda-study-api.onrender.com" && url.pathname === "/api/v1/me") {
      return Response.json({ user: { id: 92, role: "student", name: "Scope Student", email: "scope@example.com" } });
    }
    if (url.hostname === "lk.vibemarketolog.ru" && url.pathname === "/api/agent/generate/estimate") {
      return Response.json({ error: "insufficient_scope", required: "generate", token: "must-not-leak" }, { status: 403 });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/compass/status", { headers: { Cookie: "rps_session=scope-session" } }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        GO_API_URL: "https://red-panda-study-api.onrender.com",
        VIBE_API_KEY: "oc_test_only",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(payload.available, false);
    assert.equal(payload.reason, "insufficient_scope");
    assert.ok(!JSON.stringify(payload).includes("must-not-leak"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
