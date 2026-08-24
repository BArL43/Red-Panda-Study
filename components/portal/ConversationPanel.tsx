"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, formatDate } from "./api";

type Conversation = {
  id: number;
  kind: string;
  subject: string;
  display_name: string;
  updated_at: string;
};

type Message = {
  id: number;
  sender_type: string;
  sender_name: string;
  body: string;
  created_at: string;
};

export function ConversationPanel({
  conversations,
  initialID,
}: {
  conversations: Conversation[];
  initialID?: number;
}) {
  const [selected, setSelected] = useState(initialID ?? conversations[0]?.id ?? 0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cursorRef = useRef(0);
  const selectionRef = useRef(0);
  const effectiveSelected = conversations.some((item) => item.id === selected)
    ? selected
    : initialID && conversations.some((item) => item.id === initialID)
      ? initialID
      : conversations[0]?.id ?? 0;

  useEffect(() => {
    if (selectionRef.current === effectiveSelected) return;
    selectionRef.current = effectiveSelected;
    cursorRef.current = 0;
    setMessages([]);
  }, [effectiveSelected]);

  const appendMessages = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !known.has(message.id))];
    });
  }, []);

  const load = useCallback(async () => {
    if (!effectiveSelected) return;
    const selectedID = effectiveSelected;
    const afterID = cursorRef.current;
    try {
      const result = await api<{ messages: Message[]; next_after_id?: number }>(
        `/conversations/${selectedID}${afterID ? `?after_id=${afterID}` : ""}`,
      );
      if (selectionRef.current !== selectedID) return;
      if (afterID === 0 && cursorRef.current === 0) {
        setMessages(result.messages);
      } else {
        appendMessages(result.messages);
      }
      cursorRef.current = Number(result.next_after_id) || cursorRef.current;
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Чат недоступен");
    }
  }, [appendMessages, effectiveSelected]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const poll = async () => {
      await load();
      if (!cancelled) timer = window.setTimeout(() => void poll(), 7000);
    };
    timer = window.setTimeout(() => void poll(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !effectiveSelected) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ message: Message }>(`/conversations/${effectiveSelected}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: draft }),
      });
      appendMessages([result.message]);
      cursorRef.current = Math.max(cursorRef.current, result.message.id);
      setDraft("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Сообщение не отправлено");
    } finally {
      setBusy(false);
    }
  };

  if (!conversations.length) {
    return <div className="portal-empty"><span>◎</span><strong>Диалогов пока нет</strong><p>Новые обращения появятся здесь автоматически.</p></div>;
  }

  return (
    <div className="portal-chat-grid">
      <div className="portal-chat-list">
        {conversations.map((conversation) => (
          <button className={effectiveSelected === conversation.id ? "active" : ""} type="button" key={conversation.id} onClick={() => setSelected(conversation.id)}>
            <span>{conversation.display_name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{conversation.display_name}</strong>
              <small>{conversation.subject}</small>
            </div>
            <time>{formatDate(conversation.updated_at)}</time>
          </button>
        ))}
      </div>
      <div className="portal-chat-thread">
        <div className="portal-thread-head">
          <div><strong>{conversations.find((item) => item.id === effectiveSelected)?.display_name}</strong><small>Диалог защищён и хранится в истории проекта</small></div>
          <span className="online-pill">На связи</span>
        </div>
        <div className="portal-thread-body">
          {messages.map((message) => (
            <div className={`portal-message ${["visitor", "student"].includes(message.sender_type) ? "client" : "team"}`} key={message.id}>
              <small>{message.sender_name}</small>
              <p>{message.body}</p>
              <time>{new Date(message.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</time>
            </div>
          ))}
        </div>
        {error && <p className="portal-inline-error">{error}</p>}
        <form className="portal-thread-form" onSubmit={submit}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Напишите сообщение…" />
          <button type="submit" disabled={busy}>{busy ? "…" : "Отправить →"}</button>
        </form>
      </div>
    </div>
  );
}
