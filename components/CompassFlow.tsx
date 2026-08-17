"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "./Reveal";

const stages = [
  ["01", "Профиль", "Оценки, язык, интересы, бюджет и желаемый набор"],
  ["02", "Compass", "Сравнивает требования и строит три реалистичных сценария"],
  ["03", "Эксперт", "Проверяет логику, риски и актуальность требований"],
  ["04", "Маршрут", "Вы получаете shortlist, бюджет, дедлайны и следующие шаги"],
];

export function CompassFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % stages.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="compass-flow-section">
      <div className="section-shell">
        <Reveal className="compass-flow-heading">
          <div>
            <span className="eyebrow eyebrow-light">Ответ без ожидания</span>
            <h2>От анкеты до первой стратегии — <em>за несколько минут</em></h2>
          </div>
          <div>
            <p>Compass делает первый анализ сразу. Эксперт отвечает за точность и финальное решение — технология ускоряет качество, а не заменяет его.</p>
            <Link href="/consultation">Попробовать Compass <span>↗</span></Link>
          </div>
        </Reveal>

        <div className="compass-flow">
          <div className="flow-line" aria-hidden="true"><i style={{ width: `${(active / (stages.length - 1)) * 100}%` }} /></div>
          {stages.map(([number, title, text], index) => (
            <button
              type="button"
              className={active === index ? "active" : ""}
              onClick={() => setActive(index)}
              key={number}
            >
              <span>{number}</span>
              <i>{index === 1 ? "✦" : index === 2 ? "✓" : "●"}</i>
              <strong>{title}</strong>
              <small>{text}</small>
            </button>
          ))}
          <span className="flow-paw" style={{ left: `${(active / (stages.length - 1)) * 100}%` }} aria-hidden="true">
            <i /><i /><i /><b />
          </span>
        </div>

        <Reveal className="compass-proof-card">
          <div>
            <span>QUALITY LEDGER / 2026</span>
            <strong>Почему рекомендациям можно доверять</strong>
          </div>
          <ul>
            <li><i>01</i><span><b>Источник</b>Требование и дата проверки</span></li>
            <li><i>02</i><span><b>Логика</b>Почему программа подходит</span></li>
            <li><i>03</i><span><b>Контроль</b>Подтверждение специалиста</span></li>
          </ul>
          <span className="proof-seal">双<br /><small>CHECKED</small></span>
        </Reveal>
      </div>
    </section>
  );
}
