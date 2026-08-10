"use client";

import { useEffect, useMemo, useState } from "react";
import { universitySummaries } from "@/lib/university-summaries";
import type { UniversityProgram } from "@/lib/university-types";

const demoPrograms: UniversityProgram[] = [
  {
    id: 1, region: "Китай", universityRu: "Пекинский университет", universityEn: "Peking University", code: "PKU", city: "Пекин",
    direction: "Медицина", program: "MBBS (Bachelor of Medicine, Bachelor of Surgery)", degree: "Bachelor", intake: "2027", language: "Китайский",
    programUrl: "", gpa: "3.5/4.0 или эквивалент", subjects: "Biology, Chemistry, Mathematics, Physics", academicNotes: "Сильная успеваемость по естественным наукам",
    hskLevel: "HSK 5", hskTotal: "200", hskSections: "каждая секция 60+", ielts: "N/A", ieltsSections: "N/A", toefl: "N/A", toeflSections: "N/A",
    otherLanguageTest: "N/A", languageWaiver: "N/A", cscaRequired: "Да", cscaMath: "Mathematics", cscaPhysics: "Physics", cscaChemistry: "Chemistry", cscaChinese: "Chinese", cscaNotes: "Проходной балл устанавливается ежегодно",
    satRequired: "N/A", satMin: "N/A", actRequired: "N/A", actMin: "N/A", ibMin: "N/A", aLevel: "N/A", ap: "N/A", otherQualification: "Аттестат о полном среднем образовании",
    entranceExam: "Вступительный тест PKU (медицинский)", entranceExamMin: "Проходной балл устанавливается ежегодно", interview: "Да", portfolio: "Нет", essay: "Да", recommendations: "2",
    documents: "Паспорт, транскрипты, мотивационное письмо", restrictions: "18–25 лет, не гражданин КНР", compliance: "Медицинская справка и финансовая гарантия",
    applicationFee: "800 RMB (уточнять)", tuition: "45 000 RMB/год (ориентир)", scholarships: "CGS, PKU Scholarship", opens: "декабрь 2026 (ориентир)", deadline: "15 марта 2027 (ориентир)", scholarshipDeadline: "15 января 2027 (ориентир)",
    admissionsUrl: "", requirementsUrl: "", checkedAt: "2026-08-09", status: "Демо-фрагмент", notes: "Куратор повторно проверит CSCA и медицинские требования после открытия набора.",
  },
  {
    id: 2, region: "Китай", universityRu: "Пекинский университет", universityEn: "Peking University", code: "PKU", city: "Пекин",
    direction: "Экономика и менеджмент", program: "Bachelor of Economics", degree: "Bachelor", intake: "2027", language: "Китайский",
    programUrl: "", gpa: "3.5/4.0 или эквивалент", subjects: "Mathematics", academicNotes: "Сильный академический профиль и аналитические способности",
    hskLevel: "HSK 5", hskTotal: "200", hskSections: "каждая секция 60+", ielts: "N/A", ieltsSections: "N/A", toefl: "N/A", toeflSections: "N/A",
    otherLanguageTest: "N/A", languageWaiver: "N/A", cscaRequired: "Да", cscaMath: "Mathematics", cscaPhysics: "N/A", cscaChemistry: "N/A", cscaChinese: "Chinese", cscaNotes: "Проходной балл устанавливается ежегодно",
    satRequired: "N/A", satMin: "N/A", actRequired: "N/A", actMin: "N/A", ibMin: "N/A", aLevel: "N/A", ap: "N/A", otherQualification: "Аттестат о полном среднем образовании",
    entranceExam: "Вступительный тест PKU", entranceExamMin: "Проходной балл устанавливается ежегодно", interview: "Да", portfolio: "Нет", essay: "Да", recommendations: "2",
    documents: "Паспорт, транскрипты, мотивационное письмо", restrictions: "18–25 лет, не гражданин КНР", compliance: "Медицинская справка и финансовая гарантия",
    applicationFee: "800 RMB (уточнять)", tuition: "26 000 RMB/год (ориентир)", scholarships: "CGS, PKU Scholarship", opens: "декабрь 2026 (ориентир)", deadline: "15 марта 2027 (ориентир)", scholarshipDeadline: "15 января 2027 (ориентир)",
    admissionsUrl: "", requirementsUrl: "", checkedAt: "2026-08-09", status: "Демо-фрагмент", notes: "Куратор проверит формат вступительного теста после публикации правил набора.",
  },
];

const absent = new Set(["", "N/A", "Нет", "Не требуется", "Не указан"]);
const useful = (value: string) => !absent.has(value.trim());

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!useful(value)) return null;
  return <div className="requirement-row"><span>{label}</span><strong>{value}</strong></div>;
}

export function StudentUniversityLibrary({ onOpenChat, demo = false }: { onOpenChat?: () => void; demo?: boolean }) {
  const [country, setCountry] = useState("Все");
  const [query, setQuery] = useState("");
  const [requirements, setRequirements] = useState<UniversityProgram[]>(demo ? demoPrograms : []);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");
  const [university, setUniversity] = useState<string>(demoPrograms[0].universityRu);
  const availableNames = useMemo(() => new Set(requirements.map((item) => item.universityRu)), [requirements]);
  const availableUniversities = useMemo(() => universitySummaries.filter((item) => availableNames.has(item.nameRu)), [availableNames]);
  const matchingUniversities = useMemo(() => availableUniversities.filter((item) => {
    const countryMatch = country === "Все" || item.country === country;
    const text = `${item.nameRu} ${item.nameEn} ${item.city} ${item.directions.join(" ")}`.toLowerCase();
    return countryMatch && text.includes(query.trim().toLowerCase());
  }), [availableUniversities, country, query]);
  const [programId, setProgramId] = useState<number>(demoPrograms[0].id);
  const selectedPrograms = requirements.filter((item) => item.universityRu === university);
  const program = selectedPrograms.find((item) => item.id === programId) ?? selectedPrograms[0] ?? requirements[0];

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/universities/requirements", { credentials: "include", cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => ({})) as { programs?: UniversityProgram[]; error?: string };
        if (!response.ok || !payload.programs?.length) throw new Error(payload.error || "База требований недоступна");
        setRequirements(payload.programs);
        setUniversity(payload.programs[0].universityRu);
        setProgramId(payload.programs[0].id);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "База требований недоступна");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [demo]);

  const selectUniversity = (name: string) => {
    setUniversity(name);
    const next = requirements.find((item) => item.universityRu === name);
    if (next) setProgramId(next.id);
  };

  if (loading) return <div className="portal-card library-loading"><span className="loading-panda"><i /><b /></span><strong>Открываем базу требований</strong><p>Проверяем доступ и собираем программы…</p></div>;
  if (loadError || !program) return <div className="portal-card library-loading error"><span>!</span><strong>Не получилось открыть требования</strong><p>{loadError || "Данные временно недоступны"}</p></div>;

  const exams = [
    ["HSK", [program.hskLevel, program.hskTotal && `общий ${program.hskTotal}`, program.hskSections].filter(useful).join(" · ")],
    ["IELTS", [program.ielts, program.ieltsSections && `секции ${program.ieltsSections}`].filter(useful).join(" · ")],
    ["TOEFL iBT", [program.toefl, program.toeflSections && `секции ${program.toeflSections}`].filter(useful).join(" · ")],
    ["CSCA", [program.cscaRequired, program.cscaMath, program.cscaPhysics, program.cscaChemistry, program.cscaChinese, program.cscaNotes].filter(useful).join(" · ")],
    ["SAT / ACT", [program.satRequired, program.satMin, program.actRequired, program.actMin].filter(useful).join(" · ")],
    ["IB / A-level / AP", [program.ibMin, program.aLevel, program.ap].filter(useful).join(" · ")],
    ["Другой экзамен", [program.entranceExam, program.entranceExamMin].filter(useful).join(" · ")],
  ] as const;

  return (
    <section className="student-university-library">
      <div className="library-lead">
        <div><span className="portal-eyebrow light">База RPS · 157 программ</span><h2>Требования к поступлению</h2><p>Выберите программу — куратор поможет отделить обязательное от желательного и добавит пункты в ваш маршрут.</p></div>
        <span className="library-date"><i /> База проверена<br /><b>09 августа 2026</b></span>
      </div>

      <div className="library-layout">
        <aside className="library-browser portal-card">
          <div className="library-filters">
            <label><span className="sr-only">Поиск по вузам</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Вуз, город, направление" /></label>
            <div role="group" aria-label="Регион">
              {["Все", "Китай", "Гонконг"].map((item) => <button type="button" className={country === item ? "active" : ""} onClick={() => setCountry(item)} key={item}>{item}</button>)}
            </div>
          </div>
          <div className="library-university-list">
            {matchingUniversities.map((item) => (
              <button type="button" className={university === item.nameRu ? "active" : ""} onClick={() => selectUniversity(item.nameRu)} key={item.nameRu}>
                <span>{item.code.slice(0, 4)}</span><div><strong>{item.nameRu}</strong><small>{item.city} · {item.programCount} программ</small></div><i>→</i>
              </button>
            ))}
          </div>
        </aside>

        <div className="library-detail">
          <div className="program-heading portal-card">
            <div><span className="portal-eyebrow">{program.region} · {program.city}</span><h2>{program.universityRu}</h2><p>{program.universityEn}</p></div>
            <span className="program-code">{program.code.slice(0, 4)}</span>
            <div className="program-tabs" role="group" aria-label="Выбор программы">
              {selectedPrograms.map((item) => <button type="button" className={program.id === item.id ? "active" : ""} onClick={() => setProgramId(item.id)} key={item.id}>{item.direction}</button>)}
            </div>
          </div>

          <article className="program-sheet">
            <div className="program-sheet-title">
              <div><span>{program.degree} · набор {program.intake}</span><h3>{program.program}</h3><p>{program.language}</p></div>
              <span className="status-seal">RPS<br /><b>checked</b></span>
            </div>

            <div className="program-vitals">
              <div><span>Средний балл / GPA</span><strong>{program.gpa}</strong></div>
              <div><span>Стоимость обучения</span><strong>{program.tuition}</strong></div>
              <div><span>Основной дедлайн</span><strong>{program.deadline}</strong></div>
            </div>

            <div className="requirement-columns">
              <section><span className="requirement-number">01</span><h4>Академический профиль</h4><DetailRow label="Школьные предметы" value={program.subjects} /><DetailRow label="Дополнительные условия" value={program.academicNotes} /><DetailRow label="Другие квалификации" value={program.otherQualification} /></section>
              <section><span className="requirement-number">02</span><h4>Экзамены и язык</h4>{exams.map(([label, value]) => <DetailRow label={label} value={value} key={label} />)}<DetailRow label="Освобождение от теста" value={program.languageWaiver} /></section>
              <section><span className="requirement-number">03</span><h4>Пакет документов</h4><DetailRow label="Интервью" value={program.interview} /><DetailRow label="Портфолио / audition" value={program.portfolio} /><DetailRow label="Essay / Study Plan" value={program.essay} /><DetailRow label="Рекомендации" value={program.recommendations} /><DetailRow label="Документы" value={program.documents} /><DetailRow label="Ограничения" value={program.restrictions} /><DetailRow label="Справки и гарантии" value={program.compliance} /></section>
              <section><span className="requirement-number">04</span><h4>Бюджет и календарь</h4><DetailRow label="Application fee" value={program.applicationFee} /><DetailRow label="Стипендии" value={program.scholarships} /><DetailRow label="Открытие приёма" value={program.opens} /><DetailRow label="Дедлайн подачи" value={program.deadline} /><DetailRow label="Дедлайн стипендии" value={program.scholarshipDeadline} /></section>
            </div>

            <div className="curator-review-bar">
              <span className="curator-review-avatar">Л</span>
              <div><strong>Следующий шаг — проверка с куратором</strong><p>{program.notes || "Куратор сверит требования с вашим профилем и текущим набором, затем добавит задачи в маршрут."}</p></div>
              <button type="button" onClick={onOpenChat}>Обсудить с командой →</button>
            </div>

            <footer className="program-source-note">
              <span>Проверено: {program.checkedAt} · {program.status}</span>
              <span>Перед подачей команда повторно сверяет официальные источники.</span>
            </footer>
          </article>
        </div>
      </div>
    </section>
  );
}
