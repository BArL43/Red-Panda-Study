"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, formatDate } from "./api";
import { ConversationPanel } from "./ConversationPanel";
import { LoadingPortal, PortalError, PortalShell } from "./PortalShell";
import { usePortalAuth } from "./usePortalAuth";

type Consultation = {
  id: number; name: string; contact: string; country: string; level: string;
  intake: string; notes: string; status: string; created_at: string;
};
type User = { id: number; role: "student" | "mentor"; name: string; email: string; created_at: string };
type Invitation = { id: number; role: string; name: string; email: string; expires_at: string; used_at?: string };
type Conversation = { id: number; kind: string; subject: string; status: string; display_name: string; updated_at: string };
type Overview = {
  counts: { new_consultations: number; students: number; mentors: number; open_chats: number };
  consultations: Consultation[];
  users: User[];
  invitations: Invitation[];
  conversations: Conversation[];
};

const leadStatuses: Record<string, string> = { new: "Новая", contacted: "Связались", qualified: "Целевая", closed: "Закрыта" };

export function AdminDashboard() {
  const { user, checking } = usePortalAuth("admin");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "leads" | "team" | "chat">("overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api<Overview>("/admin/overview"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Панель недоступна");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [user, load]);

  const students = useMemo(() => data?.users.filter((item) => item.role === "student") ?? [], [data]);
  const mentors = useMemo(() => data?.users.filter((item) => item.role === "mentor") ?? [], [data]);

  if (checking || !user) return <LoadingPortal />;
  if (error && !data) return <PortalError message={error} retry={load} />;

  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ invitation: Invitation & { link: string } }>("/admin/invitations", {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), role: form.get("role") }),
      });
      setInviteLink(result.invitation.link);
      await navigator.clipboard?.writeText(result.invitation.link);
      load();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Не удалось создать приглашение");
    } finally {
      setBusy(false);
    }
  };

  const assign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api("/admin/assignments", {
        method: "POST",
        body: JSON.stringify({ student_id: Number(form.get("student_id")), mentor_id: Number(form.get("mentor_id")) }),
      });
      await load();
      event.currentTarget.reset();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Не удалось назначить наставника");
    } finally {
      setBusy(false);
    }
  };

  const updateLead = async (id: number, status: string) => {
    try {
      await api(`/admin/consultations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Не удалось обновить заявку");
    }
  };

  return (
    <PortalShell
      user={user}
      eyebrow="Операционный обзор"
      title="Панель поступлений"
      actions={<button className="portal-button primary compact" type="button" onClick={() => { setInviteLink(""); setInviteOpen(true); }}>+ Пригласить</button>}
    >
      <div className="portal-tabs">
        {([
          ["overview", "Обзор"],
          ["leads", `Заявки ${data?.counts.new_consultations ? `· ${data.counts.new_consultations}` : ""}`],
          ["team", "Ученики и наставники"],
          ["chat", "Чаты"],
        ] as const).map(([key, label]) => <button className={tab === key ? "active" : ""} onClick={() => setTab(key)} type="button" key={key}>{label}</button>)}
      </div>

      {error && <p className="portal-banner-error">{error}<button onClick={() => setError("")}>×</button></p>}

      {tab === "overview" && data && (
        <>
          <section className="metric-grid">
            <article className="metric-card red"><span>Новые заявки</span><strong>{data.counts.new_consultations}</strong><small>ждут первого контакта</small><i>↗</i></article>
            <article className="metric-card jade"><span>Ученики</span><strong>{data.counts.students}</strong><small>активных траекторий</small><i>◌</i></article>
            <article className="metric-card"><span>Наставники</span><strong>{data.counts.mentors}</strong><small>в команде сопровождения</small><i>人</i></article>
            <article className="metric-card dark"><span>Открытые чаты</span><strong>{data.counts.open_chats}</strong><small>включая гостей сайта</small><i>◎</i></article>
          </section>
          <section className="portal-two-columns">
            <div className="portal-card">
              <div className="portal-card-head"><div><span className="portal-eyebrow">Контроль качества</span><h2>Свежие обращения</h2></div><button onClick={() => setTab("leads")}>Все заявки →</button></div>
              <div className="lead-mini-list">
                {data.consultations.slice(0, 5).map((lead) => (
                  <div key={lead.id}><span className="lead-avatar">{lead.name.slice(0, 1)}</span><div><strong>{lead.name}</strong><small>{lead.country} · {lead.level}</small></div><span className={`status-pill ${lead.status}`}>{leadStatuses[lead.status]}</span><time>{formatDate(lead.created_at)}</time></div>
                ))}
                {!data.consultations.length && <div className="portal-empty compact"><strong>Заявок пока нет</strong></div>}
              </div>
            </div>
            <div className="portal-card quality-card">
              <div className="portal-card-head"><div><span className="portal-eyebrow">Стандарт Red Panda</span><h2>Качество сопровождения</h2></div><span className="quality-score">2×</span></div>
              <div className="quality-ring"><span><strong>QA</strong><small>двойная проверка</small></span></div>
              <ul><li><i /> У каждого требования есть источник и дата</li><li><i /> Каждая задача имеет ответственного</li><li><i /> История решений и версий сохраняется</li></ul>
            </div>
          </section>
        </>
      )}

      {tab === "leads" && data && (
        <section className="portal-card">
          <div className="portal-card-head"><div><span className="portal-eyebrow">Воронка консультаций</span><h2>Заявки с сайта</h2></div><span>{data.consultations.length} всего</span></div>
          <div className="portal-table">
            <div className="portal-table-row header"><span>Абитуриент</span><span>Профиль</span><span>Контакт</span><span>Создана</span><span>Статус</span></div>
            {data.consultations.map((lead) => (
              <div className="portal-table-row" key={lead.id}>
                <span><strong>{lead.name}</strong><small>#{lead.id}</small></span>
                <span><strong>{lead.country}</strong><small>{lead.level} · {lead.intake}</small></span>
                <span>{lead.contact}</span>
                <span>{formatDate(lead.created_at)}</span>
                <select value={lead.status} onChange={(event) => updateLead(lead.id, event.target.value)}>
                  {Object.entries(leadStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "team" && data && (
        <section className="portal-team-grid">
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Распределение нагрузки</span><h2>Назначить наставника</h2></div></div>
            <form className="assignment-form" onSubmit={assign}>
              <label><span>Ученик</span><select name="student_id" required defaultValue=""><option value="" disabled>Выберите ученика</option>{students.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <span className="assignment-arrow">→</span>
              <label><span>Наставник</span><select name="mentor_id" required defaultValue=""><option value="" disabled>Выберите наставника</option>{mentors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <button className="portal-button primary" disabled={busy}>Назначить</button>
            </form>
          </div>
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Активные аккаунты</span><h2>Команда и ученики</h2></div></div>
            <div className="people-grid">
              {data.users.map((person) => <article key={person.id}><span>{person.name.slice(0, 1)}</span><div><strong>{person.name}</strong><small>{person.email}</small></div><em>{person.role === "mentor" ? "Наставник" : "Ученик"}</em></article>)}
              {!data.users.length && <div className="portal-empty compact"><strong>Создайте первое приглашение</strong></div>}
            </div>
          </div>
        </section>
      )}

      {tab === "chat" && data && <section className="portal-card chat-card"><ConversationPanel conversations={data.conversations} /></section>}

      {inviteOpen && (
        <div className="portal-modal-backdrop" onMouseDown={() => setInviteOpen(false)}>
          <div className="portal-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="portal-modal-close" onClick={() => setInviteOpen(false)}>×</button>
            <span className="invite-modal-icon">✦</span>
            <span className="portal-eyebrow">Точечный доступ</span>
            <h2>Новое приглашение</h2>
            <p>Ссылка одноразовая и действует 7 дней. Аккаунт появится только после активации.</p>
            {!inviteLink ? (
              <form onSubmit={createInvite}>
                <label><span>Роль</span><select name="role" required defaultValue="student"><option value="student">Ученик</option><option value="mentor">Наставник</option></select></label>
                <label><span>Имя</span><input name="name" required placeholder="Анна Смирнова" /></label>
                <label><span>Email</span><input name="email" required type="email" placeholder="anna@example.com" /></label>
                <button className="portal-button primary wide" disabled={busy}>{busy ? "Создаём…" : "Создать и скопировать ссылку"} <span>→</span></button>
              </form>
            ) : (
              <div className="invite-result"><strong>Ссылка готова и скопирована</strong><input readOnly value={inviteLink} onFocus={(event) => event.target.select()} /><button className="portal-button ghost wide" onClick={() => navigator.clipboard?.writeText(inviteLink)}>Скопировать ещё раз</button></div>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
