export type SessionUser = {
  id: number;
  role: "admin" | "student" | "mentor";
  name: string;
  email: string;
};

const configuredBase = process.env.NEXT_PUBLIC_GO_API_URL?.replace(/\/$/, "") ?? "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${configuredBase}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Не удалось выполнить запрос");
  }
  return payload as T;
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

