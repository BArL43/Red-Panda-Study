"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Availability = { total: number; taken: number; available: number; open: boolean };
type AvailabilityStatus = "loading" | "ready" | "unavailable";

function isAvailability(value: unknown): value is Availability {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;
  return ["total", "taken", "available"].every((key) => typeof data[key] === "number")
    && typeof data.open === "boolean";
}

export function CohortCounter({ compact = false }: { compact?: boolean }) {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [status, setStatus] = useState<AvailabilityStatus>("loading");

  useEffect(() => {
    let active = true;

    fetch("/api/v1/cohort", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Cohort availability is unavailable");
        const data: unknown = await response.json();
        if (!isAvailability(data)) throw new Error("Invalid cohort availability response");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setAvailability(data);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });

    return () => { active = false; };
  }, []);

  const isReady = status === "ready" && availability;
  const filled = isReady ? Math.min(availability.taken, availability.total) : 0;
  const availabilityText = status === "loading" ? "Проверяем наличие мест…" : "Наличие мест уточняется у команды";

  return (
    <section className={`cohort-counter ${compact ? "compact" : ""}`} aria-label="Места в первом наборе">
      <div className="cohort-copy">
        <span className="cohort-kicker"><i /> Первый набор RPS</span>
        <h2>
          {isReady
            ? availability.open
              ? <>Только <em>{availability.total} учеников</em> в первый год</>
              : <>Набор заполнен. <em>Открыт лист ожидания</em></>
            : <>Набор с <em>ограниченным числом мест</em></>}
        </h2>
        {!compact && <p>Мы ограничили набор, чтобы команда могла глубоко работать с каждым учеником. Место занимает только RPS Start, Admission или Select.</p>}
      </div>
      <div className="cohort-meter" aria-live="polite">
        {isReady ? (
          <>
            <div className="cohort-number"><strong>{availability.available}</strong><span>мест<br />свободно</span></div>
            <div className="cohort-slots" aria-hidden="true">
              {Array.from({ length: availability.total }, (_, index) => <i className={index < filled ? "taken" : ""} key={index} />)}
            </div>
            <small>{availability.taken} из {availability.total} мест занято</small>
          </>
        ) : (
          <>
            <div className="cohort-number"><strong>—</strong><span>наличие<br />уточняется</span></div>
            <small>{availabilityText}</small>
          </>
        )}
      </div>
      <Link className="button button-primary" href="/consultation">{isReady && !availability.open ? "В лист ожидания" : "Обсудить участие"} <span>↗</span></Link>
    </section>
  );
}
