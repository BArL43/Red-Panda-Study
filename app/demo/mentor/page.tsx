import type { Metadata } from "next";
import { DemoDashboard } from "@/components/portal/DemoDashboard";

export const metadata: Metadata = { title: "Демо кабинета куратора" };

export default function DemoMentorPage() {
  return <DemoDashboard role="mentor" />;
}
