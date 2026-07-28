import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Истории",
  description: "Истории поступления и сценарии абитуриентов Red Panda Study.",
};

const stories = [
  { initials: "АМ", name: "Алина", route: "Гонконг · Business Analytics", quote: "Из тревожного списка из 20 вузов мы сделали понятный shortlist и сильную историю.", color: "jade" },
  { initials: "ИК", name: "Илья", route: "Шанхай · Engineering", quote: "Главным открытием было не эссе, а то, как мои проекты складываются в цельный профиль.", color: "red" },
  { initials: "СЛ", name: "Соня", route: "Пекин · Chinese Studies", quote: "Я перестала пытаться быть идеальной и показала настоящую мотивацию к языку и региону.", color: "sand" },
];

export default function StoriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Истории поступления"
        title={<>Не идеальные анкеты. <em>Живые траектории.</em></>}
        text="Показываем, как стратегия складывается из конкретного человека, его целей и ограничений. Имена и детали в демонстрационной версии условные."
        tone="jade"
      />
      <section className="section-shell stories-grid">
        {stories.map((story, index) => (
          <Reveal className={`case-card case-${story.color}`} delay={index * 90} key={story.name}>
            <div className="case-portrait"><span>{story.initials}</span></div>
            <div className="case-copy">
              <span className="case-index">Кейс 0{index + 1}</span>
              <blockquote>«{story.quote}»</blockquote>
              <div>
                <span><b>{story.name}</b><small>{story.route}</small></span>
                <button type="button" aria-label={`Открыть историю ${story.name}`}>↗</button>
              </div>
            </div>
          </Reveal>
        ))}
      </section>
      <section className="section-shell principles-section">
        <div>
          <span className="eyebrow">Наш принцип</span>
          <h2>У каждого поступления своя логика</h2>
        </div>
        <div className="principles-list">
          <p><span>01</span> Не маскируем слабые места — строим вокруг них реалистичную стратегию.</p>
          <p><span>02</span> Не пишем историю за абитуриента — помогаем услышать и усилить его голос.</p>
          <p><span>03</span> Не гоняемся только за громкими названиями — смотрим на академический fit.</p>
        </div>
      </section>
      <section className="section-shell final-cta-section">
        <Reveal className="final-cta">
          <div>
            <span className="eyebrow eyebrow-light">Следующая история</span>
            <h2>Может начаться с вашего запроса</h2>
            <p>Расскажите, где вы сейчас. Мы поможем увидеть следующий шаг.</p>
          </div>
          <Link className="button button-ivory" href="/consultation">Начать разговор <span>↗</span></Link>
        </Reveal>
      </section>
    </>
  );
}
