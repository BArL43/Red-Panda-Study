"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { universitySummaries } from "@/lib/university-summaries";

const INITIAL_COUNT = 12;

export function UniversityExplorer() {
  const [country, setCountry] = useState("Все");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () =>
      universitySummaries.filter((item) => {
        const matchesCountry = country === "Все" || item.country === country;
        const haystack = `${item.nameRu} ${item.nameEn} ${item.city} ${item.directions.join(" ")}`.toLowerCase();
        return matchesCountry && haystack.includes(query.trim().toLowerCase());
      }),
    [country, query],
  );

  const visible = expanded || query || country !== "Все" ? filtered : filtered.slice(0, INITIAL_COUNT);

  return (
    <section className="section-shell explorer-section">
      <div className="catalog-intro-note">
        <span className="catalog-intro-mark">40</span>
        <div>
          <span className="eyebrow">Открытая карта</span>
          <h2>Смотрите все вузы. Подбирайте программу вместе с куратором.</h2>
          <p>
            Здесь — города и сильные направления. После диагностики в личном кабинете
            откроются 157 программ с экзаменами, документами, сроками и комментариями команды.
          </p>
        </div>
        <Link className="button button-primary" href="/consultation">Получить доступ <span>↗</span></Link>
      </div>

      <div className="explorer-toolbar">
        <div className="filter-tabs" role="group" aria-label="Фильтр по стране">
          {["Все", "Китай", "Гонконг"].map((item) => (
            <button
              type="button"
              className={country === item ? "active" : ""}
              onClick={() => { setCountry(item); setExpanded(true); }}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Поиск университета</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setExpanded(true); }}
            placeholder="Вуз, город или направление"
          />
        </label>
      </div>

      <div className="explorer-meta">
        <span>{filtered.length} вузов</span>
        <span>Требования обновляются и перепроверяются куратором</span>
      </div>

      <div className="catalog-grid public-university-grid">
        {visible.map((university, index) => (
          <article className="catalog-card public-university-card" key={university.nameRu}>
            <div className="catalog-card-top">
              <span className="catalog-code">{university.code.slice(0, 4)}</span>
              <span className="catalog-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <span className="catalog-country">{university.country} · {university.city}</span>
            <h2>{university.nameRu}</h2>
            <p className="catalog-name-en">{university.nameEn}</p>
            <div className="catalog-directions" aria-label="Основные направления">
              {university.directions.slice(0, 3).map((direction) => <span key={direction}>{direction}</span>)}
              {university.directions.length > 3 && <small>+{university.directions.length - 3}</small>}
            </div>
            <div className="catalog-card-bottom">
              <span>{university.programCount} {university.programCount === 1 ? "программа" : "программы"} в базе</span>
              <Link href="/consultation">Разобрать с куратором →</Link>
            </div>
          </article>
        ))}
      </div>

      {!expanded && filtered.length > INITIAL_COUNT && (
        <button className="catalog-more" type="button" onClick={() => setExpanded(true)}>
          Показать все {filtered.length} вузов <span>↓</span>
        </button>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <span>⌕</span>
          <h2>Такого варианта пока нет</h2>
          <p>Оставьте запрос — куратор проверит программы шире открытого каталога.</p>
          <Link className="button button-primary" href="/consultation">Оставить запрос</Link>
        </div>
      )}

      <div className="catalog-access-strip">
        <div>
          <span className="eyebrow eyebrow-light">Что остаётся внутри сопровождения</span>
          <h2>Не просто требования — решение, что делать именно вам</h2>
        </div>
        <ol>
          <li><b>01</b><span>Куратор сверяет программу и актуальный набор</span></li>
          <li><b>02</b><span>Compass сопоставляет требования с вашим профилем</span></li>
          <li><b>03</b><span>Команда превращает расхождения в план действий</span></li>
        </ol>
        <Link className="button button-ivory" href="/consultation">Начать с диагностики <span>↗</span></Link>
      </div>
    </section>
  );
}
