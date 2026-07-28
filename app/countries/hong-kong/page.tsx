import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Поступление в Гонконг",
  description: "Поступление в университеты Гонконга с Red Panda Study.",
};

const cards = [
  ["International classroom", "Англоязычная среда и студенты из разных стран."],
  ["Asia business hub", "Рядом финансы, технологии, стартапы и международные компании."],
  ["Compact ecosystem", "Кампусы и деловые районы связаны быстрым городским ритмом."],
];

export default function HongKongPage() {
  return (
    <>
      <PageHero
        eyebrow="Направление · Гонконг"
        title={<>Глобальное образование с <em>азиатским фокусом</em></>}
        text="Для тех, кто хочет учиться на английском, работать с международным контекстом и быть в центре быстро меняющегося региона."
        tone="dark"
        aside={
          <div className="hk-skyline" aria-hidden="true">
            <i /><i /><i /><i /><span />
          </div>
        }
      />
      <section className="section-shell hk-values">
        {cards.map(([title, text], index) => (
          <Reveal className="hk-value" delay={index * 100} key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </Reveal>
        ))}
      </section>
      <section className="section-shell hk-programs">
        <Reveal className="hk-programs-copy">
          <span className="eyebrow">Сильные контексты</span>
          <h2>Программы на стыке дисциплин</h2>
          <p>В Гонконге особенно интересно сравнивать классические специальности с междисциплинарными треками.</p>
          <Link className="button button-primary" href="/universities">Смотреть университеты <span>↗</span></Link>
        </Reveal>
        <div className="program-stack">
          {[
            ["01", "Business Analytics", "Data + strategy"],
            ["02", "FinTech", "Finance + technology"],
            ["03", "Urban Studies", "Cities + policy"],
            ["04", "Global Communication", "Media + culture"],
          ].map(([number, title, tag], index) => (
            <Reveal className="program-card" delay={index * 80} key={title}>
              <span>{number}</span><h3>{title}</h3><b>{tag}</b>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section-shell final-cta-section">
        <Reveal className="final-cta final-cta-jade">
          <div>
            <span className="eyebrow eyebrow-light">Соберите shortlist</span>
            <h2>Проверим, подходит ли вам Гонконг</h2>
            <p>Сравним требования и риски с вашим профилем, сроками и бюджетом.</p>
          </div>
          <Link className="button button-ivory" href="/consultation">Начать диагностику <span>↗</span></Link>
        </Reveal>
      </section>
    </>
  );
}
