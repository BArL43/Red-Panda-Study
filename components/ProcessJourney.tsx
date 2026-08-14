"use client";

import { useEffect, useState } from "react";

const stages = [
  {
    label: "Диагностика",
    title: "Находим реальную стартовую точку",
    text: "На встрече разбираем оценки, язык, проекты, бюджет, сроки и карьерную цель. После созвона вы получаете письменное резюме — решения не остаются «на словах».",
    proof: ["Карта сильных и рискованных зон", "Сценарии Китай / Гонконг", "Первые следующие шаги"],
    owner: "Стратег + куратор",
  },
  {
    label: "Shortlist",
    title: "Собираем сбалансированный портфель",
    text: "Каждый университет проходит через матрицу соответствия: требования, академический fit, бюджет, дедлайны и запасной сценарий.",
    proof: ["Reach / Match / Safe логика", "Проверка требований", "Аргумент к каждому выбору"],
    owner: "Стратег",
  },
  {
    label: "Заявка",
    title: "Строим одну сильную историю",
    text: "CV, эссе, рекомендации и проекты работают как единая система. Мы не пишем за абитуриента — помогаем его голосу звучать ясно и убедительно.",
    proof: ["Storyline до первого драфта", "Несколько раундов обратной связи", "Единая логика документов"],
    owner: "Редактор + куратор",
  },
  {
    label: "Контроль",
    title: "Проверяем заявку в два уровня",
    text: "Перед подачей комплект проверяют куратор и второй специалист: содержание, формальные требования, названия файлов, переводы и поля кабинета.",
    proof: ["Чек-лист по каждому вузу", "Независимая финальная проверка", "Версионность документов"],
    owner: "Куратор + reviewer",
  },
  {
    label: "Решение",
    title: "Не исчезаем после кнопки Submit",
    text: "Отслеживаем статусы и запросы университетов, помогаем сравнить офферы и готовим индивидуальный план следующего этапа.",
    proof: ["Трекинг кабинетов", "Разбор условий оффера", "План до первого дня"],
    owner: "Личный куратор",
  },
];

function MiniPaw() {
  return <span className="mini-paw"><i /><i /><i /><b /></span>;
}

export function ProcessJourney() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stages.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const stage = stages[active];

  return (
    <section className="process-lab">
      <div className="section-shell">
        <div className="process-heading">
          <div>
            <span className="eyebrow eyebrow-light">Процесс в движении</span>
            <h2>Видно, что происходит. Понятно, кто отвечает.</h2>
          </div>
          <p>Вы не «передаёте документы агентству». Вы проходите управляемый процесс с понятными результатами на каждом этапе.</p>
        </div>
        <div className="process-board">
          <div className="process-rail" role="tablist" aria-label="Этапы сопровождения">
            <div className="process-line">
              <span style={{ height: `${(active / (stages.length - 1)) * 100}%` }} />
              <div className="moving-paw" style={{ top: `${(active / (stages.length - 1)) * 100}%` }}>
                <MiniPaw />
              </div>
            </div>
            {stages.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={active === index}
                className={active === index ? "active" : ""}
                onClick={() => setActive(index)}
                key={item.label}
              >
                <span>0{index + 1}</span>
                <b>{item.label}</b>
                <i>{active === index ? "Сейчас" : "Открыть"}</i>
              </button>
            ))}
          </div>
          <div className="process-stage" key={stage.label}>
            <div className="process-stage-top">
              <span>Этап 0{active + 1}</span>
              <span className="process-owner"><i /> {stage.owner}</span>
            </div>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
            <div className="process-deliverables">
              <strong>Что остаётся у вас</strong>
              {stage.proof.map((item) => (
                <span key={item}><b>✓</b>{item}</span>
              ))}
            </div>
            <div className="process-quality">
              <span>QUALITY CHECK</span>
              <div><i /><i /><i /><i /></div>
              <b>{active === 3 ? "Двойная проверка" : "Этап подтверждён"}</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
