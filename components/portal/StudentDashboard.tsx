"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "./api";
import { ConversationPanel } from "./ConversationPanel";
import { LoadingPortal, PortalError, PortalShell } from "./PortalShell";
import { usePortalAuth } from "./usePortalAuth";

type Task = { id: number; title: string; description: string; status: string; due_at?: string };
type Dashboard = {
  user: { id: number; name: string; email: string };
  profile: { user_id: number; country: string; level: string; intake: string; progress: number };
  mentor?: { id: number; name: string; email: string };
  tasks: Task[];
  conversation?: { id: number; kind: string; subject: string; display_name: string; updated_at: string };
};

export function StudentDashboard() {
  const { user, checking } = usePortalAuth("student");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"route" | "tasks" | "chat">("route");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await api<{ dashboard: Dashboard }>("/student/dashboard");
      setData(result.dashboard);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Кабинет недоступен");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [user, load]);

  const updateTask = async (id: number, status: string) => {
    try {
      await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Задача не обновилась");
    }
  };

  if (checking || !user) return <LoadingPortal label="Открываем вашу траекторию" />;
  if (error && !data) return <PortalError message={error} retry={load} />;
  if (!data) return <LoadingPortal />;

  const done = data.tasks.filter((task) => task.status === "done").length;

  return (
    <PortalShell user={user} eyebrow="Личная траектория" title={`Привет, ${user.name.split(" ")[0]}!`}>
      <div className="student-hero">
        <div>
          <span className="portal-eyebrow light">Ваш маршрут</span>
          <h2>{data.profile.country === "Не выбрано" ? "Настраиваем направление" : `${data.profile.country} · ${data.profile.level}`}</h2>
          <p>Команда видит тот же план и следит, чтобы ни один дедлайн не потерялся.</p>
        </div>
        <div className="student-progress"><span style={{ "--progress": `${data.profile.progress}%` } as React.CSSProperties}><strong>{data.profile.progress}%</strong><small>готовность</small></span></div>
        <div className="student-hero-stamp">一步<br /><small>за шагом</small></div>
      </div>
      <div className="portal-tabs student-tabs">
        <button className={tab === "route" ? "active" : ""} onClick={() => setTab("route")}>Маршрут</button>
        <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>Задачи · {data.tasks.length}</button>
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Команда</button>
      </div>
      {error && <p className="portal-banner-error">{error}<button onClick={() => setError("")}>×</button></p>}

      {tab === "route" && (
        <section className="student-route-grid">
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Ближайшие шаги</span><h2>Что сейчас в работе</h2></div><span>{done}/{data.tasks.length} готово</span></div>
            <div className="route-timeline">
              {(data.tasks.length ? data.tasks : [
                { id: -1, title: "Диагностика профиля", description: "Координатор уточнит цели и академический опыт.", status: "in_progress" },
                { id: -2, title: "Шорт-лист университетов", description: "Соберём сбалансированный список программ.", status: "todo" },
              ]).slice(0, 4).map((task, index) => (
                <article className={task.status} key={task.id}><span>{task.status === "done" ? "✓" : index + 1}</span><div><strong>{task.title}</strong><p>{task.description}</p>{task.due_at && <small>до {formatDate(task.due_at)}</small>}</div></article>
              ))}
            </div>
          </div>
          <aside className="portal-card mentor-card">
            <span className="mentor-card-orbit">◌</span>
            <span className="portal-eyebrow">Ваш человек рядом</span>
            {data.mentor ? <><div className="mentor-avatar">{data.mentor.name.slice(0, 1)}</div><h2>{data.mentor.name}</h2><p>Личный наставник. Поможет разобраться в задачах и подготовиться к каждому этапу.</p><button className="portal-button ghost wide" onClick={() => setTab("chat")}>Написать наставнику →</button></> : <><h2>Наставник подключается</h2><p>Координатор уже подбирает специалиста под ваше направление.</p></>}
          </aside>
        </section>
      )}

      {tab === "tasks" && (
        <section className="portal-card">
          <div className="portal-card-head"><div><span className="portal-eyebrow">Рабочий список</span><h2>Задачи поступления</h2></div></div>
          <div className="student-task-list">
            {data.tasks.map((task) => (
              <article key={task.id}>
                <button className={`task-check ${task.status}`} type="button" onClick={() => updateTask(task.id, task.status === "done" ? "todo" : "done")}>{task.status === "done" ? "✓" : ""}</button>
                <div><strong>{task.title}</strong><p>{task.description}</p></div>
                <span className={`status-pill ${task.status}`}>{task.status === "done" ? "Готово" : task.status === "in_progress" ? "В работе" : "К выполнению"}</span>
                <time>{formatDate(task.due_at)}</time>
              </article>
            ))}
            {!data.tasks.length && <div className="portal-empty"><span>✓</span><strong>Задачи скоро появятся</strong><p>Наставник формирует ваш первый рабочий спринт.</p></div>}
          </div>
        </section>
      )}

      {tab === "chat" && <section className="portal-card chat-card"><ConversationPanel conversations={data.conversation ? [data.conversation] : []} /></section>}
    </PortalShell>
  );
}
