import { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  text,
  aside,
  tone = "paper",
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
  aside?: ReactNode;
  tone?: "paper" | "dark" | "red" | "jade";
}) {
  return (
    <section className={`page-hero page-hero-${tone}`}>
      <div className="section-shell page-hero-grid">
        <div>
          <span className={`eyebrow ${tone === "dark" || tone === "red" ? "eyebrow-light" : ""}`}>
            {eyebrow}
          </span>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        {aside && <div className="page-hero-aside">{aside}</div>}
      </div>
    </section>
  );
}
