import type { Metadata } from "next";
import { DemoDashboard } from "@/components/portal/DemoDashboard";

export const metadata: Metadata = { title: "Демо кабинета ученика" };

export default function DemoStudentPage() {
  return <DemoDashboard role="student" />;
}
