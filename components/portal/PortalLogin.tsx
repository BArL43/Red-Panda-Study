"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, session } from "./api";

export function PortalLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    session().then((user) => {
      if (user?.role === "student" || user?.role === "mentor") window.location.replace(`/${user.role}`);
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ redirect: string }>("/portal/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      window.location.assign(result.redirect);
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
          <span className="portal-eyebrow light">Личное пространство</span>
          <h1>Ваш маршрут.<br />Ваши задачи.<br /><em>В одном месте.</em></h1>
          <p>Защищённый вход для учеников и наставников Red Panda Study.</p>
        </div>
        <div className="auth-orbit"><span>学</span><i /><b /></div>
      </div>
      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-panda"><i /><b /></span>
          <span className="portal-eyebrow">Повторный вход</span>
          <h2>Личный кабинет</h2>
          <p>Используйте email и пароль, созданные при активации приглашения.</p>
          <label><span>Email</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label><span>Пароль</span><input name="password" type="password" required minLength={12} autoComplete="current-password" placeholder="Ваш пароль" /></label>
          {error && <p className="portal-inline-error">{error}</p>}
          <button className="portal-button primary wide" disabled={busy} type="submit">{busy ? "Проверяем…" : "Войти в кабинет"} <span>→</span></button>
          <p>Нет пароля или забыли его? Обратитесь к координатору — он безопасно выпустит новую ссылку.</p>
          <Link href="/">← Вернуться на сайт</Link>
        </form>
      </div>
    </div>
  );
}
