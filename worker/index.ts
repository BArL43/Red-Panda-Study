/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  buildRuleAnalysis,
  enrichCompassAnalysis,
  validateCompassProfile,
} from "../lib/compass";
import { universityPrograms } from "../lib/university-programs";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:8788";
const COMPASS_DAILY_LIMIT = 5;
const COMPASS_COOLDOWN_MS = 60_000;
const COMPASS_CACHE_MS = 30 * 24 * 60 * 60 * 1000;

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

function apiOrigin(env: Env) {
  const privateHost = env.GO_API_HOSTPORT?.trim();
  const configured = privateHost ? `http://${privateHost}` : env.GO_API_URL?.trim();
  return (configured || DEFAULT_API_ORIGIN).replace(/\/$/, "");
}

async function portalUser(request: Request, env: Env) {
  const headers = new Headers();
  const cookie = request.headers.get("Cookie");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(new Request(new URL("/api/v1/me", apiOrigin(env)), {
    method: "GET",
    headers,
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
    const apiKey = env.VIBE_API_KEY?.trim();
    if (!apiKey) {
      return json({ analysis: base });
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
        model: env.VIBE_MODEL?.trim() || "gpt-5.6-sol",
        userId: user.id,
      });
      compassCache.set(cacheKey, { expiresAt: now + COMPASS_CACHE_MS, analysis });
      return json({ analysis });
    } catch (aiError) {
      console.error("Compass AI enrichment failed", aiError instanceof Error ? aiError.message : "unknown error");
      return json({
        analysis: {
          ...base,
          notice: "Правиловый расчёт готов. AI-пояснение временно недоступно; попробуйте повторить позже.",
        },
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
      return fetch(new Request(upstreamURL, request));
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
