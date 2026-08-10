"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { logout, SessionUser } from "./api";

const roleLabels = { admin: "Администратор", student: "Ученик", mentor: "Наставник" };

export type PortalNavigationItem = {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
};

export function PortalShell({
  user,
  title,
  eyebrow,
  children,
  actions,
  navigation = [],
  demo = false,
}: {
  user: SessionUser;
  title: string;
  eyebrow: string;
  children: ReactNode;
  actions?: ReactNode;
  navigation?: PortalNavigationItem[];
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
          {navigation.map((item) => item.href ? (
            <Link className={item.active ? "active" : ""} href={item.href} key={item.key}>
              <i>{item.icon}</i><span className="portal-nav-label">{item.label}</span>
            </Link>
          ) : (
            <button className={item.active ? "active" : ""} type="button" onClick={item.onClick} key={item.key}>
              <i>{item.icon}</i><span className="portal-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="portal-sidebar-note">
          <span className="portal-note-paw">✦</span>
          <strong>Лин держит маршрут</strong>
          <p>Дедлайны, решения и проверки собраны в одной понятной траектории.</p>
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
