/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  buildRuleAnalysis,
  enrichCompassAnalysis,
  validateCompassProfile,
} from "../lib/compass";
import { universityPrograms } from "../lib/university-programs";

const DEFAULT_API_ORIGIN = "https://red-panda-study-api.onrender.com";
const COMPASS_DAILY_LIMIT = 5;
const COMPASS_COOLDOWN_MS = 60_000;
const COMPASS_CACHE_MS = 30 * 24 * 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 25_000;
const VIBE_PROBE_TIMEOUT_MS = 12_000;

type CompassUsage = { day: string; count: number; lastRequestAt: number };
const compassUsage = new Map<number, CompassUsage>();
const compassCache = new Map<string, { expiresAt: number; analysis: unknown }>();

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  GO_API_URL?: string;
  GO_API_HOSTPORT?: string;
  VIBE_API_KEY?: string;
  VIBE_MODEL?: string;
  RENDER_GIT_COMMIT?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function nodeEnvironment(): Partial<Env> | undefined {
  return typeof process !== "undefined"
    ? (process.env as unknown as Partial<Env>)
    : undefined;
}

function runtimeValue(env: Env | undefined, key: "GO_API_URL" | "GO_API_HOSTPORT" | "VIBE_API_KEY" | "VIBE_MODEL" | "RENDER_GIT_COMMIT") {
  return env?.[key]?.trim() || nodeEnvironment()?.[key]?.trim();
}

type CompassProviderReason =
  | "ready"
  | "not_configured"
  | "invalid_key"
  | "insufficient_scope"
  | "insufficient_balance"
  | "daily_limit"
  | "rate_limited"
  | "ip_restricted"
  | "email_unconfirmed"
  | "invalid_model"
  | "provider_unavailable"
  | "network_error";

type CompassProviderStatus = {
  configured: boolean;
  available: boolean;
  provider: "VibeMarketolog";
  model: string;
  reason: CompassProviderReason;
  message: string;
};

const providerMessages: Record<CompassProviderReason, string> = {
  ready: "AI подключён и готов к платному анализу.",
  not_configured: "Ключ VIBE_API_KEY не задан в веб-сервисе Render.",
  invalid_key: "VibeMarketolog отклонил API-ключ. Проверьте значение ключа в Render.",
  insufficient_scope: "API-ключу не выдано право generate.",
  insufficient_balance: "На балансе VibeMarketolog недостаточно средств для анализа.",
  daily_limit: "В VibeMarketolog достигнут дневной лимит расходов.",
  rate_limited: "VibeMarketolog временно ограничил частоту запросов.",
  ip_restricted: "IP-ограничения API-ключа не разрешают запросы из Render.",
  email_unconfirmed: "В аккаунте VibeMarketolog требуется подтвердить email.",
  invalid_model: "Выбранная AI-модель недоступна для этого ключа.",
  provider_unavailable: "VibeMarketolog временно не принимает запросы.",
  network_error: "Render не смог установить соединение с VibeMarketolog.",
};

function providerReason(status: number, detail: string): CompassProviderReason {
  const normalized = detail.toLowerCase();
  if (status === 401) return "invalid_key";
  if (normalized.includes("insufficient_scope") || normalized.includes("scope")) return "insufficient_scope";
  if (normalized.includes("insufficient_balance") || normalized.includes("balance")) return "insufficient_balance";
  if (normalized.includes("daily_spend_limit") || normalized.includes("daily limit")) return "daily_limit";
  if (normalized.includes("ip_restricted") || normalized.includes("ip restriction")) return "ip_restricted";
  if (normalized.includes("email") && normalized.includes("confirm")) return "email_unconfirmed";
  if (normalized.includes("model") || status === 422) return "invalid_model";
  if (status === 429) return "rate_limited";
  return "provider_unavailable";
}

async function probeCompassProvider(env: Env): Promise<CompassProviderStatus> {
  const apiKey = runtimeValue(env, "VIBE_API_KEY");
  const model = runtimeValue(env, "VIBE_MODEL") || "gpt-5.6-sol";
  if (!apiKey) {
    return { configured: false, available: false, provider: "VibeMarketolog", model, reason: "not_configured", message: providerMessages.not_configured };
  }
  try {
    // /generate/estimate is free and validates the same `generate` permission,
    // model and request shape that the paid Compass request uses. /me requires
    // a separate `read` scope and therefore produced false negative statuses.
    const response = await fetch("https://lk.vibemarketolog.ru/api/agent/generate/estimate", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "text",
        model,
        prompt: "Проверка доступности Red Panda Compass. Ответь одним словом: OK.",
        max_tokens: 32,
        effort: "low",
        thinking: false,
        strict: true,
      }),
      signal: AbortSignal.timeout(VIBE_PROBE_TIMEOUT_MS),
    });
    const detail = await response.text();
    if (!response.ok) {
      const reason = providerReason(response.status, detail);
      return { configured: true, available: false, provider: "VibeMarketolog", model, reason, message: providerMessages[reason] };
    }
    let valid = true;
    try {
      const payload = JSON.parse(detail) as { valid?: boolean };
      valid = payload.valid !== false;
    } catch {
      valid = true;
    }
    const reason: CompassProviderReason = valid ? "ready" : "invalid_model";
    return { configured: true, available: valid, provider: "VibeMarketolog", model, reason, message: providerMessages[reason] };
  } catch {
    return { configured: true, available: false, provider: "VibeMarketolog", model, reason: "network_error", message: providerMessages.network_error };
  }
}

function apiOrigin(env?: Env) {
  // Cloudflare supplies bindings as `env`; the Node/Vinext server on Render
  // exposes them through process.env. Vinext may still pass an empty env object,
  // so resolve each value independently instead of treating env as authoritative.
  const publicURL = runtimeValue(env, "GO_API_URL");
  const privateHost = runtimeValue(env, "GO_API_HOSTPORT");
  // An explicitly configured public URL is authoritative. GO_API_HOSTPORT may
  // remain as a stale Blueprint service reference after manual Render setup.
  const configured = publicURL || (privateHost ? `http://${privateHost}` : undefined);
  return (configured || DEFAULT_API_ORIGIN).replace(/\/$/, "");
}

async function portalUser(request: Request, env: Env) {
  const headers = new Headers();
  const cookie = request.headers.get("Cookie");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(new Request(new URL("/api/v1/me", apiOrigin(env)), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  }));
  if (!response.ok) return null;
  const payload = await response.json() as {
    user?: { id?: number; role?: string; name?: string; email?: string };
  };
  return payload.user?.id && payload.user.role ? payload.user : null;
}

async function compassUser(request: Request, env: Env) {
  const user = await portalUser(request, env);
  return user?.role === "student" ? user : null;
}

async function handleUniversityRequirements(request: Request, env: Env) {
  if (request.method !== "GET") return json({ error: "Метод не поддерживается" }, 405);
  const user = await portalUser(request, env);
  if (!user?.id) return json({ error: "Войдите в личный кабинет" }, 401);
  return json({ programs: universityPrograms, checkedAt: "2026-08-09" });
}

async function handleCompassStatus(request: Request, env: Env) {
  if (request.method !== "GET") {
    return json({ error: "Метод не поддерживается" }, 405);
  }
  const user = await compassUser(request, env);
  if (!user?.id) {
    return json({ error: "Войдите в кабинет ученика" }, 401);
  }
  return json(await probeCompassProvider(env));
}

async function handleRuntimeHealth(request: Request, env: Env) {
  if (request.method !== "GET") return json({ error: "Метод не поддерживается" }, 405);
  const startedAt = Date.now();
  let backend: { available: boolean; databaseReady?: boolean; commit?: string; latencyMs: number };
  try {
    const response = await fetch(new URL("/api/health", apiOrigin(env)), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const payload = await response.json().catch(() => ({})) as { database_ready?: boolean; commit?: string };
    backend = { available: response.ok, databaseReady: payload.database_ready, commit: payload.commit, latencyMs: Date.now() - startedAt };
  } catch {
    backend = { available: false, latencyMs: Date.now() - startedAt };
  }
  const compass = await probeCompassProvider(env);
  return json({
    status: backend.available && compass.available ? "ok" : "degraded",
    frontend: { available: true, commit: runtimeValue(env, "RENDER_GIT_COMMIT") || "unknown" },
    backend,
    compass,
    checkedAt: new Date().toISOString(),
  });
}

async function handleCompass(request: Request, env: Env) {
  if (request.method !== "POST") {
    return json({ error: "Метод не поддерживается" }, 405);
  }
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > 20_000) {
    return json({ error: "Анкета слишком большая" }, 413);
  }
  const user = await compassUser(request, env);
  if (!user?.id) {
    return json({ error: "Войдите в кабинет ученика" }, 401);
  }
  try {
    const payload = await request.json() as { profile?: unknown };
    const profile = validateCompassProfile(payload.profile);
    const base = buildRuleAnalysis(profile);
    const apiKey = runtimeValue(env, "VIBE_API_KEY");
    if (!apiKey) {
      return json({ analysis: { ...base, notice: providerMessages.not_configured }, aiStatus: "not_configured" });
    }
    const profileHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(profile)))
      .then((digest) => Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""));
    const cacheKey = `${user.id}:${profileHash}`;
    const cached = compassCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return json({ analysis: cached.analysis, cached: true });
    }
    if (cached) compassCache.delete(cacheKey);

    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const currentUsage = compassUsage.get(user.id);
    const usage = currentUsage?.day === day
      ? currentUsage
      : { day, count: 0, lastRequestAt: 0 };
    if (now - usage.lastRequestAt < COMPASS_COOLDOWN_MS) {
      return json({
        analysis: { ...base, notice: "Правиловый расчёт готов. Новое AI-пояснение можно запросить через минуту." },
      });
    }
    if (usage.count >= COMPASS_DAILY_LIMIT) {
      return json({
        analysis: { ...base, notice: "Правиловый расчёт готов. Дневной лимит AI-пояснений исчерпан; куратор по-прежнему видит результаты." },
      });
    }
    compassUsage.set(user.id, { day, count: usage.count + 1, lastRequestAt: now });
    try {
      const analysis = await enrichCompassAnalysis({
        profile,
        base,
        apiKey,
        model: runtimeValue(env, "VIBE_MODEL") || "gpt-5.6-sol",
        userId: user.id,
      });
      compassCache.set(cacheKey, { expiresAt: now + COMPASS_CACHE_MS, analysis });
      return json({ analysis });
    } catch (aiError) {
      const detail = aiError instanceof Error ? aiError.message : "unknown error";
      console.error("Compass AI enrichment failed", detail);
      compassUsage.set(user.id, usage);
      const statusMatch = detail.match(/VibeMarketolog\s+(\d{3})/);
      const reason = providerReason(statusMatch ? Number(statusMatch[1]) : 503, detail);
      return json({
        analysis: {
          ...base,
          notice: `Правиловый расчёт готов. ${providerMessages[reason]}`,
        },
        aiStatus: reason,
      });
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Проверьте данные анкеты" }, 400);
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/demo" || url.pathname.startsWith("/demo/")) {
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/api/compass/status") {
      return handleCompassStatus(request, env);
    }

    if (url.pathname === "/api/runtime-health") {
      return handleRuntimeHealth(request, env);
    }

    if (url.pathname === "/api/compass/analyze") {
      return handleCompass(request, env);
    }

    if (url.pathname === "/api/universities/requirements") {
      return handleUniversityRequirements(request, env);
    }

    // Keep API calls same-origin in the browser. This avoids third-party cookie
    // restrictions while the application and the Go API live on separate hosts.
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const upstreamURL = new URL(`${url.pathname}${url.search}`, apiOrigin(env));
      let upstream: Response;
      try {
        const headers = new Headers(request.headers);
        headers.delete("host");
        upstream = await fetch(new Request(upstreamURL, {
          method: request.method,
          headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
          redirect: "manual",
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          // Required when forwarding a streaming request body in Node runtimes.
          duplex: request.body ? "half" : undefined,
        } as RequestInit));
      } catch {
        return json({ error: "Backend временно недоступен. Повторите запрос через минуту." }, 502);
      }
      const headers = new Headers(upstream.headers);
      // The response crosses two Render/Cloudflare HTTP stacks. Recalculate
      // framing headers so the browser never receives a nested or truncated
      // response, while preserving application headers such as Set-Cookie.
      headers.delete("content-length");
      headers.delete("content-encoding");
      headers.delete("transfer-encoding");
      headers.delete("connection");
      return new Response(await upstream.arrayBuffer(), {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
