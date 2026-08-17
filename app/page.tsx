import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { HeroCompass } from "@/components/HeroCompass";
import { CompassFlow } from "@/components/CompassFlow";
import { CohortCounter } from "@/components/CohortCounter";
import { PandaProductStage } from "@/components/PandaProductStage";
import { universitySummaries } from "@/lib/university-summaries";

const universities = universitySummaries.slice(0, 4).map((university) => ({
  name: university.nameRu,
  city: university.city,
  tag: university.directions.slice(0, 2).join(" · "),
  mark: university.code.slice(0, 2),
}));

const steps = [
  ["01", "Разбираемся в целях", "Оцениваем профиль, бюджет, язык и карьерные планы — без шаблонных советов."],
  ["02", "Строим маршрут", "Собираем сбалансированный shortlist и календарь поступления с контрольными точками."],
  ["03", "Усиливаем заявку", "Работаем с эссе, документами и подачей так, чтобы профиль звучал убедительно."],
  ["04", "Остаёмся рядом", "Следим за решениями, помогаем выбрать оффер и подготовиться к переезду."],
];

export default function Home() {
  return (
    <>
      <section className="hero panda-product-hero section-shell">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-new">RPS</span>
            <span>Compass AI + личная команда поступления</span>
          </div>
          <h1>Поступление, которое <em>можно контролировать</em></h1>
          <p>
            Собираем поступление в Китай и Гонконг в понятный маршрут: программы,
            документы, дедлайны и работа команды — в одном продукте.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/consultation">
              Построить мой маршрут <span>→</span>
            </Link>
            <Link className="button button-secondary" href="/services">
              Посмотреть тарифы <span>↗</span>
            </Link>
          </div>
        </div>
        <PandaProductStage />
      </section>

      <section className="section-shell panda-proof-strip" aria-label="Ключевые показатели сервиса">
        <article><strong>40</strong><span>университетов</span><p>Китай и Гонконг в единой проверенной базе.</p></article>
        <article><strong>157</strong><span>программ</span><p>Требования, стоимость и дедлайны внутри кабинета.</p></article>
        <article><strong>2×</strong><span>контроль</span><p>Compass ускоряет анализ, эксперт подтверждает решение.</p></article>
      </section>

      <div className="section-shell home-cohort-wrap">
        <CohortCounter compact />
      </div>

      <section className="home-compass-section" id="compass">
        <div className="section-shell home-compass-heading">
          <div>
            <span className="eyebrow">Red Panda Compass</span>
            <h2>Сначала видите варианты. Потом принимаете решение.</h2>
          </div>
          <div>
            <p>Compass собирает первую карту поступления: три уровня риска, бюджет, требования и точки усиления профиля.</p>
            <Link href="/consultation">Построить мою карту <span>→</span></Link>
          </div>
        </div>
        <div className="section-shell home-compass-stage">
          <HeroCompass />
        </div>
      </section>

      <CompassFlow />

      <section className="section-shell product-bento-section">
        <Reveal className="section-heading split-heading">
          <div>
            <span className="eyebrow">Весь маршрут в одном месте</span>
            <h2>Не набор чатов. Управляемый продукт.</h2>
          </div>
          <p>Compass, кабинет и команда работают как одна система — с понятными статусами и следующими действиями.</p>
        </Reveal>
        <div className="product-bento-grid">
          <Reveal className="product-bento-card product-bento-large">
            <span className="product-bento-index">01 · COMPASS</span>
            <div><strong>40</strong><small>университетов</small></div>
            <h3>Compass AI собирает три сценария поступления</h3>
            <p>Сопоставляет профиль с 157 программами, бюджетом и требованиями. Эксперт подтверждает итоговый shortlist.</p>
            <Link href="/consultation">Построить маршрут <b>→</b></Link>
          </Reveal>
          <Reveal className="product-bento-card" delay={70}>
            <span className="product-bento-index">02 · CABINET</span>
            <div className="bento-progress"><i /><i /><i /><i /></div>
            <h3>Личный кабинет</h3>
            <p>Задачи, документы, решения и прогресс не теряются в переписке.</p>
          </Reveal>
          <Reveal className="product-bento-card" delay={120}>
            <span className="product-bento-index">03 · DEADLINES</span>
            <div className="bento-date"><strong>21</strong><span>авг<br />2027</span></div>
            <h3>Контроль сроков</h3>
            <p>У каждого дедлайна есть ответственный и следующий шаг.</p>
          </Reveal>
          <Reveal className="product-bento-card product-bento-red" delay={170}>
            <span className="product-bento-index">04 · TEAM</span>
            <div className="bento-team"><i>А</i><i>М</i><i>+</i></div>
            <h3>Команда рядом</h3>
            <p>Куратор, стратег и редактор видят одну актуальную картину.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-shell quality-ledger-section">
        <Reveal className="quality-ledger-card">
          <div>
            <span className="eyebrow eyebrow-light">Стандарт Red Panda</span>
            <h2>Каждая важная точка проходит двойную проверку</h2>
            <p>Решение не считается готовым, пока его не проверили по содержанию и формальным требованиям.</p>
          </div>
          <strong className="quality-ledger-score">2×</strong>
          <ol>
            <li><b>01</b><span>Стратегия и shortlist</span><i>проверено</i></li>
            <li><b>02</b><span>Документы и версии</span><i>проверено</i></li>
            <li><b>03</b><span>Комплект перед подачей</span><i>проверено</i></li>
          </ol>
        </Reveal>
      </section>

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
            <h2>40 университетов — и не один готовый ответ</h2>
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
          В открытом каталоге видны все вузы. 157 программ, требования и персональные комментарии открываются в кабинете с куратором.
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
