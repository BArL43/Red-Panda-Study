import type { Metadata } from "next";
import { LeadQuiz } from "@/components/LeadQuiz";

export const metadata: Metadata = {
  title: "Бесплатная диагностика",
  description: "Быстрая диагностика профиля для поступления в Китай и Гонконг.",
};

export default function ConsultationPage() {
  return (
    <section className="consultation-page">
      <div className="section-shell consultation-grid">
        <div className="consultation-copy">
          <span className="eyebrow eyebrow-light">Бесплатно · 5 минут</span>
          <h1>Соберём первую версию вашего маршрута</h1>
          <p>
            Ответьте на три вопроса — и мы подготовимся к содержательному
            разговору, а не будем тратить его на анкету.
          </p>
          <div className="consultation-benefits">
            <span><i>01</i> Поймём ваш запрос и сроки</span>
            <span><i>02</i> Назовём сильные и рискованные зоны</span>
            <span><i>03</i> Предложим следующие шаги</span>
          </div>
        </div>
        <LeadQuiz />
      </div>
    </section>
  );
}
