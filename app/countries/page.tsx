import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Страны" };

export default function CountriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Направления"
        title={<>Азия разная. <em>Ваш маршрут — один.</em></>}
        text="Сравните две стартовые точки Red Panda Study. Следующими мы добавим Японию, Южную Корею и Сингапур."
        tone="paper"
      />
      <section className="section-shell country-compare">
        <Link href="/countries/china" className="country-panel country-panel-cn">
          <span className="panel-index">01 / CN</span>
          <div>
            <span>Материковый Китай</span>
            <h2>Большой выбор программ и городов</h2>
            <p>Подходит тем, кто ищет технологическую среду, академический масштаб и возможность изучать китайский.</p>
          </div>
          <b>Открыть направление ↗</b>
        </Link>
        <Link href="/countries/hong-kong" className="country-panel country-panel-hk">
          <span className="panel-index">02 / HK</span>
          <div>
            <span>Гонконг</span>
            <h2>Глобальная система и английский язык</h2>
            <p>Подходит тем, кому важны международная среда, сильный бизнес-контекст и компактная экосистема.</p>
          </div>
          <b>Открыть направление ↗</b>
        </Link>
      </section>
      <section className="section-shell coming-countries">
        <span className="eyebrow">Следующие направления</span>
        <div>
          {["Япония", "Южная Корея", "Сингапур"].map((country, index) => (
            <article key={country}><span>0{index + 3}</span><h3>{country}</h3><b>Скоро</b></article>
          ))}
        </div>
      </section>
    </>
  );
}
