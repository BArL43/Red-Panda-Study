"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { logout, SessionUser } from "./api";

const roleLabels = { admin: "Администратор", student: "Ученик", mentor: "Наставник" };

export function PortalShell({
  user,
  title,
  eyebrow,
  children,
  actions,
  demo = false,
}: {
  user: SessionUser;
  title: string;
  eyebrow: string;
  children: ReactNode;
  actions?: ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="portal">
      <aside className="portal-sidebar">
        <Link href="/" className="portal-brand">
          <span className="portal-panda"><i /><b /></span>
          <span>Red Panda<br />Study</span>
        </Link>
        <nav>
          <span className="active"><i>⌁</i> Рабочий стол</span>
          <span><i>◎</i> Сообщения</span>
          <span><i>✓</i> Этапы и задачи</span>
        </nav>
        <div className="portal-sidebar-note">
          <span className="portal-note-paw">●</span>
          <strong>Всё под контролем</strong>
          <p>История действий и прогресс сохраняются автоматически.</p>
        </div>
        {demo ? (
          <Link className="portal-logout" href="/">Вернуться на сайт ↗</Link>
        ) : (
          <button className="portal-logout" type="button" onClick={logout}>Выйти из кабинета ↗</button>
        )}
      </aside>
      <div className="portal-workspace">
        <header className="portal-topbar">
          <div>
            <span className="portal-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <div className="portal-top-actions">
            {demo && <span className="demo-mode-pill"><i /> Демо без входа</span>}
            {actions}
            <div className="portal-user">
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
              <div><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></div>
            </div>
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  );
}

export function LoadingPortal({ label = "Собираем рабочий стол" }: { label?: string }) {
  return (
    <div className="portal-loading">
      <span className="loading-panda"><i /><b /></span>
      <strong>{label}</strong>
      <p>Проверяем данные и последние изменения…</p>
    </div>
  );
}

export function PortalError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="portal-error-state">
      <span>!</span>
      <h2>Не получилось загрузить данные</h2>
      <p>{message}</p>
      {retry && <button className="portal-button primary" type="button" onClick={retry}>Попробовать снова</button>}
    </div>
  );
}
