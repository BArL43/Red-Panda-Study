"use client";

import { useCallback, useEffect, useState } from "react";
import { SessionUser, session } from "./api";

export function usePortalAuth(role: SessionUser["role"]) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  const check = useCallback(async () => {
    setChecking(true);
    setAuthError("");
    try {
      const current = await session();
      if (!current) {
        window.location.replace(role === "admin" ? "/admin/login" : "/");
        return;
      }
      if (current.role !== role) {
        window.location.replace(`/${current.role}`);
        return;
      }
      setUser(current);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Не удалось проверить сессию");
    } finally {
      setChecking(false);
    }
  }, [role]);

  useEffect(() => {
    const timer = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(timer);
  }, [check]);

  return { user, checking, authError, retry: check };
}
