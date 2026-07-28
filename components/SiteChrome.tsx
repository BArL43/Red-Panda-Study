"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/countries", label: "Страны" },
  { href: "/universities", label: "Университеты" },
  { href: "/services", label: "Как мы помогаем" },
  { href: "/stories", label: "Истории" },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Red Panda Study — на главную">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-ear brand-ear-left" />
        <span className="brand-ear brand-ear-right" />
        <span className="brand-face">
          <i />
          <i />
          <b />
        </span>
      </span>
      <span>Red Panda Study</span>
    </Link>
  );
}

type Message = { id?: number; sender_type: string; body: string };

function SupportChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conversationID, setConversationID] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    return Number(window.localStorage.getItem("rps_chat_id")) || null;
  });
  const [visitorToken, setVisitorToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("rps_chat_token") ?? "";
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      sender_type: "system",
      body: "Привет! Я Лин из Red Panda Study. Напишите вопрос — его увидит наша команда.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const refresh = useCallback(async () => {
    if (!conversationID || !visitorToken) return;
    try {
      const response = await fetch(`/api/v1/chat/conversations/${conversationID}?token=${encodeURIComponent(visitorToken)}`);
      if (!response.ok) return;
      const payload = await response.json();
      setMessages(payload.messages ?? []);
    } catch {
      // Polling resumes automatically when the connection returns.
    }
  }, [conversationID, visitorToken]);

  useEffect(() => {
    if (!open || !conversationID) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [open, conversationID, refresh]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError("");
    setDraft("");
    try {
      let id = conversationID;
      let token = visitorToken;
      if (!id || !token) {
        const created = await fetch("/api/v1/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: "Гость сайта", subject: clean.slice(0, 80) }),
        });
        if (!created.ok) throw new Error("Не удалось открыть чат");
        const payload = await created.json();
        id = payload.conversation.id;
        token = payload.visitor_token;
        setConversationID(id);
        setVisitorToken(token);
        window.localStorage.setItem("rps_chat_id", String(id));
        window.localStorage.setItem("rps_chat_token", token);
      }
      const response = await fetch(`/api/v1/chat/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: clean }),
      });
      if (!response.ok) throw new Error("Сообщение не отправлено");
      const payload = await response.json();
      setMessages((current) => [...current, payload.message]);
      window.setTimeout(refresh, 250);
    } catch (sendError) {
      setDraft(clean);
      setError(sendError instanceof Error ? sendError.message : "Не удалось отправить сообщение");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  return (
    <>
      <div className={`chat-window ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="chat-head">
          <span className="chat-avatar">Л</span>
          <span>
            <strong>Лин, поддержка</strong>
            <small><i /> Обычно отвечаем быстро</small>
          </span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть чат">
            ×
          </button>
        </div>
        <div className="chat-body">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.sender_type === "visitor" ? "user" : "support"}`} key={message.id ?? index}>
              {message.body}
            </div>
          ))}
          {messages.length === 1 && (
            <div className="chat-prompts">
              {["Подобрать университет", "Оценить мои шансы", "Узнать про стоимость"].map((prompt) => (
                <button type="button" key={prompt} onClick={() => send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
        {error && <div className="chat-error">{error}</div>}
        <form className="chat-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ваш вопрос…"
            aria-label="Сообщение поддержке"
          />
          <button type="submit" disabled={busy} aria-label="Отправить сообщение">{busy ? "…" : "→"}</button>
        </form>
      </div>
      <button
        type="button"
        className={`chat-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Закрыть чат поддержки" : "Открыть чат поддержки"}
      >
        <span className="chat-trigger-avatar">{open ? "×" : "Л"}</span>
        <span className="chat-trigger-copy">
          <b>{open ? "Закрыть" : "Есть вопрос?"}</b>
          {!open && <small>Мы на связи</small>}
        </span>
      </button>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-intro">
          <Brand />
          <p>Поступление в Азию — спокойно, последовательно и с человеком рядом.</p>
        </div>
        <div className="footer-column">
          <strong>Направления</strong>
          <Link href="/countries/china">Китай</Link>
          <Link href="/countries/hong-kong">Гонконг</Link>
          <span className="muted-link">Япония · скоро</span>
        </div>
        <div className="footer-column">
          <strong>Сервис</strong>
          <Link href="/universities">Университеты</Link>
          <Link href="/services">Сопровождение</Link>
          <Link href="/consultation">Бесплатная диагностика</Link>
        </div>
        <div className="footer-column">
          <strong>Связаться</strong>
          <a href="mailto:hello@redpandastudy.com">hello@redpandastudy.com</a>
          <span>Telegram · WhatsApp</span>
          <span>Ежедневно, 10:00–20:00</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Red Panda Study</span>
        <span>Информация на сайте не является гарантией зачисления.</span>
      </div>
    </footer>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const portal = ["/admin", "/student", "/mentor", "/invite", "/demo"].some((prefix) => pathname.startsWith(prefix));
  const [menu, setMenu] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const transitionRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? Math.min(100, (window.scrollY / available) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const handleLink = (event: globalThis.MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const element = event.target as HTMLElement | null;
      const anchor = element?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin || `${next.pathname}${next.search}` === `${window.location.pathname}${window.location.search}`) return;

      event.preventDefault();
      if (transitionRef.current) return;

      transitionRef.current = true;
      setTransitioning(true);
      setMenu(false);

      window.setTimeout(() => {
        window.location.assign(`${next.pathname}${next.search}${next.hash}`);
      }, 390);

      window.setTimeout(() => {
        transitionRef.current = false;
        setTransitioning(false);
      }, 2000);
    };

    document.addEventListener("click", handleLink, true);
    return () => document.removeEventListener("click", handleLink, true);
  }, []);

  return (
    <>
      {!portal && <header className="site-header">
        <Brand />
        <nav className={`main-nav ${menu ? "is-open" : ""}`} aria-label="Главная навигация">
          {nav.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={pathname.startsWith(item.href) ? "active" : ""}
              onClick={() => setMenu(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link className="mobile-consultation" href="/consultation" onClick={() => setMenu(false)}>
            Бесплатная диагностика
          </Link>
        </nav>
        <div className="header-actions">
          <Link className="header-chat-link" href="/consultation" aria-label="Задать вопрос">
            <span>?</span>
          </Link>
          <Link className="header-cta" href="/consultation">
            <span>На консультацию</span>
            <b>→</b>
          </Link>
          <button
            className={`menu-button ${menu ? "is-open" : ""}`}
            type="button"
            onClick={() => setMenu((value) => !value)}
            aria-expanded={menu}
            aria-label="Открыть меню"
          >
            <i /><i />
          </button>
        </div>
      </header>}
      {!portal && <div className="scroll-progress" aria-hidden="true"><i style={{ width: `${scrollProgress}%` }} /></div>}
      <main key={pathname} className={`page-enter ${portal ? "portal-main" : ""}`}>{children}</main>
      {!portal && <Footer />}
      {!portal && <SupportChat />}
      <div className={`paw-transition ${transitioning ? "is-active" : ""}`} aria-hidden="true">
        <div className="transition-wash" />
        <div className="paw-trail">
          {Array.from({ length: 6 }).map((_, index) => (
            <span className="paw-print" style={{ "--paw": index } as CSSProperties} key={index}>
              <i /><b /><em /><strong />
            </span>
          ))}
        </div>
        <span className="transition-copy">Идём дальше</span>
      </div>
    </>
  );
}
