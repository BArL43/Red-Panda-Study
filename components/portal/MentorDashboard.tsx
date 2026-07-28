"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { ConversationPanel } from "./ConversationPanel";
import { LoadingPortal, PortalError, PortalShell } from "./PortalShell";
import { usePortalAuth } from "./usePortalAuth";

type Student = {
  user: { id: number; name: string; email: string };
  profile: { country: string; level: string; intake: string; progress: number };
  open_tasks: number;
};
type Conversation = { id: number; kind: string; subject: string; display_name: string; updated_at: string; user_id?: number };

export function MentorDashboard() {
  const { user, checking } = usePortalAuth("mentor");
  const [students, setStudents] = useState<Student[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"students" | "chat">("students");
  const [error, setError] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [studentResult, chatResult] = await Promise.all([
        api<{ students: Student[] }>("/mentor/students"),
        api<{ conversations: Conversation[] }>("/conversations"),
      ]);
      setStudents(studentResult.students);
      setConversations(chatResult.conversations);
      setSelected((current) => current || studentResult.students[0]?.user.id || 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Кабинет недоступен");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [user, load]);

  const active = useMemo(() => students.find((item) => item.user.id === selected), [students, selected]);

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api("/tasks", {
        method: "POST",
        body: JSON.stringify({
          student_id: selected,
          title: form.get("title"),
          description: form.get("description"),
          due_at: form.get("due_at"),
        }),
      });
      setTaskOpen(false);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Не удалось создать задачу");
    } finally {
      setBusy(false);
    }
  };

  if (checking || !user) return <LoadingPortal label="Собираем учеников и дедлайны" />;
  if (error && !students.length) return <PortalError message={error} retry={load} />;

  return (
    <PortalShell
      user={user}
      eyebrow="Наставнический контур"
      title="Мои ученики"
      actions={<button className="portal-button primary compact" disabled={!selected} onClick={() => setTaskOpen(true)}>+ Новая задача</button>}
    >
      <div className="portal-tabs">
        <button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>Ученики · {students.length}</button>
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Диалоги · {conversations.length}</button>
      </div>
      {error && <p className="portal-banner-error">{error}<button onClick={() => setError("")}>×</button></p>}

      {tab === "students" && (
        <section className="mentor-work-grid">
          <div className="mentor-student-list">
            <div className="mentor-list-head"><span className="portal-eyebrow">Ваш портфель</span><strong>Активные траектории</strong></div>
            {students.map((student) => (
              <button className={selected === student.user.id ? "active" : ""} type="button" onClick={() => setSelected(student.user.id)} key={student.user.id}>
                <span className="lead-avatar">{student.user.name.slice(0, 1)}</span>
                <div><strong>{student.user.name}</strong><small>{student.profile.country} · {student.profile.level}</small></div>
                <em>{student.open_tasks} задач</em>
              </button>
            ))}
            {!students.length && <div className="portal-empty"><span>人</span><strong>Ученики ещё не назначены</strong><p>Администратор распределит новые траектории.</p></div>}
          </div>
          {active && (
            <div className="mentor-student-focus">
              <div className="student-focus-top">
                <div><span className="portal-eyebrow light">Траектория ученика</span><h2>{active.user.name}</h2><p>{active.user.email}</p></div>
                <div className="focus-progress"><strong>{active.profile.progress}%</strong><small>готовность</small></div>
              </div>
              <div className="focus-details">
                <article><span>Направление</span><strong>{active.profile.country}</strong></article>
                <article><span>Уровень</span><strong>{active.profile.level}</strong></article>
                <article><span>Набор</span><strong>{active.profile.intake}</strong></article>
                <article><span>Открыто задач</span><strong>{active.open_tasks}</strong></article>
              </div>
              <div className="mentor-focus-actions"><button className="portal-button primary" onClick={() => setTaskOpen(true)}>Поставить задачу</button><button className="portal-button ghost" onClick={() => setTab("chat")}>Открыть диалог →</button></div>
              <div className="mentor-standard"><span>质量</span><div><strong>Проверка перед отправкой</strong><p>Документы проходят двойной контроль: наставник + координатор.</p></div></div>
            </div>
          )}
        </section>
      )}

      {tab === "chat" && <section className="portal-card chat-card"><ConversationPanel conversations={conversations} /></section>}

      {taskOpen && active && (
        <div className="portal-modal-backdrop" onMouseDown={() => setTaskOpen(false)}>
          <div className="portal-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="portal-modal-close" onClick={() => setTaskOpen(false)}>×</button>
            <span className="invite-modal-icon">✓</span>
            <span className="portal-eyebrow">Для {active.user.name}</span>
            <h2>Новая задача</h2>
            <p>Опишите конкретный результат и обозначьте реалистичный срок.</p>
            <form onSubmit={createTask}>
              <label><span>Задача</span><input name="title" required placeholder="Подготовить черновик мотивационного письма" /></label>
              <label><span>Комментарий</span><textarea name="description" rows={4} placeholder="На что обратить внимание…" /></label>
              <label><span>Срок</span><input name="due_at" type="date" /></label>
              <button className="portal-button primary wide" disabled={busy}>{busy ? "Сохраняем…" : "Добавить в траекторию"} <span>→</span></button>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
