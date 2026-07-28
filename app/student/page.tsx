import type { Metadata } from "next";
import { StudentDashboard } from "@/components/portal/StudentDashboard";

export const metadata: Metadata = { title: "Кабинет ученика" };

export default function StudentPage() {
  return <StudentDashboard />;
}
