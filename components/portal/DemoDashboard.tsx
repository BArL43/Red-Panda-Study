"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PortalShell } from "./PortalShell";
import type { SessionUser } from "./api";

type DemoRole = "admin" | "mentor" | "student";

const demoUsers: Record<DemoRole, SessionUser> = {
  admin: { id: 1, role: "admin", name: "Мария Воронцова", email: "admin@redpandastudy.com" },
  mentor: { id: 2, role: "mentor", name: "Анна Лебедева", email: "anna@redpandastudy.com" },
  student: { id: 3, role: "student", name: "Алина Морозова", email: "alina@example.com" },
};

const roleLinks: { role: DemoRole; label: string; href: string }[] = [
  { role: "admin", label: "Администратор", href: "/demo/admin" },
  { role: "mentor", label: "Куратор", href: "/demo/mentor" },
  { role: "student", label: "Ученик", href: "/demo/student" },
];

function DemoSwitch({ current }: { current: DemoRole }) {
  return (
    <div className="demo-switch" aria-label="Переключить демонстрационный кабинет">
      {roleLinks.map((item) => (
        <Link className={item.role === current ? "active" : ""} href={item.href} key={item.role}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="demo-notice">
      <span>DEMO</span>
      <p><strong>Это визуальная версия кабинета.</strong> Данные вымышлены, а действия не отправляются на сервер.</p>
    </div>
  );
}

function DemoChat() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { side: "client", name: "Алина", text: "Я загрузила обновлённое мотивационное письмо. Можно проверить вступление?", time: "12:18" },
    { side: "team", name: "Анна, куратор", text: "Да, вижу файл. Сегодня до 18:00 оставлю комментарии и отмечу следующий шаг.", time: "12:24" },
  ]);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((current) => [...current, { side: "client", name: "Вы", text: draft.trim(), time: "сейчас" }]);
    setDraft("");
  };

  return (
    <div className="demo-chat">
      <div className="portal-thread-head">
        <div><strong>Рабочий диалог</strong><small>История сохраняется в карточке ученика</small></div>
        <span className="online-pill">На связи</span>
      </div>
      <div className="portal-thread-body">
        {messages.map((message, index) => (
          <div className={`portal-message ${message.side}`} key={`${message.time}-${index}`}>
            <small>{message.name}</small><p>{message.text}</p><time>{message.time}</time>
          </div>
        ))}
      </div>
      <form className="portal-thread-form" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Попробуйте написать сообщение…" />
        <button type="submit">Отправить →</button>
      </form>
    </div>
  );
}

function AdminDemo() {
  const [tab, setTab] = useState<"overview" | "leads" | "team">("overview");
  const leads = [
    ["ЕК", "Егор Крылов", "Китай · Бакалавриат", "Новая", "new"],
    ["НС", "Наталья Соколова", "Гонконг · Магистратура", "Связались", "contacted"],
    ["МЛ", "Максим Ли", "Китай · Языковой год", "Целевая", "qualified"],
  ];

  return (
    <PortalShell demo user={demoUsers.admin} eyebrow="Операционный обзор" title="Панель поступлений" actions={<button className="portal-button primary compact">+ Пригласить</button>}>
      <DemoNotice />
      <DemoSwitch current="admin" />
      <div className="portal-tabs">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Обзор</button>
        <button className={tab === "leads" ? "active" : ""} onClick={() => setTab("leads")}>Заявки · 8</button>
        <button className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}>Ученики и кураторы</button>
      </div>
      {tab === "overview" && <>
        <section className="metric-grid">
          <article className="metric-card red"><span>Новые заявки</span><strong>8</strong><small>3 требуют ответа сегодня</small><i>↗</i></article>
          <article className="metric-card jade"><span>Ученики</span><strong>24</strong><small>активных траектории</small><i>◌</i></article>
          <article className="metric-card"><span>Кураторы</span><strong>6</strong><small>средняя загрузка 71%</small><i>人</i></article>
          <article className="metric-card dark"><span>Ближайшие дедлайны</span><strong>12</strong><small>в течение 14 дней</small><i>◎</i></article>
        </section>
        <section className="portal-two-columns">
          <div className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Сегодня в фокусе</span><h2>Свежие обращения</h2></div><button onClick={() => setTab("leads")}>Все заявки →</button></div>
            <div className="lead-mini-list">{leads.map(([initials, name, route, status, key]) => <div key={name}><span className="lead-avatar">{initials}</span><div><strong>{name}</strong><small>{route}</small></div><span className={`status-pill ${key}`}>{status}</span><time>сегодня</time></div>)}</div>
          </div>
          <div className="portal-card quality-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">Quality Ledger</span><h2>Контроль заявок</h2></div><span className="quality-score">2×</span></div>
            <div className="quality-ring"><span><strong>96%</strong><small>проверено в срок</small></span></div>
            <ul><li><i /> 18 документов прошли двойную проверку</li><li><i /> 4 источника требований обновлены</li><li><i /> 0 критичных просрочек</li></ul>
          </div>
        </section>
      </>}
      {tab === "leads" && <section className="portal-card"><div className="portal-card-head"><div><span className="portal-eyebrow">Воронка консультаций</span><h2>Заявки с сайта</h2></div><span>8 активных</span></div><div className="portal-table"><div className="portal-table-row header"><span>Абитуриент</span><span>Профиль</span><span>Контакт</span><span>Создана</span><span>Статус</span></div>{leads.map(([, name, route, status, key], index) => <div className="portal-table-row" key={name}><span><strong>{name}</strong><small>#{1048 - index}</small></span><span><strong>{route.split(" · ")[0]}</strong><small>{route.split(" · ")[1]} · 2027</small></span><span>Telegram подтверждён</span><span>28 июля</span><span className={`status-pill ${key}`}>{status}</span></div>)}</div></section>}
      {tab === "team" && <section className="portal-team-grid"><div className="portal-card"><div className="portal-card-head"><div><span className="portal-eyebrow">Распределение нагрузки</span><h2>Назначить куратора</h2></div></div><div className="demo-assignment"><span>Егор Крылов</span><b>→</b><span>Анна Лебедева</span><button className="portal-button primary">Назначить</button></div></div><div className="portal-card"><div className="portal-card-head"><div><span className="portal-eyebrow">Команда сопровождения</span><h2>Активность сегодня</h2></div></div><div className="people-grid">{[["АЛ","Анна Лебедева","6 учеников"],["МЧ","Максим Чэнь","5 учеников"],["ОД","Ольга Демина","4 ученика"],["КВ","Кирилл Ван","5 учеников"]].map(([initials,name,load]) => <article key={name}><span>{initials}</span><div><strong>{name}</strong><small>{load}</small></div><em>Куратор</em></article>)}</div></div></section>}
    </PortalShell>
  );
}

const students = [
  { id: 1, initials: "АМ", name: "Алина Морозова", route: "Гонконг · Бакалавриат", progress: 68, tasks: 3 },
  { id: 2, initials: "ЕК", name: "Егор Крылов", route: "Китай · Бакалавриат", progress: 42, tasks: 5 },
  { id: 3, initials: "НС", name: "Наталья Соколова", route: "Гонконг · Магистратура", progress: 81, tasks: 2 },
];

function MentorDemo() {
  const [selected, setSelected] = useState(1);
  const [tab, setTab] = useState<"students" | "chat">("students");
  const active = useMemo(() => students.find((student) => student.id === selected) ?? students[0], [selected]);
  return (
    <PortalShell demo user={demoUsers.mentor} eyebrow="Кураторский контур" title="Мои ученики" actions={<button className="portal-button primary compact">+ Новая задача</button>}>
      <DemoNotice /><DemoSwitch current="mentor" />
      <div className="portal-tabs"><button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>Ученики · 3</button><button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Диалоги · 4</button></div>
      {tab === "students" ? <section className="mentor-work-grid">
        <div className="mentor-student-list"><div className="mentor-list-head"><span className="portal-eyebrow">Ваш портфель</span><strong>Активные траектории</strong></div>{students.map((student) => <button className={selected === student.id ? "active" : ""} onClick={() => setSelected(student.id)} key={student.id}><span className="lead-avatar">{student.initials}</span><div><strong>{student.name}</strong><small>{student.route}</small></div><em>{student.tasks} задач</em></button>)}</div>
        <div className="mentor-student-focus"><div className="student-focus-top"><div><span className="portal-eyebrow light">Траектория ученика</span><h2>{active.name}</h2><p>{active.route}</p></div><div className="focus-progress"><strong>{active.progress}%</strong><small>готовность</small></div></div><div className="focus-details"><article><span>Стратегия</span><strong>Target + 2 Safe</strong></article><article><span>Набор</span><strong>Fall 2027</strong></article><article><span>Ближайший дедлайн</span><strong>18 сентября</strong></article><article><span>Открыто задач</span><strong>{active.tasks}</strong></article></div><div className="mentor-focus-actions"><button className="portal-button primary">Поставить задачу</button><button className="portal-button ghost" onClick={() => setTab("chat")}>Открыть диалог →</button></div><div className="mentor-standard"><span>质量</span><div><strong>Следующая проверка: мотивационное письмо</strong><p>После куратора документ подтвердит координатор.</p></div></div></div>
      </section> : <section className="portal-card chat-card"><DemoChat /></section>}
    </PortalShell>
  );
}

function StudentDemo() {
  const [tab, setTab] = useState<"route" | "tasks" | "chat">("route");
  const [done, setDone] = useState([true, false, false]);
  const tasks = [
    ["Паспорт и академическая справка", "Загрузить цветные сканы без обрезанных краёв", "12 августа"],
    ["Черновик мотивационного письма", "Собрать историю вокруг интереса к аналитике", "18 августа"],
    ["Подтверждение английского", "Записаться на IELTS или загрузить сертификат", "2 сентября"],
  ];
  return (
    <PortalShell demo user={demoUsers.student} eyebrow="Личная траектория" title="Привет, Алина!">
      <DemoNotice /><DemoSwitch current="student" />
      <div className="student-hero"><div><span className="portal-eyebrow light">Ваш маршрут</span><h2>Гонконг · Business Analytics</h2><p>Три target-программы, одна ambitious и две safe. Команда видит тот же план и следит за дедлайнами.</p></div><div className="student-progress"><span style={{ "--progress": "68%" } as React.CSSProperties}><strong>68%</strong><small>готовность</small></span></div><div className="student-hero-stamp">一步<br /><small>за шагом</small></div></div>
      <div className="portal-tabs student-tabs"><button className={tab === "route" ? "active" : ""} onClick={() => setTab("route")}>Маршрут</button><button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>Задачи · 3</button><button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Команда</button></div>
      {tab === "route" && <section className="student-route-grid"><div className="portal-card"><div className="portal-card-head"><div><span className="portal-eyebrow">Ближайшие шаги</span><h2>Что сейчас в работе</h2></div><span>2/5 этапов готово</span></div><div className="route-timeline">{[["Диагностика профиля","Сильные стороны и ограничения зафиксированы.","done"],["Shortlist программ","Эксперт подтверждает требования шести программ.","in_progress"],["Пакет документов","Начнётся после утверждения shortlist.","todo"],["Подача заявок","Контроль форм, оплат и подтверждений.","todo"]].map(([title,text,status], index) => <article className={status} key={title}><span>{status === "done" ? "✓" : index + 1}</span><div><strong>{title}</strong><p>{text}</p>{status === "in_progress" && <small>экспертная проверка · до 4 августа</small>}</div></article>)}</div></div><aside className="portal-card mentor-card"><span className="mentor-card-orbit">◌</span><span className="portal-eyebrow">Ваш человек рядом</span><div className="mentor-avatar">А</div><h2>Анна Лебедева</h2><p>Личный куратор по Гонконгу. Проверяет стратегию и помогает держать спокойный темп.</p><button className="portal-button ghost wide" onClick={() => setTab("chat")}>Написать куратору →</button></aside></section>}
      {tab === "tasks" && <section className="portal-card"><div className="portal-card-head"><div><span className="portal-eyebrow">Рабочий список</span><h2>Задачи поступления</h2></div><span>{done.filter(Boolean).length}/3 выполнено</span></div><div className="student-task-list">{tasks.map(([title,text,date], index) => <article key={title}><button className={`task-check ${done[index] ? "done" : ""}`} onClick={() => setDone((current) => current.map((value, item) => item === index ? !value : value))}>{done[index] ? "✓" : ""}</button><div><strong>{title}</strong><p>{text}</p></div><span className={`status-pill ${done[index] ? "done" : index === 1 ? "in_progress" : ""}`}>{done[index] ? "Готово" : index === 1 ? "В работе" : "К выполнению"}</span><time>{date}</time></article>)}</div></section>}
      {tab === "chat" && <section className="portal-card chat-card"><DemoChat /></section>}
    </PortalShell>
  );
}

export function DemoDashboard({ role }: { role: DemoRole }) {
  if (role === "admin") return <AdminDemo />;
  if (role === "mentor") return <MentorDemo />;
  return <StudentDemo />;
}
