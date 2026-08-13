"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { universitySummaries } from "@/lib/university-summaries";

const INITIAL_COUNT = 12;

const directionGroups = [
  { label: "Все направления", keywords: [] },
  { label: "IT и AI", keywords: ["computer", "ai", "data", "кибер", "программ", "software", "информац"] },
  { label: "Инженерия", keywords: ["инжен", "техн", "робот", "электр", "механ", "строитель", "авиац", "транспорт"] },
  { label: "Бизнес", keywords: ["бизнес", "эконом", "финанс", "менедж", "торгов", "маркет", "account"] },
  { label: "Медицина", keywords: ["медицин", "биомед", "стомат", "фарма", "health", "nursing", "психолог"] },
  { label: "Науки", keywords: ["физик", "хими", "математ", "биолог", "эколог", "science", "материал"] },
  { label: "Архитектура и дизайн", keywords: ["архитект", "дизайн", "градостро", "искусств", "медиа", "кино"] },
  { label: "Гуманитарные", keywords: ["право", "журналист", "коммуникац", "язык", "лингв", "педагог", "социаль", "human"] },
] as const;

function tuitionLabel(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function languageLabel(languages: readonly string[]) {
  const joined = languages.join(" ").toLowerCase();
  if (joined.includes("англий") && joined.includes("китай")) return "китайский / английский";
  if (joined.includes("англий")) return "английский";
  return "китайский";
}

function plural(value: number, forms: [string, string, string]) {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export function UniversityExplorer() {
  const [country, setCountry] = useState("Все");
  const [direction, setDirection] = useState("Все направления");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () =>
      universitySummaries.filter((item) => {
        const matchesCountry = country === "Все" || item.country === country;
        const selectedGroup = directionGroups.find((group) => group.label === direction);
        const directions = item.directions.join(" ").toLowerCase();
        const matchesDirection =
          !selectedGroup?.keywords.length ||
          selectedGroup.keywords.some((keyword) => directions.includes(keyword));
        const haystack = `${item.nameRu} ${item.nameEn} ${item.city} ${directions}`.toLowerCase();
        return matchesCountry && matchesDirection && haystack.includes(query.trim().toLowerCase());
      }),
    [country, direction, query],
  );

  const hasFilters = Boolean(query) || country !== "Все" || direction !== "Все направления";
  const visible = expanded || hasFilters ? filtered : filtered.slice(0, INITIAL_COUNT);

  return (
    <section className="section-shell explorer-section">
      <div className="catalog-intro-note">
        <span className="catalog-intro-mark">40</span>
        <div>
          <span className="eyebrow">Открытая карта</span>
          <h2>Сравните вузы до первой консультации.</h2>
          <p>
            В открытом каталоге видны направления, язык и ориентир стоимости. В личном кабинете —
            требования, экзамены, дедлайны и проверенный командой план поступления.
          </p>
        </div>
        <Link className="button button-primary" href="/consultation">Подобрать вуз <span>↗</span></Link>
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

      <div className="direction-filter" aria-label="Фильтр по направлениям">
        <span>Направление</span>
        <div>
          {directionGroups.map((group) => (
            <button
              type="button"
              className={direction === group.label ? "active" : ""}
              onClick={() => { setDirection(group.label); setExpanded(true); }}
              key={group.label}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <div className="explorer-meta">
        <span>{filtered.length} {plural(filtered.length, ["вуз", "вуза", "вузов"])} найдено</span>
        <span>Цены — ориентир «от», зависят от программы и курса валют</span>
      </div>

      <div className="catalog-grid public-university-grid">
        {visible.map((university, index) => (
          <article className="catalog-card public-university-card" key={university.nameRu}>
            <div className="catalog-card-top">
              <a
                className="university-logo"
                href={university.officialWebsite}
                target="_blank"
                rel="noreferrer"
                aria-label={`Официальный сайт: ${university.nameRu}`}
                title="Официальный сайт университета"
              >
                <span aria-hidden="true">{university.code.slice(0, 8)}</span>
                <img
                  src={university.logoUrl}
                  alt={`Логотип: ${university.nameRu}`}
                  width="64"
                  height="64"
                  loading="lazy"
                  onError={(event) => event.currentTarget.remove()}
                />
              </a>
              <span className="catalog-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <span className="catalog-country">{university.country} · {university.city}</span>
            <h2>{university.nameRu}</h2>
            <p className="catalog-name-en">{university.nameEn}</p>

            <div className="university-facts">
              <div className="university-price">
                <span>Обучение</span>
                <strong>от {tuitionLabel(university.tuitionFromRub)} ₽<small>/год</small></strong>
              </div>
              <div>
                <span>Язык программ</span>
                <strong>{languageLabel(university.languages)}</strong>
              </div>
              <div>
                <span>В базе RPS</span>
                <strong>{university.programCount} {plural(university.programCount, ["программа", "программы", "программ"])}</strong>
              </div>
            </div>

            <div className="catalog-directions" aria-label="Основные направления">
              {university.directions.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              {university.directions.length > 3 && <small>+{university.directions.length - 3}</small>}
            </div>
            <div className="catalog-card-bottom">
              <span>Требования доступны после диагностики</span>
              <Link href="/consultation">Разобрать шансы →</Link>
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
          <h2>По этим фильтрам ничего не найдено</h2>
          <p>Сбросьте направление или оставьте запрос — куратор проверит варианты шире каталога.</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => { setCountry("Все"); setDirection("Все направления"); setQuery(""); }}
          >
            Сбросить фильтры
          </button>
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
