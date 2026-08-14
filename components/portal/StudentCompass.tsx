"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  CompassAnalysis,
  CompassDestination,
  CompassField,
  CompassProfile,
  CompassProgramResult,
} from "../../lib/compass";

const currentYear = new Date().getFullYear();

const initialProfile: CompassProfile = {
  degree: "bachelor",
  field: "computer-science",
  destinations: ["china", "hong-kong"],
  gpaPercent: 82,
  ielts: null,
  toefl: null,
  hsk: null,
  sat: null,
  annualBudgetUsd: 35000,
  intakeYear: Math.max(2027, currentYear + 1),
  priorities: "",
};

const fieldLabels: Record<CompassField, string> = {
  "computer-science": "Computer Science / Data",
  business: "Бизнес и экономика",
  engineering: "Инженерия",
  "social-sciences": "Социальные науки",
  design: "Дизайн и new media",
};

const categoryLabels = {
  ambitious: { title: "Ambitious", subtitle: "Высокий конкурс", mark: "A" },
  target: { title: "Target", subtitle: "Основной портфель", mark: "T" },
  safe: { title: "Safe", subtitle: "Более устойчивый вариант", mark: "S" },
};

const destinationLabels: Record<CompassDestination, string> = {
  china: "Китай",
  "hong-kong": "Гонконг",
};

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function numberValue(value: string) {
  return value === "" ? null : Number(value);
}

function ProgramCard({ program }: { program: CompassProgramResult }) {
  const [expanded, setExpanded] = useState(false);
  const label = categoryLabels[program.category];
  return (
    <article className={`compass-program ${program.category}`}>
      <div className="compass-program-top">
        <span className="compass-category-mark">{label.mark}</span>
        <div>
          <span className="portal-eyebrow">{destinationLabels[program.destination]} · {program.city}</span>
          <h3>{program.university}</h3>
          <p>{program.name}</p>
        </div>
        <strong className="compass-score">{program.score}<small>% fit</small></strong>
      </div>
      <div className="compass-program-meta">
        <span><small>Категория</small><strong>{label.title}</strong></span>
        <span><small>Обучение / год</small><strong>{money.format(program.tuitionUsd)}</strong></span>
        <span><small>Весь год</small><strong>{money.format(program.annualCostUsd)}</strong></span>
      </div>
      <p className="compass-fit">{program.fit}</p>
      <div className="compass-checks">
        {program.ruleChecks.map((check) => (
          <span className={check.status} title={check.detail} key={check.key}>
            <i>{check.status === "pass" ? "✓" : check.status === "missing" ? "?" : "!"}</i>
            {check.label}
          </span>
        ))}
      </div>
      <button className="compass-expand" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        {expanded ? "Скрыть детали" : "Требования, риски и следующий шаг"} <span>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="compass-program-details">
          <div><small>Ориентир дедлайна</small><p>{program.deadlineHint}</p></div>
          <div><small>Главный риск</small><p>{program.risk}</p></div>
          <div><small>Следующий шаг</small><p>{program.nextAction}</p></div>
          <div>
            <small>Недостающие элементы</small>
            {program.missingItems.length
              ? <ul>{program.missingItems.map((item) => <li key={item}>{item}</li>)}</ul>
              : <p>Критичных формальных разрывов по анкете не найдено.</p>}
          </div>
          <div>
            <small>Базовый пакет документов</small>
            <ul>{program.documents.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <a href={program.sourceUrl} target="_blank" rel="noreferrer">Открыть официальную страницу ↗</a>
        </div>
      )}
    </article>
  );
}

type CompassProviderStatus = {
  configured: boolean;
  available: boolean;
  provider: string;
  model: string;
};

export function StudentCompass({ userId }: { userId: number }) {
  const storageKey = `red-panda-compass:${userId}`;
  const [profile, setProfile] = useState<CompassProfile>(initialProfile);
  const [analysis, setAnalysis] = useState<CompassAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [providerStatus, setProviderStatus] = useState<CompassProviderStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/compass/status", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<CompassProviderStatus>;
      })
      .then((status) => {
        if (status) setProviderStatus(status);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (!saved) return;
        const value = JSON.parse(saved) as { profile?: CompassProfile; analysis?: CompassAnalysis };
        if (value.profile) setProfile(value.profile);
        if (value.analysis) setAnalysis(value.analysis);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const categoryGroups = useMemo(() => {
    if (!analysis) return [];
    return (["ambitious", "target", "safe"] as const)
      .map((category) => ({
        category,
        programs: analysis.programs.filter((program) => program.category === category),
      }))
      .filter((group) => group.programs.length);
  }, [analysis]);

  const setDestination = (destination: CompassDestination) => {
    setProfile((current) => {
      const selected = current.destinations.includes(destination);
      if (selected && current.destinations.length === 1) return current;
      return {
        ...current,
        destinations: selected
          ? current.destinations.filter((item) => item !== destination)
          : [...current.destinations, destination],
      };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 120_000);
      const response = await fetch("/api/compass/analyze", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      }).finally(() => window.clearTimeout(timeout));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Compass не смог собрать стратегию");
      const result = payload.analysis as CompassAnalysis;
      setAnalysis(result);
      window.localStorage.setItem(storageKey, JSON.stringify({ profile, analysis: result }));
      window.setTimeout(() => document.getElementById("compass-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setError("Анализ занял слишком много времени. Повторите запрос через минуту.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить анализ");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyParentReport = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.parentReport);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Не удалось скопировать отчёт. Выделите текст вручную.");
    }
  };

  return (
    <div className="compass-workspace">
      <section className="compass-intro">
        <div>
          <span className="portal-eyebrow light">Red Panda Compass · AI</span>
          <h2>Цифровой двойник вашего поступления</h2>
          <p>Правила проверят формальные требования, бюджет и экзамены. ИИ объяснит выбор, сравнит сценарии и подготовит понятный отчёт для родителей.</p>
          <span className={`compass-provider-state ${providerStatus?.available ? "ready" : providerStatus ? "fallback" : "checking"}`}>
            {providerStatus?.available
              ? `AI подключён · ${providerStatus.model}`
              : providerStatus
                ? "Базовый анализ доступен · AI временно недоступен"
                : "Проверяем подключение AI…"}
          </span>
        </div>
        <div className="compass-intro-orbit" aria-hidden="true"><span>北</span><i /><b>AI</b></div>
      </section>

      <form className="portal-card compass-form" onSubmit={submit}>
        <div className="portal-card-head">
          <div><span className="portal-eyebrow">Анкета профиля</span><h2>Расскажите, с чем поступаем</h2></div>
          <span>Поля со звёздочкой обязательны</span>
        </div>
        <div className="compass-form-grid">
          <label>
            <span>Уровень *</span>
            <select value={profile.degree} onChange={(event) => setProfile({ ...profile, degree: event.target.value as CompassProfile["degree"] })}>
              <option value="bachelor">Бакалавриат</option>
              <option value="master">Магистратура</option>
            </select>
          </label>
          <label>
            <span>Направление *</span>
            <select value={profile.field} onChange={(event) => setProfile({ ...profile, field: event.target.value as CompassField })}>
              {Object.entries(fieldLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <fieldset className="compass-destinations">
            <legend>География *</legend>
            <div>
              {(["china", "hong-kong"] as const).map((destination) => (
                <button
                  className={profile.destinations.includes(destination) ? "selected" : ""}
                  type="button"
                  onClick={() => setDestination(destination)}
                  aria-pressed={profile.destinations.includes(destination)}
                  key={destination}
                >
                  <i>{profile.destinations.includes(destination) ? "✓" : ""}</i>{destinationLabels[destination]}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            <span>Год поступления *</span>
            <select value={profile.intakeYear} onChange={(event) => setProfile({ ...profile, intakeYear: Number(event.target.value) })}>
              {Array.from({ length: 7 }, (_, index) => Math.max(2026, currentYear) + index).map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
          </label>
          <label>
            <span>Средний балл, % *</span>
            <input type="number" min="40" max="100" required value={profile.gpaPercent} onChange={(event) => setProfile({ ...profile, gpaPercent: Number(event.target.value) })} />
          </label>
          <label>
            <span>Бюджет на год, USD *</span>
            <input type="number" min="5000" max="200000" step="1000" required value={profile.annualBudgetUsd} onChange={(event) => setProfile({ ...profile, annualBudgetUsd: Number(event.target.value) })} />
          </label>
          <label>
            <span>IELTS</span>
            <input type="number" min="0" max="9" step=".5" placeholder="Например, 6.5" value={profile.ielts ?? ""} onChange={(event) => setProfile({ ...profile, ielts: numberValue(event.target.value) })} />
          </label>
          <label>
            <span>TOEFL iBT</span>
            <input type="number" min="0" max="120" placeholder="Например, 90" value={profile.toefl ?? ""} onChange={(event) => setProfile({ ...profile, toefl: numberValue(event.target.value) })} />
          </label>
          <label>
            <span>HSK</span>
            <input type="number" min="1" max="6" placeholder="Уровень 1–6" value={profile.hsk ?? ""} onChange={(event) => setProfile({ ...profile, hsk: numberValue(event.target.value) })} />
          </label>
          <label>
            <span>SAT</span>
            <input type="number" min="400" max="1600" placeholder="Если сдавали" value={profile.sat ?? ""} onChange={(event) => setProfile({ ...profile, sat: numberValue(event.target.value) })} />
          </label>
          <label className="compass-wide-field">
            <span>Приоритеты и ограничения</span>
            <textarea maxLength={800} rows={4} placeholder="Например: только англоязычная программа, важна стипендия, хочу большой город и сильную стажировочную базу." value={profile.priorities} onChange={(event) => setProfile({ ...profile, priorities: event.target.value })} />
          </label>
        </div>
        {error && <p className="portal-banner-error">{error}<button type="button" onClick={() => setError("")}>×</button></p>}
        <div className="compass-submit-row">
          <p><strong>Двойная проверка:</strong> сначала формальные правила, затем AI-пояснение. Итог не является гарантией оффера.</p>
          <button className="portal-button primary" type="submit" disabled={loading}>
            {loading ? <><span className="compass-spinner" /> Строим цифровой двойник…</> : "Собрать стратегию →"}
          </button>
        </div>
      </form>

      {analysis && (
        <div className="compass-results" id="compass-result">
          <section className="portal-card compass-summary">
            <div>
              <span className={`compass-mode ${analysis.mode}`}>
                <i /> {analysis.mode === "ai" ? `AI + rules · ${analysis.model}` : "Rules engine · AI ожидает ключ"}
              </span>
              <h2>{analysis.summary}</h2>
              <p>{analysis.notice}</p>
            </div>
            <dl>
              <div><dt>Программ</dt><dd>{analysis.programs.length}</dd></div>
              <div><dt>Каталог</dt><dd>{analysis.catalogVersion}</dd></div>
              <div><dt>Проверок</dt><dd>{analysis.programs.length * 4}</dd></div>
            </dl>
          </section>

          {categoryGroups.map((group) => (
            <section className="compass-category" key={group.category}>
              <div className="compass-category-head">
                <span>{categoryLabels[group.category].mark}</span>
                <div><h2>{categoryLabels[group.category].title}</h2><p>{categoryLabels[group.category].subtitle} · {group.programs.length}</p></div>
              </div>
              <div className="compass-program-list">
                {group.programs.map((program) => <ProgramCard program={program} key={program.id} />)}
              </div>
            </section>
          ))}

          <section className="portal-card">
            <div className="portal-card-head"><div><span className="portal-eyebrow">What if</span><h2>Сценарии изменения профиля</h2></div></div>
            <div className="compass-scenarios">
              {analysis.scenarios.map((scenario, index) => (
                <article key={`${scenario.title}-${index}`}>
                  <span>0{index + 1}</span>
                  <h3>{scenario.title}</h3>
                  <strong>{scenario.change}</strong>
                  <p>{scenario.effect}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="compass-report-grid">
            <article className="portal-card compass-parent-report">
              <div className="portal-card-head">
                <div><span className="portal-eyebrow">Для семьи</span><h2>Отчёт для родителей</h2></div>
                <button type="button" onClick={copyParentReport}>{copied ? "Скопировано ✓" : "Копировать"}</button>
              </div>
              <p>{analysis.parentReport}</p>
            </article>
            <aside className="portal-card compass-expert-card">
              <span className="portal-eyebrow">Следующая проверка</span>
              <h2>Вопросы эксперту</h2>
              <ol>{analysis.questionsForExpert.map((question) => <li key={question}>{question}</li>)}</ol>
              <p>Compass не заменяет финальную верификацию требований и стратегии человеком.</p>
            </aside>
          </section>
        </div>
      )}
    </div>
  );
}
