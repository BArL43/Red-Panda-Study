import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { ProcessJourney } from "@/components/ProcessJourney";

export const metadata: Metadata = {
  title: "Как мы помогаем",
  description: "Форматы сопровождения поступления Red Panda Study.",
};

const services = [
  ["Стратегия", "Аудит профиля, подбор стран и программ, shortlist и календарь.", ["Письменный стратегический отчёт", "Матрица университетов", "План дедлайнов"]],
  ["Сильная заявка", "Редактура истории, эссе, CV и логики всех документов.", ["Storyline до драфтов", "Раунды обратной связи", "Проверка связности комплекта"]],
  ["Подача и контроль", "Контроль кабинетов, коммуникаций и следующих действий.", ["Двойной pre-submit review", "Трекинг статусов", "Фиксация каждой версии"]],
  ["Решения и переезд", "Разбор офферов и подготовка к следующему этапу.", ["Сравнение условий", "План подготовки", "Связь до начала учёбы"]],
];

const packages = [
  {
    code: "00 · COMPASS",
    title: "Compass Snapshot",
    note: "первая карта · 5 минут",
    text: "Мгновенная стартовая точка: три сценария, ориентир по бюджету и список данных, которые стоит усилить.",
    includes: ["AI-анализ анкеты", "Ambitious / Target / Safe", "Предварительный бюджет", "Ключевые дедлайны", "Сценарий следующего шага"],
    meta: "Без звонка и обязательств",
  },
  {
    code: "01 · STRATEGY",
    title: "Panda Strategy",
    note: "разовый проект · 7–10 дней",
    text: "Для самостоятельного абитуриента, которому нужны объективная оценка и проверенный рабочий маршрут.",
    includes: ["90-минутная диагностика", "Shortlist до 10 программ", "Матрица Ambitious / Target / Safe", "Календарь и бюджет", "Экспертный отчёт и итоговый созвон"],
    meta: "Founding 20",
  },
  {
    code: "02 · CHINA",
    title: "China Degree",
    note: "до получения решений",
    text: "Полное поступление на бакалавриат или магистратуру в Китае с личным куратором и контролем каждой подачи.",
    includes: ["Всё из Panda Strategy", "До 5 заявок", "CV, эссе и рекомендации", "Двойная pre-submit проверка", "Контроль статусов и офферов", "Подготовка к следующему этапу"],
    meta: "Founding 20 · Китай",
    featured: true,
  },
  {
    code: "03 · HONG KONG",
    title: "Hong Kong Select",
    note: "до получения решений",
    text: "Усиленный портфель для конкурентных англоязычных программ Гонконга, включая интервью и работу с академической историей.",
    includes: ["До 5 заявок", "Стратегия позиционирования", "CV, эссе и рекомендации", "Интервью-подготовка", "Двойная проверка подач", "Сравнение условий офферов"],
    meta: "Founding 20 · Гонконг",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Как мы помогаем"
        title={<>Не делаем вместо вас. <em>Делаем сильнее вместе.</em></>}
        text="Вы сохраняете голос и принимаете решения. Мы даём структуру, обратную связь и профессиональный взгляд на каждом этапе."
        tone="paper"
        aside={<div className="service-hero-mark"><span>5</span><b>контрольных этапов маршрута</b></div>}
      />
      <ProcessJourney />
      <section className="section-shell services-list">
        <div className="services-intro">
          <span className="eyebrow">Глубина работы</span>
          <h2>У каждого этапа есть результат, а не просто «консультация»</h2>
        </div>
        {services.map(([title, text, points], index) => (
          <Reveal className="service-row" key={title as string}>
            <span className="service-number">0{index + 1}</span>
            <div className="service-title">
              <span>Этап маршрута</span>
              <h2>{title as string}</h2>
            </div>
            <p>{text as string}</p>
            <ul>
              {(points as string[]).map((point) => <li key={point}>{point}</li>)}
            </ul>
          </Reveal>
        ))}
      </section>
      <section className="quality-section">
        <div className="section-shell quality-grid">
          <Reveal className="quality-copy">
            <span className="eyebrow">Red Panda Quality Standard</span>
            <h2>Качество встроено в процесс</h2>
            <p>Мы не полагаемся на память одного специалиста. Для стратегии, документов и подачи есть критерии, чек-листы и независимая финальная проверка.</p>
            <Link className="button button-primary" href="/consultation">Обсудить мой маршрут <span>↗</span></Link>
          </Reveal>
          <Reveal className="quality-console" delay={100}>
            <div className="quality-console-head">
              <span><i /> QUALITY PASSPORT</span>
              <b>RPS / 2026</b>
            </div>
            <div className="quality-scan">
              <span className="scan-line" />
              {[
                ["Стратегический fit", "Проверено"],
                ["Формальные требования", "Проверено"],
                ["Логика документов", "Проверено"],
                ["Pre-submit review", "2 специалиста"],
              ].map(([label, status], index) => (
                <div className="quality-check" key={label}>
                  <span>0{index + 1}</span>
                  <b>{label}</b>
                  <i>✓ {status}</i>
                </div>
              ))}
            </div>
            <p>Каждое решение и версия фиксируются — вы всегда знаете, что готово и что будет дальше.</p>
          </Reveal>
        </div>
      </section>
      <section className="packages-section">
        <div className="section-shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow eyebrow-light">Форматы работы</span>
              <h2>Понятный объём. Формат под вашу задачу.</h2>
            </div>
            <p>Состав и стоимость сопровождения зависят от числа программ, сроков, языка документов и сложности профиля. Подберём формат после короткой диагностики.</p>
          </div>
          <div className="package-grid">
            {packages.map((item) => (
              <article className={`package-card ${item.featured ? "featured" : ""}`} key={item.title}>
                <span>{item.code}</span>
                {item.featured && <div className="featured-label">Основной формат</div>}
                <h3>{item.title}</h3>
                <Link className="package-price-request" href="/consultation">Запросить стоимость <span>↗</span></Link>
                <small>{item.note}</small>
                <p>{item.text}</p>
                <ul>{item.includes.map((point) => <li key={point}>{point}</li>)}</ul>
                <div className="package-footer">
                  <span>{item.meta}</span>
                  <Link href="/consultation">Обсудить формат →</Link>
                </div>
              </article>
            ))}
          </div>
          <div className="price-disclaimer">
            <span>Что оплачивается отдельно</span>
            <p>Сборы университетов, официальные переводы и нотариальные услуги, языковые экзамены, визовые и курьерские расходы не включены. До договора вы получите полный список возможных внешних затрат.</p>
          </div>
        </div>
      </section>
      <section className="section-shell faq-section">
        <span className="eyebrow">FAQ</span>
        <h2>Честные ответы до старта</h2>
        <div className="faq-list">
          {[
            ["Вы гарантируете поступление?", "Нет. Решение принимает университет. Мы можем гарантировать качество процесса, прозрачность стратегии и внимательную работу с заявкой."],
            ["Можно работать полностью онлайн?", "Да. Диагностика, созвоны, документы и контроль этапов организуются дистанционно."],
            ["Вы помогаете только сильным ученикам?", "Нет. Наша задача — оценить реальную стартовую точку и собрать сбалансированный маршрут без ложных обещаний."],
            ["Можно начать, если ещё не выбрана страна?", "Да. Сравнение Китая и Гонконга — нормальный первый этап, а не признак неготовности."],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span>+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
