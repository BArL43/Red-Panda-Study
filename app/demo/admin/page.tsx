import type { Metadata } from "next";
import { DemoDashboard } from "@/components/portal/DemoDashboard";

export const metadata: Metadata = { title: "Демо панели администратора" };

export default function DemoAdminPage() {
  return <DemoDashboard role="admin" />;
}
