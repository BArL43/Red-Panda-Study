import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Поступление в Китай",
  description: "Поступление в университеты Китая с Red Panda Study.",
};

const cities = [
  ["Пекин", "Исследования, политика, технологии", "Столица с высокой академической плотностью и сильной международной средой."],
  ["Шанхай", "Бизнес, финансы, инженерия", "Динамичный мегаполис для тех, кто хочет связать учёбу с глобальными индустриями."],
  ["Ханчжоу", "AI, предпринимательство, дизайн", "Зелёный технологичный город рядом с крупными инновационными компаниями."],
  ["Нанкин", "Наука, гуманитарные дисциплины", "Более спокойный ритм и насыщенная университетская культура."],
];

export default function ChinaPage() {
  return (
    <>
      <PageHero
        eyebrow="Направление · Китай"
        title={<>Учёба в масштабе <em>новой Азии</em></>}
        text="Собираем маршрут по городам, программам и языковым трекам — чтобы Китай был осознанным выбором, а не абстрактной идеей."
        tone="red"
        aside={
          <div className="country-symbol country-symbol-cn">
            <span>CN</span>
            <b>中国</b>
            <i />
          </div>
        }
      />
      <section className="section-shell country-detail-intro">
        <Reveal>
          <span className="eyebrow">Почему Китай</span>
          <h2>Технологии, академический масштаб и разные сценарии бюджета</h2>
        </Reveal>
        <Reveal className="country-facts" delay={100}>
          <div><b>EN / 中文</b><span>Программы на английском и китайском</span></div>
          <div><b>4 города</b><span>Ключевые центры в нашей стартовой карте</span></div>
          <div><b>1 маршрут</b><span>От shortlist до подготовки к переезду</span></div>
        </Reveal>
      </section>
      <section className="section-shell city-section">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Где учиться</span>
            <h2>У каждого города — свой характер</h2>
          </div>
          <p>Не ранжируем города «от лучшего к худшему»: выбираем контекст, в котором вы сможете расти.</p>
        </div>
        <div className="city-grid">
          {cities.map(([name, focus, text], index) => (
            <Reveal className="city-card" delay={index * 80} key={name}>
              <span>0{index + 1}</span>
              <h3>{name}</h3>
              <b>{focus}</b>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section-shell application-map">
        <div className="application-map-copy">
          <span className="eyebrow eyebrow-light">Что учитываем</span>
          <h2>Профиль абитуриента — больше, чем средний балл</h2>
          <p>Смотрим на академическую базу, язык, мотивацию, проекты и реалистичность списка программ.</p>
          <Link className="button button-ivory" href="/consultation">Оценить мой профиль <span>↗</span></Link>
        </div>
        <div className="application-orbit">
          {["Академическая база", "Язык", "Мотивация", "Проекты"].map((item, index) => (
            <span key={item} style={{ "--i": index } as React.CSSProperties}>{item}</span>
          ))}
          <b>YOU</b>
        </div>
      </section>
    </>
  );
}
