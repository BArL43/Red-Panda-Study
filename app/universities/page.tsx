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
        title={<>Начните с ориентиров. <em>Закончите точным выбором.</em></>}
        text="Фильтруйте варианты по региону и направлению. А мы поможем проверить требования, сроки и реальное соответствие вашему профилю."
        tone="jade"
        aside={
          <div className="hero-stat-cluster">
            <span><b>2</b> региона</span>
            <span><b>8</b> ориентиров</span>
            <span><b>∞</b> персональных комбинаций</span>
          </div>
        }
      />
      <UniversityExplorer />
    </>
  );
}
