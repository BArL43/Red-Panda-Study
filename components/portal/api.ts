export type SessionUser = {
  id: number;
  role: "admin" | "student" | "mentor";
  name: string;
  email: string;
};

const configuredBase = process.env.NEXT_PUBLIC_GO_API_URL?.replace(/\/$/, "") ?? "";
const requestTimeoutMs = 75_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${configuredBase}/api/v1${path}`, {
      ...init,
      cache: "no-store",
      credentials: "include",
      signal: init?.signal ?? controller.signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    if (response.status === 204) {
      return undefined as T;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(payload.error || "Не удалось выполнить запрос", response.status);
    }
    return payload as T;
  } catch (requestError) {
    if (requestError instanceof DOMException && requestError.name === "AbortError") {
      throw new ApiError("Сервер не ответил вовремя. Попробуйте ещё раз.", 408);
    }
    throw requestError;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function session(): Promise<SessionUser | null> {
  try {
    const result = await api<{ user: SessionUser }>("/me");
    return result.user;
  } catch {
    return null;
  }
}

export async function logout() {
  await api<void>("/logout", { method: "POST", body: "{}" });
  window.location.assign("/");
}

export function formatDate(value?: string) {
  if (!value) return "Без срока";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
