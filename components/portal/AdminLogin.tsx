"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, session } from "./api";

export function AdminLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    session().then((user) => {
      if (user?.role === "admin") window.location.replace("/admin");
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      window.location.assign("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link href="/" className="auth-brand"><span className="auth-brand-dot" /> Red Panda Study</Link>
        <div className="auth-visual-copy">
          <span className="portal-eyebrow light">Командный центр</span>
          <h1>Каждый ученик.<br />Каждый дедлайн.<br /><em>В одном ритме.</em></h1>
          <p>Защищённый доступ для координаторов Red Panda Study.</p>
        </div>
        <div className="auth-orbit"><span>质量</span><i /><b /></div>
      </div>
      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-panda"><i /><b /></span>
          <span className="portal-eyebrow">Отдельный вход</span>
          <h2>Панель администратора</h2>
          <p>Введите корпоративные данные. Сессия хранится в защищённой HttpOnly cookie.</p>
          <label><span>Email</span><input name="email" type="email" required autoComplete="username" placeholder="admin@redpandastudy.com" /></label>
          <label><span>Пароль</span><input name="password" type="password" required minLength={12} autoComplete="current-password" placeholder="••••••••••••" /></label>
          {error && <p className="portal-inline-error">{error}</p>}
          <button className="portal-button primary wide" disabled={busy} type="submit">{busy ? "Проверяем…" : "Войти в панель"} <span>→</span></button>
          <Link href="/">← Вернуться на сайт</Link>
        </form>
      </div>
    </div>
  );
}
