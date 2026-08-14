"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Availability = { total: number; taken: number; available: number; open: boolean };

export function CohortCounter({ compact = false }: { compact?: boolean }) {
  const [availability, setAvailability] = useState<Availability>({ total: 16, taken: 0, available: 16, open: true });

  useEffect(() => {
    let active = true;
    fetch("/api/v1/cohort", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Availability) => { if (active) setAvailability(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const filled = Math.min(availability.taken, availability.total);

  return (
    <section className={`cohort-counter ${compact ? "compact" : ""}`} aria-label="Места в первом наборе">
      <div className="cohort-copy">
        <span className="cohort-kicker"><i /> Первый набор RPS</span>
        <h2>{availability.open ? <>Только <em>{availability.total} учеников</em> в первый год</> : <>Набор заполнен. <em>Открыт лист ожидания</em></>}</h2>
        {!compact && <p>Мы ограничили набор, чтобы команда могла глубоко работать с каждым учеником. Место занимает только RPS Start, Admission или Select.</p>}
      </div>
      <div className="cohort-meter" aria-live="polite">
        <div className="cohort-number"><strong>{availability.available}</strong><span>мест<br />свободно</span></div>
        <div className="cohort-slots" aria-hidden="true">
          {Array.from({ length: availability.total }, (_, index) => <i className={index < filled ? "taken" : ""} key={index} />)}
        </div>
        <small>{availability.taken} из {availability.total} мест занято</small>
      </div>
      <Link className="button button-primary" href="/consultation">{availability.open ? "Обсудить участие" : "В лист ожидания"} <span>↗</span></Link>
    </section>
  );
}
