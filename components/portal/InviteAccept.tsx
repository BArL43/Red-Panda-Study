"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api";

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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ invitation: Invitation }>(`/invitations/${encodeURIComponent(token)}`)
      .then((result) => setInvitation(result.invitation))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Приглашение недоступно"));
  }, [token]);

  const visibleError = !token ? "В ссылке нет токена приглашения" : error;

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ redirect: string }>(`/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        body: "{}",
      });
      window.location.assign(result.redirect);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Не удалось принять приглашение");
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
            <p>Роль: <strong>{invitation.role === "student" ? "ученик" : "наставник"}</strong>. После активации ссылка погаснет, а вход сохранится на этом устройстве.</p>
            <div className="invite-meta"><span>{invitation.email}</span><span>до {new Date(invitation.expires_at).toLocaleDateString("ru-RU")}</span></div>
            <button className="portal-button primary wide" type="button" onClick={accept} disabled={busy}>{busy ? "Создаём кабинет…" : "Активировать доступ"} <span>→</span></button>
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
