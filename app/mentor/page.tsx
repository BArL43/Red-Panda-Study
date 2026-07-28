import type { Metadata } from "next";
import { MentorDashboard } from "@/components/portal/MentorDashboard";

export const metadata: Metadata = { title: "Кабинет наставника" };

export default function MentorPage() {
  return <MentorDashboard />;
}
