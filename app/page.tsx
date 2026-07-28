import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { HeroCompass } from "@/components/HeroCompass";
import { CompassFlow } from "@/components/CompassFlow";

const universities = [
  { name: "Tsinghua University", city: "Пекин", tag: "Инженерия · AI", mark: "TH" },
  { name: "Fudan University", city: "Шанхай", tag: "Бизнес · Экономика", mark: "FU" },
  { name: "The University of Hong Kong", city: "Гонконг", tag: "Исследования · Право", mark: "HK" },
  { name: "HKUST", city: "Гонконг", tag: "Tech · Entrepreneurship", mark: "ST" },
];

const steps = [
  ["01", "Разбираемся в целях", "Оцениваем профиль, бюджет, язык и карьерные планы — без шаблонных советов."],
  ["02", "Строим маршрут", "Собираем сбалансированный shortlist и календарь поступления с контрольными точками."],
  ["03", "Усиливаем заявку", "Работаем с эссе, документами и подачей так, чтобы профиль звучал убедительно."],
  ["04", "Остаёмся рядом", "Следим за решениями, помогаем выбрать оффер и подготовиться к переезду."],
];

export default function Home() {
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-new">NEW</span>
            <span>AI-навигатор Compass + экспертная проверка</span>
          </div>
          <h1>
            Ваш маршрут в лучшие университеты <em>Азии</em>
          </h1>
          <p>
            Получите персональную стратегию сразу: варианты ambitious, target и
            safe, честный бюджет и дедлайны. Затем эксперт проверит каждое решение.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/consultation">
              Построить мой маршрут <span>↗</span>
            </Link>
            <Link className="button button-secondary" href="/services">
              Как мы проверяем качество <span>→</span>
            </Link>
          </div>
          <div className="hero-proof-grid">
            <span><i>塔</i><b>Китай · Гонконг</b><small>проверенная база</small></span>
            <span><i>◷</i><b>Ответ за 5 минут</b><small>без ожидания звонка</small></span>
            <span><i>✓</i><b>Проверено экспертом</b><small>двойной контроль</small></span>
          </div>
        </div>
        <div className="hero-visual">
          <HeroCompass />
        </div>
        <span className="hero-scroll-cue">Прокрутите, чтобы увидеть маршрут <i /></span>
      </section>

      <section className="trust-strip">
        <div>
          <span>Профиль и цели</span><i />
          <span>Compass-анализ</span><i />
          <span>Экспертный shortlist</span><i />
          <span>Сильная заявка</span><i />
          <span>Контроль до зачисления</span>
        </div>
      </section>

      <CompassFlow />

      <section className="section-shell direction-section">
        <Reveal className="section-heading split-heading">
          <div>
            <span className="eyebrow">Два сильных направления</span>
            <h2>Выбираем не страну. Выбираем вашу траекторию.</h2>
          </div>
          <p>
            Сравниваем программы, среду, бюджет и карьерный потенциал — и
            объясняем разницу простым языком.
          </p>
        </Reveal>
        <div className="direction-grid">
          <Reveal className="direction-card direction-china">
            <div className="direction-top">
              <span className="country-index">01</span>
              <span className="country-code">CN</span>
            </div>
            <div className="direction-art china-art">
              <span className="sun" />
              <span className="building b1" />
              <span className="building b2" />
              <span className="building b3" />
            </div>
            <div className="direction-copy">
              <span>Материковый Китай</span>
              <h3>Масштаб, технологии и стипендии</h3>
              <p>Пекин · Шанхай · Ханчжоу · Нанкин</p>
              <Link href="/countries/china">Исследовать Китай <b>→</b></Link>
            </div>
          </Reveal>
          <Reveal className="direction-card direction-hk" delay={120}>
            <div className="direction-top">
              <span className="country-index">02</span>
              <span className="country-code">HK</span>
            </div>
            <div className="direction-art hk-art">
              <span className="skyline s1" />
              <span className="skyline s2" />
              <span className="skyline s3" />
              <span className="harbour" />
            </div>
            <div className="direction-copy">
              <span>Гонконг</span>
              <h3>Глобальная среда и английский язык</h3>
              <p>Бизнес · Tech · Research · Asia hub</p>
              <Link href="/countries/hong-kong">Исследовать Гонконг <b>→</b></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="journey-section">
        <div className="section-shell">
          <Reveal className="section-heading journey-heading">
            <span className="eyebrow eyebrow-light">Не просто консультация</span>
            <h2>Сложный процесс превращаем в понятный маршрут</h2>
          </Reveal>
          <div className="journey-grid">
            {steps.map(([number, title, text], index) => (
              <Reveal className="journey-step" delay={index * 90} key={number}>
                <span className="step-number">{number}</span>
                <div className="step-dot" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="journey-cta">
            <p>Не знаете, какой этап ваш?</p>
            <Link href="/consultation">Пройти диагностику за 5 минут <span>→</span></Link>
          </Reveal>
        </div>
      </section>

      <section className="section-shell university-section">
        <Reveal className="section-heading split-heading">
          <div>
            <span className="eyebrow">Ориентиры для старта</span>
            <h2>Университеты, с которых часто начинается shortlist</h2>
          </div>
          <Link className="text-link" href="/universities">Весь каталог <span>→</span></Link>
        </Reveal>
        <div className="university-list">
          {universities.map((university, index) => (
            <Reveal className="university-row" delay={index * 70} key={university.name}>
              <span className="uni-mark">{university.mark}</span>
              <div>
                <h3>{university.name}</h3>
                <p>{university.city}</p>
              </div>
              <span className="uni-tag">{university.tag}</span>
              <Link href="/universities" aria-label={`Подробнее о ${university.name}`}>↗</Link>
            </Reveal>
          ))}
        </div>
        <p className="data-note">
          Подбор не ограничен этим списком: финальные требования и сроки всегда проверяем под конкретный набор.
        </p>
      </section>

      <section className="section-shell story-section">
        <Reveal className="story-card">
          <div className="story-visual">
            <span className="story-stamp">RPS / 01</span>
            <div className="story-portrait">
              <span>АМ</span>
            </div>
            <div className="story-dots"><i /><i /><i /></div>
          </div>
          <div className="story-copy">
            <span className="eyebrow">История поступления</span>
            <blockquote>
              «Я думала, что мой профиль слишком обычный. Команда помогла
              увидеть в нём сильную историю и собрать спокойную стратегию».
            </blockquote>
            <div className="story-person">
              <span>
                <strong>Алина М.</strong>
                <small>Поступление в Гонконг · Business Analytics</small>
              </span>
              <Link href="/stories">Читать историю <b>→</b></Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section-shell final-cta-section">
        <Reveal className="final-cta">
          <div>
            <span className="eyebrow eyebrow-light">Начнём с главного</span>
            <h2>Узнайте, какие университеты подходят именно вам</h2>
            <p>За 30 минут разберём профиль и наметим первые шаги. Без давления и обязательств.</p>
          </div>
          <Link className="button button-ivory" href="/consultation">
            Записаться на диагностику <span>↗</span>
          </Link>
          <span className="cta-watermark">熊猫</span>
        </Reveal>
      </section>
    </>
  );
}
