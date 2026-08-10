import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { UniversityExplorer } from "@/components/UniversityExplorer";

export const metadata: Metadata = {
  title: "Университеты",
  description: "Каталог университетов Китая и Гонконга для первого shortlist.",
};

export default function UniversitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Каталог университетов"
        title={<>Все варианты открыты. <em>Точный маршрут — личный.</em></>}
        text="Изучите 40 университетов Китая и Гонконга. Подробные требования по 157 программам открываются в кабинете вместе с проверкой куратора."
        tone="jade"
        aside={
          <div className="hero-stat-cluster">
            <span><b>2</b> региона</span>
            <span><b>40</b> университетов</span>
            <span><b>157</b> программ в базе</span>
          </div>
        }
      />
      <UniversityExplorer />
    </>
  );
}
