import type { Metadata } from "next";
import { AdminLogin } from "@/components/portal/AdminLogin";

export const metadata: Metadata = { title: "Вход для команды" };

export default function AdminLoginPage() {
  return <AdminLogin />;
}
