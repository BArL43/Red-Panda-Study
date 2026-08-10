"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

const routes = [
  {
    type: "Амбициозный",
    city: "Пекин",
    program: "AI & Computer Science",
    score: 68,
    tone: "coral",
  },
  {
    type: "Целевой",
    city: "Шанхай",
    program: "Business Analytics",
    score: 82,
    tone: "gold",
  },
  {
    type: "Надёжный",
    city: "Гонконг",
    program: "International Management",
    score: 94,
    tone: "jade",
  },
];

export function HeroCompass() {
  const [active, setActive] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % routes.length);
    }, 4400);
    return () => window.clearInterval(timer);
  }, []);

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 5, y: y * -4 });
  };

  const route = routes[active];

  return (
    <div
      id="compass-demo"
      className="compass-shell"
      ref={cardRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ "--tilt-x": `${tilt.y}deg`, "--tilt-y": `${tilt.x}deg` } as CSSProperties}
    >
      <div className="compass-card">
        <header className="compass-card-head">
          <span className="compass-emblem" aria-hidden="true">
            <i />
            <b>✦</b>
          </span>
          <div>
            <strong>Red Panda Compass</strong>
            <small>AI-навигация по программам Азии</small>
          </div>
          <span className="expert-stamp"><i /> Проверено экспертом</span>
        </header>

        <div className="compass-map">
          <div className="map-grain" />
          <svg className="map-route" viewBox="0 0 740 330" role="img" aria-label="Маршрут между Пекином, Шанхаем и Гонконгом">
            <path className="route-shadow" d="M145 120 C240 50 310 90 350 145 S475 162 525 245" />
            <path className="route-draw" d="M145 120 C240 50 310 90 350 145 S475 162 525 245" />
          </svg>
          <span className="map-origin"><i /><i /><i /><b /></span>
          {routes.map((item, index) => (
            <button
              type="button"
              className={`map-node map-node-${index} ${active === index ? "active" : ""}`}
              onClick={() => setActive(index)}
              aria-label={`Показать вариант: ${item.city}`}
              key={item.city}
            >
              <i />
              <span><b>{item.city}</b><small>{item.program}</small></span>
            </button>
          ))}
          <div className="score-card" key={route.city}>
            <span>Прогноз соответствия</span>
            <strong>{route.score}<sup>%</sup></strong>
            <div><i style={{ width: `${route.score}%` }} /></div>
            <small>После первичного анализа профиля</small>
          </div>
          <span className="map-label map-label-cn">КИТАЙ</span>
          <span className="map-label map-label-hk">ГОНКОНГ</span>
        </div>

        <div className="compass-recommendations">
          <div className="recommendation-legend">
            <span>Ваш первый shortlist</span>
            <small>3 стратегии · обновляется мгновенно</small>
          </div>
          <div className="recommendation-grid">
            {routes.map((item, index) => (
              <button
                type="button"
                className={`recommendation-card ${item.tone} ${active === index ? "active" : ""}`}
                onClick={() => setActive(index)}
                key={item.type}
              >
                <span>{item.type}</span>
                <strong>{item.city}</strong>
                <small>{item.program}</small>
                <div><i>fit</i><b>{item.score}%</b><em>→</em></div>
              </button>
            ))}
          </div>
        </div>

        <footer className="compass-card-foot">
          <span><i>¥</i><b>Бюджет</b><small>с учётом обучения и жизни</small></span>
          <span><i>文</i><b>Язык</b><small>IELTS · HSK · English</small></span>
          <span><i>⌁</i><b>Сценарии</b><small>что изменит ваш результат</small></span>
        </footer>
      </div>
      <span className="compass-float compass-float-one">Источник у каждой рекомендации</span>
      <span className="compass-float compass-float-two"><i /> дата проверки сохранена</span>
    </div>
  );
}
