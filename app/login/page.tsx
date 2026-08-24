import type { Metadata } from "next";
import { PortalLogin } from "@/components/portal/PortalLogin";

export const metadata: Metadata = { title: "Вход в личный кабинет" };

export default function PortalLoginPage() {
  return <PortalLogin />;
}
