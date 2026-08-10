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
