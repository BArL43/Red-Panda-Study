import type { Metadata } from "next";
import Link from "next/link";
import { CohortCounter } from "@/components/CohortCounter";
import { PageHero } from "@/components/PageHero";
import { ProcessJourney } from "@/components/ProcessJourney";
import { Reveal } from "@/components/Reveal";
import { addOnPackages, annualPlans, externalCosts, individualAddOns, strategy } from "@/lib/rps-pricing";

export const metadata: Metadata = {
  title: "Тарифы и сопровождение",
  description: "RPS Strategy, годовые тарифы Start, Admission и Select, а также дополнительные услуги Red Panda Study.",
};

const services = [
  ["Стратегия", "Аудит профиля, выбор программ, shortlist и календарь.", ["Письменный стратегический отчёт", "Матрица университетов", "План дедлайнов"]],
  ["Сильная заявка", "Работа с историей, эссе, CV и логикой документов.", ["Storyline до драфтов", "Раунды обратной связи", "Проверка связности"]],
  ["Подача и контроль", "Контроль кабинетов, коммуникаций и следующих действий.", ["Pre-submit review", "Трекинг статусов", "Фиксация версий"]],
  ["Решения и переезд", "Разбор офферов и подготовка к следующему этапу.", ["Сравнение условий", "Виза и жильё", "Поддержка после приезда"]],
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Тарифы Red Panda Study"
        title={<>Выберите глубину поддержки. <em>Маршрут остаётся персональным.</em></>}
        text="От разовой стратегии до максимального сопровождения сложных заявок. Первый набор — только 16 учеников на три годовых тарифа."
        tone="paper"
        aside={<div className="service-hero-mark founding-mark"><span>16</span><b>мест в первом наборе</b><small>Start · Admission · Select</small></div>}
      />

      <div className="section-shell cohort-wrap"><CohortCounter /></div>

      <section className="section-shell services-list">
        <div className="services-intro"><span className="eyebrow">Как устроена работа</span><h2>У каждого этапа есть понятный результат</h2></div>
        {services.map(([title, text, points], index) => (
          <Reveal className="service-row" key={title as string}>
            <span className="service-number">0{index + 1}</span>
            <div className="service-title"><span>Этап маршрута</span><h2>{title as string}</h2></div>
            <p>{text as string}</p>
            <ul>{(points as string[]).map((point) => <li key={point}>{point}</li>)}</ul>
          </Reveal>
        ))}
      </section>

      <ProcessJourney />

      <section className="strategy-section" id="strategy">
        <div className="section-shell">
          <Reveal className="pricing-heading"><div><span className="eyebrow">Разовый формат · без лимита мест</span><h2>RPS Strategy</h2></div><p>Самостоятельное поступление с профессионально собранной стратегией и проверенной точкой старта.</p></Reveal>
          <article className="strategy-card">
            <div className="strategy-main">
              <span className="pricing-code">00 · PERSONAL ROUTE</span><h3>Стратегия, которую можно взять в работу</h3><p>{strategy.summary}</p>
              <div className="price-stack"><del>{strategy.regularPrice}</del><strong>{strategy.foundingPrice}</strong><small>цена первого набора</small></div>
              <Link className="button button-primary" href="/consultation">Заказать Strategy <span>↗</span></Link>
            </div>
            <div className="strategy-details">
              <strong>Что входит</strong><ul className="feature-columns">{strategy.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <details className="pricing-details excluded-details"><summary>Что выполняется самостоятельно <span>+</span></summary><div>{strategy.excluded.map((item) => <span key={item}>{item}</span>)}</div></details>
            </div>
          </article>
          <div className="strategy-upgrade"><span>↗</span><p><strong>Стоимость Strategy не пропадает.</strong> При переходе на Start, Admission или Select она полностью засчитывается в оплату годового тарифа — при наличии свободного места.</p></div>
        </div>
      </section>

      <section className="annual-pricing-section" id="annual-plans">
        <div className="section-shell">
          <div className="pricing-heading pricing-heading-light"><div><span className="eyebrow eyebrow-light">Годовое сопровождение</span><h2>Три уровня участия команды</h2></div><p>Все годовые тарифы дают доступ к Compass AI, личному кабинету и персональному маршруту. Разница — в объёме работы команды.</p></div>
          <div className="annual-plan-grid">
            {annualPlans.map((plan) => (
              <article className={`annual-plan-card ${plan.featured ? "featured" : ""}`} key={plan.slug}>
                {plan.featured && <span className="plan-badge">Рекомендуем</span>}
                <span className="pricing-code">{plan.code}</span><h3>{plan.name}{plan.featured && " ⭐"}</h3><p className="plan-audience">{plan.audience}</p>
                <div className="price-stack"><del>{plan.regularPrice}</del><strong>{plan.foundingPrice}</strong><small>цена первого набора · 12 месяцев</small></div>
                <p className="plan-summary">{plan.summary}</p><div className="plan-highlights">{plan.highlights.map((item) => <span key={item}>{item}</span>)}</div>
                <details className="pricing-details"><summary>Полный состав тарифа <span>+</span></summary><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></details>
                <div className="plan-difference"><span>Главное отличие</span><p>{plan.difference}</p></div>
                <Link className={`button ${plan.featured ? "button-ivory" : "button-outline-light"}`} href="/consultation">Выбрать {plan.name.replace("RPS ", "")} <span>↗</span></Link>
              </article>
            ))}
          </div>
          <div className="founding-note"><strong>Первый набор RPS</strong><p>Лимит 16 мест действует суммарно на Start, Admission и Select. После заполнения набора откроется лист ожидания. Strategy продолжит продаваться без ограничений.</p></div>
        </div>
      </section>

      <section className="addons-section" id="additional-services">
        <div className="section-shell">
          <div className="pricing-heading"><div><span className="eyebrow">Дополнительные услуги</span><h2>Расширяйте помощь точечно</h2></div><p>Для участников первого набора специальная стоимость сохраняется на весь период сопровождения.</p></div>
          <div className="addon-grid">
            {addOnPackages.map((item, index) => (
              <Reveal className={`addon-card ${index === 4 ? "wide" : ""}`} delay={(index % 3) * 70} key={item.name}>
                <span className="addon-index">0{index + 1}</span><h3>{item.name}</h3><p>{item.description}</p>
                <div className="addon-price"><del>{item.regular}</del><strong>{item.founding}</strong><small>для первого набора</small></div>
                <details className="pricing-details light"><summary>Что входит <span>+</span></summary><ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></details>
                <Link href="/consultation">Добавить к маршруту <span>→</span></Link>
              </Reveal>
            ))}
          </div>
          <div className="individual-addons-heading"><span className="eyebrow">Точечная помощь</span><h2>Отдельные функции</h2></div>
          <div className="individual-addon-list">{individualAddOns.map((item) => <article key={item.name}><div><span>RPS +</span><h3>{item.name}</h3></div><p>{item.text}</p><strong>{item.price}</strong><Link href="/consultation" aria-label={`Запросить ${item.name}`}>↗</Link></article>)}</div>
        </div>
      </section>

      <section className="section-shell pricing-notes">
        <article className="fast-track-note"><span>FAST TRACK</span><div><h2>Когда дедлайн уже близко</h2><p>Менее 30 дней до дедлайна — <strong>+30%</strong>. Менее 14 дней — <strong>+50%</strong>. Доплата покрывает приоритетную работу команды и ускоренную подготовку материалов.</p></div></article>
        <article className="external-costs-note"><div><span className="eyebrow">Оплачивается отдельно</span><h2>Внешние расходы</h2><p>Если прямо не указано обратное, обязательные платежи третьим лицам не входят в стоимость RPS.</p></div><div>{externalCosts.map((cost) => <span key={cost}>{cost}</span>)}</div></article>
      </section>

      <section className="section-shell faq-section">
        <span className="eyebrow">FAQ</span><h2>Честные ответы до старта</h2>
        <div className="faq-list">{[
          ["Strategy занимает место в наборе?", "Нет. Лимит 16 мест относится только к Start, Admission и Select. Strategy доступен постоянно."],
          ["Можно перейти со Strategy на годовое сопровождение?", "Да. Стоимость Strategy полностью засчитывается в оплату годового тарифа, если в наборе осталось место."],
          ["Вы гарантируете поступление?", "Нет. Решение принимает университет. Мы гарантируем прозрачный процесс, проверенную стратегию и внимательную работу с заявкой."],
          ["Можно добавить услугу без перехода на другой тариф?", "Да. Дополнительные услуги созданы именно для точечного расширения сопровождения."],
        ].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>
    </>
  );
}
