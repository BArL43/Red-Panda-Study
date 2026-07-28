"use client";

import { FormEvent, useState } from "react";
import { api } from "@/components/portal/api";

const questions = [
  { title: "Куда хотите поступать?", options: ["Китай", "Гонконг", "Хочу сравнить"] },
  { title: "Какой уровень обучения?", options: ["Бакалавриат", "Магистратура", "Языковая программа"] },
  { title: "Когда планируете начать?", options: ["2026", "2027", "Позже / не решил(а)"] },
];

export function LeadQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const choose = (answer: string) => {
    setAnswers((current) => [...current.slice(0, step), answer]);
    setStep((current) => current + 1);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      await api("/consultations", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          contact: form.get("contact"),
          country: answers[0],
          level: answers[1],
          intake: answers[2],
          notes: "",
        }),
      });
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="quiz-card quiz-success">
        <span className="success-icon">✓</span>
        <span className="eyebrow">Маршрут начат</span>
        <h2>Спасибо! Мы соберёмся с мыслями и вернёмся с первыми идеями.</h2>
        <p>Заявка сохранена. Координатор изучит ответы и свяжется с вами в рабочее время.</p>
        <button type="button" onClick={() => { setStep(0); setAnswers([]); setDone(false); }}>
          Пройти ещё раз
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <div className="quiz-progress">
        <span>{Math.min(step + 1, 4)} / 4</span>
        <div><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
      </div>
      {step < questions.length ? (
        <div className="quiz-question">
          <span className="eyebrow">Быстрая диагностика</span>
          <h2>{questions[step].title}</h2>
          <div className="quiz-options">
            {questions[step].options.map((option) => (
              <button type="button" onClick={() => choose(option)} key={option}>
                <span>{option}</span><b>→</b>
              </button>
            ))}
          </div>
          {step > 0 && <button className="quiz-back" type="button" onClick={() => setStep((value) => value - 1)}>← Назад</button>}
        </div>
      ) : (
        <form className="quiz-form" onSubmit={submit}>
          <span className="eyebrow">Последний шаг</span>
          <h2>Куда отправить первые рекомендации?</h2>
          <div className="answers-summary">
            {answers.map((answer) => <span key={answer}>{answer}</span>)}
          </div>
          <label>
            <span>Как к вам обращаться</span>
            <input name="name" required placeholder="Имя" />
          </label>
          <label>
            <span>Telegram или email</span>
            <input name="contact" required placeholder="@username или name@email.com" />
          </label>
          <label className="consent">
            <input type="checkbox" required />
            <span>Согласен(на) на обработку данных для связи по заявке</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={sending}>
            {sending ? "Отправляем…" : "Получить рекомендации"} <span>↗</span>
          </button>
          <button className="quiz-back" type="button" onClick={() => setStep(questions.length - 1)}>← Назад</button>
        </form>
      )}
    </div>
  );
}
