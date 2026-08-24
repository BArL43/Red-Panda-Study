"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, session, SessionUser } from "./api";

type Invitation = {
  role: "student" | "mentor";
  name: string;
  email: string;
  expires_at: string;
};

export function InviteAccept() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!token) return;
    api<{ invitation: Invitation }>(`/invitations/${encodeURIComponent(token)}`)
      .then((result) => setInvitation(result.invitation))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Приглашение недоступно"));
  }, [token]);

  const visibleError = !token ? "В ссылке нет токена приглашения" : error;
  const destinationFor = (user: SessionUser) => `/${user.role}`;

  const verifySession = async (expectedRole: Invitation["role"]) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await session();
      if (current) {
        if (current.role !== expectedRole) {
          throw new Error(`В браузере уже открыт кабинет с ролью «${current.role}». Выйдите из него и повторите активацию.`);
        }
        return current;
      }
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
    return null;
  };

  const accept = async () => {
    if (!invitation || busy) return;
    if (password.length < 12) {
      setError("Придумайте пароль не короче 12 символов.");
      return;
    }
    if (password !== confirmation) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Создаём аккаунт и защищённую сессию…");
    try {
      await api<{ redirect: string }>(`/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setStatus("Проверяем доступ к кабинету…");
      const current = await verifySession(invitation.role);
      if (!current) {
        throw new Error("Аккаунт создан, но браузер не сохранил вход. Разрешите cookies для сайта и нажмите кнопку ещё раз.");
      }
      setStatus("Готово. Открываем кабинет…");
      window.location.replace(destinationFor(current));
    } catch (acceptError) {
      const current = await verifySession(invitation.role).catch(() => null);
      if (current) {
        window.location.replace(destinationFor(current));
        return;
      }
      setStatus("");
      setError(acceptError instanceof Error ? acceptError.message : "Не удалось активировать аккаунт");
      setBusy(false);
    }
  };

  return (
    <div className="invite-page">
      <div className="invite-card">
        <Link href="/" className="auth-brand"><span className="auth-brand-dot" /> Red Panda Study</Link>
        <div className="invite-seal"><span>入</span><i /><b /></div>
        {invitation ? (
          <>
            <span className="portal-eyebrow">Персональное приглашение</span>
            <h1>{invitation.name},<br />ваш кабинет готов.</h1>
            <p>Роль: <strong>{invitation.role === "student" ? "ученик" : "наставник"}</strong>. Создайте пароль: он позволит войти снова с любого устройства.</p>
            <div className="invite-meta"><span>{invitation.email}</span><span>до {new Date(invitation.expires_at).toLocaleDateString("ru-RU")}</span></div>
            <div className="invite-activation" aria-live="polite">
              <label><span>Пароль</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={12} autoComplete="new-password" placeholder="Минимум 12 символов" /></label>
              <label><span>Повторите пароль</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" minLength={12} autoComplete="new-password" placeholder="Повторите пароль" /></label>
              {error && <div className="invite-activation-error" role="alert"><strong>Не удалось активировать аккаунт</strong><span>{error}</span></div>}
              {status && <p className="invite-activation-status"><i />{status}</p>}
              <button className="portal-button primary wide" type="button" onClick={accept} disabled={busy}>
                {busy ? "Активируем…" : error ? "Попробовать снова" : "Активировать аккаунт"} <span>→</span>
              </button>
              <small>Не закрывайте страницу до перехода в личный кабинет.</small>
            </div>
          </>
        ) : visibleError ? (
          <>
            <span className="portal-eyebrow">Ссылка недоступна</span>
            <h1>Не удалось открыть приглашение</h1>
            <p>{visibleError}. Попросите координатора выпустить новую ссылку.</p>
            <Link className="portal-button ghost wide" href="/">На главную</Link>
          </>
        ) : (
          <><span className="portal-eyebrow">Проверяем приглашение</span><h1>Один момент…</h1></>
        )}
      </div>
      <div className="invite-side"><span>一步一步</span><h2>Шаг за шагом — к зачислению.</h2><p>Документы, сроки, задачи и связь с командой в одном спокойном пространстве.</p></div>
    </div>
  );
}
