import type { Metadata } from "next";
import { AdminDashboard } from "@/components/portal/AdminDashboard";

export const metadata: Metadata = { title: "Панель администратора" };

export default function AdminPage() {
  return <AdminDashboard />;
}
