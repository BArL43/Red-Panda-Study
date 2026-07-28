"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const data = [
  { name: "Tsinghua University", city: "Пекин", country: "Китай", focus: "Engineering & Tech", level: "Бакалавриат · Магистратура", code: "TH" },
  { name: "Peking University", city: "Пекин", country: "Китай", focus: "Research & Humanities", level: "Бакалавриат · Магистратура", code: "PK" },
  { name: "Fudan University", city: "Шанхай", country: "Китай", focus: "Business & Economics", level: "Бакалавриат · Магистратура", code: "FU" },
  { name: "Shanghai Jiao Tong University", city: "Шанхай", country: "Китай", focus: "Engineering & Science", level: "Бакалавриат · Магистратура", code: "SJ" },
  { name: "Zhejiang University", city: "Ханчжоу", country: "Китай", focus: "Innovation & AI", level: "Бакалавриат · Магистратура", code: "ZU" },
  { name: "The University of Hong Kong", city: "Гонконг", country: "Гонконг", focus: "Research & Law", level: "Бакалавриат · Магистратура", code: "HK" },
  { name: "The Chinese University of Hong Kong", city: "Гонконг", country: "Гонконг", focus: "Business & Social Science", level: "Бакалавриат · Магистратура", code: "CU" },
  { name: "HKUST", city: "Гонконг", country: "Гонконг", focus: "Tech & Entrepreneurship", level: "Бакалавриат · Магистратура", code: "ST" },
];

export function UniversityExplorer() {
  const [country, setCountry] = useState("Все");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const matchesCountry = country === "Все" || item.country === country;
        const haystack = `${item.name} ${item.city} ${item.focus}`.toLowerCase();
        return matchesCountry && haystack.includes(query.toLowerCase());
      }),
    [country, query],
  );

  const toggleSave = (name: string) =>
    setSaved((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  return (
    <section className="section-shell explorer-section">
      <div className="explorer-toolbar">
        <div className="filter-tabs" role="group" aria-label="Фильтр по стране">
          {["Все", "Китай", "Гонконг"].map((item) => (
            <button
              type="button"
              className={country === item ? "active" : ""}
              onClick={() => setCountry(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, город или направление"
          />
        </label>
      </div>
      <div className="explorer-meta">
        <span>{filtered.length} университетов в подборке</span>
        <span>{saved.length ? `Сохранено: ${saved.length}` : "Сохраняйте интересные варианты"}</span>
      </div>
      <div className="catalog-grid">
        {filtered.map((university, index) => {
          const isSaved = saved.includes(university.name);
          return (
            <article className="catalog-card" key={university.name}>
              <div className="catalog-card-top">
                <span className="catalog-code">{university.code}</span>
                <button
                  type="button"
                  className={isSaved ? "saved" : ""}
                  onClick={() => toggleSave(university.name)}
                  aria-label={isSaved ? `Убрать ${university.name} из сохранённых` : `Сохранить ${university.name}`}
                >
                  {isSaved ? "♥" : "♡"}
                </button>
              </div>
              <span className="catalog-country">{university.country} · {university.city}</span>
              <h2>{university.name}</h2>
              <div className="catalog-tags">
                <span>{university.focus}</span>
                <span>{university.level}</span>
              </div>
              <div className="catalog-card-bottom">
                <span>Вариант {String(index + 1).padStart(2, "0")}</span>
                <Link href="/consultation">Добавить в мой маршрут →</Link>
              </div>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <span>⌕</span>
          <h2>Такого варианта пока нет</h2>
          <p>Оставьте запрос — мы проверим программы шире открытого каталога.</p>
          <Link className="button button-primary" href="/consultation">Оставить запрос</Link>
        </div>
      )}
    </section>
  );
}
