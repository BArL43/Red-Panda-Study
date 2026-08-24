"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
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
type Conversation = {
  id: number; kind: string; subject: string; status: string; display_name: string;
  updated_at: string; user_id?: number; assigned_to?: number;
};
type Overview = {
  counts: { new_consultations: number; students: number; mentors: number; open_chats: number };
  consultations: Consultation[];
  users: User[];
  invitations: Invitation[];
  conversations: Conversation[];
};
type AdminTab = "overview" | "leads" | "team" | "chat";

const leadStatuses: Record<string, string> = { new: "Новая", contacted: "Связались", qualified: "Целевая", closed: "Закрыта" };

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

function sameOriginInviteLink(rawLink: string) {
  const parsed = new URL(rawLink, window.location.origin);
  const token = parsed.searchParams.get("token");
  if (!token) throw new Error("Сервер не вернул токен приглашения");
  const result = new URL("/invite", window.location.origin);
  result.searchParams.set("token", token);
  return result.toString();
}

export function AdminDashboard() {
  const { user, checking, authError, retry: retryAuth } = usePortalAuth("admin");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  const [selectedLead, setSelectedLead] = useState<Consultation | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<number | undefined>();
  const [busy, setBusy] = useState(false);
  const [assignmentStudent, setAssignmentStudent] = useState("");
  const [assignmentMentor, setAssignmentMentor] = useState("");
  const [assignmentNotice, setAssignmentNotice] = useState("");

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

  useEffect(() => {
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInviteOpen(false);
      setSelectedLead(null);
      setSelectedPerson(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const students = useMemo(() => data?.users.filter((item) => item.role === "student") ?? [], [data]);
  const mentors = useMemo(() => data?.users.filter((item) => item.role === "mentor") ?? [], [data]);
  const mentorsByID = useMemo(() => new Map(mentors.map((item) => [item.id, item])), [mentors]);
  const studentConversation = useCallback(
    (studentID: number) => data?.conversations.find((item) => item.kind === "student" && item.user_id === studentID),
    [data],
  );
  const mentorForStudent = useCallback(
    (studentID: number) => {
      const mentorID = studentConversation(studentID)?.assigned_to;
      return mentorID ? mentorsByID.get(mentorID) : undefined;
    },
    [mentorsByID, studentConversation],
  );
  const studentsForMentor = useCallback(
    (mentorID: number) => students.filter((student) => studentConversation(student.id)?.assigned_to === mentorID),
    [studentConversation, students],
  );

  if (checking) return <LoadingPortal />;
  if (authError) return <PortalError message={authError} retry={retryAuth} />;
  if (!user) return <LoadingPortal />;
  if (error && !data) return <PortalError message={error} retry={load} />;

  const navigation = [
    { key: "overview", label: "Рабочий стол", icon: "⌁", active: tab === "overview", onClick: () => setTab("overview") },
    { key: "leads", label: "Заявки", icon: "↗", active: tab === "leads", onClick: () => setTab("leads") },
    { key: "team", label: "Ученики и наставники", icon: "人", active: tab === "team", onClick: () => setTab("team") },
    { key: "chat", label: "Сообщения", icon: "◎", active: tab === "chat", onClick: () => setTab("chat") },
  ];

  const openInvite = () => {
    setInviteLink("");
    setCopyStatus("idle");
    setInviteOpen(true);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    const copied = await copyText(inviteLink);
    setCopyStatus(copied ? "copied" : "manual");
  };

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
      const link = sameOriginInviteLink(result.invitation.link);
      setInviteLink(link);
      const copied = await copyText(link);
      setCopyStatus(copied ? "copied" : "manual");
      await load();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Не удалось создать приглашение");
    } finally {
      setBusy(false);
    }
  };

  const chooseAssignmentStudent = (value: string) => {
    setAssignmentStudent(value);
    setAssignmentNotice("");
    const studentID = Number(value);
    const currentMentor = studentID ? mentorForStudent(studentID) : undefined;
    setAssignmentMentor(currentMentor ? String(currentMentor.id) : "");
  };

  const assign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setAssignmentNotice("");
    const studentID = Number(assignmentStudent);
    const mentorID = Number(assignmentMentor);
    const student = students.find((item) => item.id === studentID);
    const mentor = mentors.find((item) => item.id === mentorID);
    if (!student || !mentor) {
      setError("Выберите ученика и наставника из списка активных аккаунтов");
      return;
    }
    if (mentorForStudent(studentID)?.id === mentorID) {
      setAssignmentNotice(`${mentor.name} уже назначен наставником для ${student.name}`);
      return;
    }
    setBusy(true);
    try {
      await api("/admin/assignments", {
        method: "POST",
        body: JSON.stringify({ student_id: studentID, mentor_id: mentorID }),
      });
      await load();
      setAssignmentNotice(`${mentor.name} назначен наставником для ${student.name}`);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Не удалось назначить наставника");
    } finally {
      setBusy(false);
    }
  };

  const updateLead = async (id: number, status: string) => {
    try {
      await api(`/admin/consultations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setSelectedLead((current) => current?.id === id ? { ...current, status } : current);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Не удалось обновить заявку");
    }
  };

  const openLeadFromKeyboard = (event: KeyboardEvent<HTMLDivElement>, lead: Consultation) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedLead(lead);
    }
  };

  const openStudentConversation = (studentID: number) => {
    const conversation = studentConversation(studentID);
    if (!conversation) return;
    setSelectedConversation(conversation.id);
    setSelectedPerson(null);
    setTab("chat");
  };

  return (
    <PortalShell
      user={user}
      eyebrow="Операционный обзор"
      title="Панель поступлений"
      navigation={navigation}
      actions={<button className="portal-button primary compact" type="button" onClick={openInvite}>+ Пригласить</button>}
    >
      <div className="portal-tabs">
        {([
          ["overview", "Обзор"],
          ["leads", `Заявки ${data?.counts.new_consultations ? `· ${data.counts.new_consultations}` : ""}`],
          ["team", "Ученики и наставники"],
          ["chat", "Чаты"],
        ] as const).map(([key, label]) => <button className={tab === key ? "active" : ""} onClick={() => setTab(key)} type="button" key={key}>{label}</button>)}
      </div>

      {error && <p className="portal-banner-error">{error}<button type="button" onClick={() => setError("")}>×</button></p>}
      {assignmentNotice && <p className="portal-banner-success">{assignmentNotice}<button type="button" onClick={() => setAssignmentNotice("")}>×</button></p>}

      {tab === "overview" && data && (
        <>
          <section className="metric-grid">
            <button className="metric-card red interactive" type="button" onClick={() => setTab("leads")}><span>Новые заявки</span><strong>{data.counts.new_consultations}</strong><small>ждут первого контакта</small><i>↗</i></button>
            <button className="metric-card jade interactive" type="button" onClick={() => setTab("team")}><span>Ученики</span><strong>{data.counts.students}</strong><small>активных траекторий</small><i>◌</i></button>
            <button className="metric-card interactive" type="button" onClick={() => setTab("team")}><span>Наставники</span><strong>{data.counts.mentors}</strong><small>в команде сопровождения</small><i>人</i></button>
            <button className="metric-card dark interactive" type="button" onClick={() => setTab("chat")}><span>Открытые чаты</span><strong>{data.counts.open_chats}</strong><small>включая гостей сайта</small><i>◎</i></button>
          </section>
          <section className="portal-two-columns">
            <div className="portal-card">
              <div className="portal-card-head"><div><span className="portal-eyebrow">Контроль качества</span><h2>Свежие обращения</h2></div><button type="button" onClick={() => setTab("leads")}>Все заявки →</button></div>
              <div className="lead-mini-list">
                {data.consultations.slice(0, 5).map((lead) => (
                  <button type="button" onClick={() => setSelectedLead(lead)} key={lead.id}>
                    <span className="lead-avatar">{lead.name.slice(0, 1)}</span>
                    <span><strong>{lead.name}</strong><small>{lead.country} · {lead.level}</small></span>
                    <span className={`status-pill ${lead.status}`}>{leadStatuses[lead.status]}</span>
                    <time>{formatDate(lead.created_at)}</time>
                  </button>
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
              <div
                className="portal-table-row clickable"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLead(lead)}
                onKeyDown={(event) => openLeadFromKeyboard(event, lead)}
                key={lead.id}
              >
                <span><strong>{lead.name}</strong><small>#{lead.id} · открыть карточку</small></span>
                <span><strong>{lead.country}</strong><small>{lead.level} · {lead.intake}</small></span>
                <span>{lead.contact}</span>
                <span>{formatDate(lead.created_at)}</span>
                <select
                  aria-label={`Статус заявки ${lead.name}`}
                  value={lead.status}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  onChange={(event) => void updateLead(lead.id, event.target.value)}
                >
                  {Object.entries(leadStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
            ))}
            {!data.consultations.length && <div className="portal-empty compact"><strong>Заявок пока нет</strong></div>}
          </div>
        </section>
      )}

      {tab === "team" && data && (
        <section className="portal-team-grid">
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Распределение нагрузки</span><h2>Назначить наставника</h2></div></div>
            <form className="assignment-form" onSubmit={assign}>
              <label>
                <span>Ученик</span>
                <select name="student_id" required value={assignmentStudent} disabled={!students.length || busy} onChange={(event) => chooseAssignmentStudent(event.target.value)}>
                  <option value="" disabled>{students.length ? "Выберите ученика" : "Нет активных учеников"}</option>
                  {students.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.email}</option>)}
                </select>
              </label>
              {assignmentStudent && (
                <p className="assignment-current">
                  Сейчас: <strong>{mentorForStudent(Number(assignmentStudent))?.name ?? "наставник не назначен"}</strong>
                </p>
              )}
              <span className="assignment-arrow">→</span>
              <label>
                <span>Наставник</span>
                <select name="mentor_id" required value={assignmentMentor} disabled={!mentors.length || busy} onChange={(event) => { setAssignmentMentor(event.target.value); setAssignmentNotice(""); }}>
                  <option value="" disabled>{mentors.length ? "Выберите наставника" : "Нет активных наставников"}</option>
                  {mentors.map((item) => <option value={item.id} key={item.id}>{item.name} · {studentsForMentor(item.id).length} учеников</option>)}
                </select>
              </label>
              <button className="portal-button primary" disabled={busy || !assignmentStudent || !assignmentMentor}>{busy ? "Назначаем…" : mentorForStudent(Number(assignmentStudent)) ? "Переназначить" : "Назначить"}</button>
            </form>
          </div>
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Активные аккаунты</span><h2>Команда и ученики</h2></div><span>Нажмите для подробностей</span></div>
            <div className="people-grid">
              {data.users.map((person) => {
                const detail = person.role === "mentor"
                  ? `${studentsForMentor(person.id).length} учеников`
                  : mentorForStudent(person.id)?.name ?? "Наставник не назначен";
                return (
                  <button type="button" onClick={() => setSelectedPerson(person)} key={person.id}>
                    <span>{person.name.slice(0, 1)}</span>
                    <span><strong>{person.name}</strong><small>{person.email}</small></span>
                    <em>{person.role === "mentor" ? "Наставник" : "Ученик"} · {detail}</em>
                  </button>
                );
              })}
              {!data.users.length && <div className="portal-empty compact"><strong>Создайте первое приглашение</strong></div>}
            </div>
          </div>
        </section>
      )}

      {tab === "chat" && data && <section className="portal-card chat-card"><ConversationPanel key={selectedConversation ?? "all"} conversations={data.conversations} initialID={selectedConversation} allowStatusChanges onConversationStatusChange={load} /></section>}

      {inviteOpen && (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setInviteOpen(false)}>
          <div className="portal-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="portal-modal-close" type="button" aria-label="Закрыть" onClick={() => setInviteOpen(false)}>×</button>
            <span className="invite-modal-icon">✦</span>
            <span className="portal-eyebrow">Точечный доступ</span>
            <h2 id="invite-title">Новое приглашение</h2>
            <p>Ссылка одноразовая и действует 7 дней. Аккаунт появится только после активации.</p>
            {!inviteLink ? (
              <form onSubmit={createInvite}>
                <label><span>Роль</span><select name="role" required defaultValue="student"><option value="student">Ученик</option><option value="mentor">Наставник</option></select></label>
                <label><span>Имя</span><input name="name" required placeholder="Анна Смирнова" /></label>
                <label><span>Email</span><input name="email" required type="email" placeholder="anna@example.com" /></label>
                <button className="portal-button primary wide" disabled={busy}>{busy ? "Создаём…" : "Создать приглашение"} <span>→</span></button>
              </form>
            ) : (
              <div className="invite-result">
                <strong>{copyStatus === "copied" ? "Ссылка готова и скопирована" : "Ссылка готова"}</strong>
                <p>Она открывается на публичном сайте Red Panda Study и активируется один раз.</p>
                <input aria-label="Ссылка приглашения" readOnly value={inviteLink} onFocus={(event) => event.target.select()} />
                <div className="invite-actions">
                  <button className="portal-button ghost" type="button" onClick={() => void handleCopy()}>
                    {copyStatus === "copied" ? "Скопировано ✓" : "Скопировать"}
                  </button>
                  <a className="portal-button primary" href={inviteLink} target="_blank" rel="noreferrer">Проверить ссылку ↗</a>
                </div>
                {copyStatus === "manual" && <small>Выделите ссылку выше и скопируйте вручную.</small>}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setSelectedLead(null)}>
          <div className="portal-modal portal-detail-modal" role="dialog" aria-modal="true" aria-labelledby="lead-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="portal-modal-close" type="button" aria-label="Закрыть" onClick={() => setSelectedLead(null)}>×</button>
            <span className="invite-modal-icon">↗</span>
            <span className="portal-eyebrow">Заявка #{selectedLead.id}</span>
            <h2 id="lead-title">{selectedLead.name}</h2>
            <div className="portal-detail-grid">
              <article><span>Направление</span><strong>{selectedLead.country}</strong></article>
              <article><span>Уровень</span><strong>{selectedLead.level}</strong></article>
              <article><span>Планируемый набор</span><strong>{selectedLead.intake}</strong></article>
              <article><span>Дата заявки</span><strong>{formatDate(selectedLead.created_at)}</strong></article>
            </div>
            <div className="portal-detail-section"><span>Контакт</span><strong>{selectedLead.contact}</strong></div>
            <div className="portal-detail-section"><span>Комментарий абитуриента</span><p>{selectedLead.notes || "Комментарий не оставлен."}</p></div>
            <label className="portal-detail-status">
              <span>Статус заявки</span>
              <select value={selectedLead.status} onChange={(event) => void updateLead(selectedLead.id, event.target.value)}>
                {Object.entries(leadStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

      {selectedPerson && (
        <div className="portal-modal-backdrop" role="presentation" onMouseDown={() => setSelectedPerson(null)}>
          <div className="portal-modal portal-detail-modal" role="dialog" aria-modal="true" aria-labelledby="person-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="portal-modal-close" type="button" aria-label="Закрыть" onClick={() => setSelectedPerson(null)}>×</button>
            <span className="invite-modal-icon">{selectedPerson.role === "mentor" ? "人" : "学"}</span>
            <span className="portal-eyebrow">{selectedPerson.role === "mentor" ? "Наставник" : "Ученик"} · #{selectedPerson.id}</span>
            <h2 id="person-title">{selectedPerson.name}</h2>
            <p>{selectedPerson.email} · аккаунт создан {formatDate(selectedPerson.created_at)}</p>
            {selectedPerson.role === "mentor" ? (
              <div className="portal-person-list">
                <span>Закреплённые ученики · {studentsForMentor(selectedPerson.id).length}</span>
                {studentsForMentor(selectedPerson.id).map((student) => (
                  <button type="button" onClick={() => setSelectedPerson(student)} key={student.id}>
                    <i>{student.name.slice(0, 1)}</i><span><strong>{student.name}</strong><small>{student.email}</small></span><b>→</b>
                  </button>
                ))}
                {!studentsForMentor(selectedPerson.id).length && <p>У этого наставника пока нет закреплённых учеников.</p>}
              </div>
            ) : (
              <>
                <div className="portal-detail-section">
                  <span>Наставник</span>
                  <strong>{mentorForStudent(selectedPerson.id)?.name ?? "Пока не назначен"}</strong>
                </div>
                {studentConversation(selectedPerson.id) && (
                  <button className="portal-button primary wide" type="button" onClick={() => openStudentConversation(selectedPerson.id)}>Открыть диалог →</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
