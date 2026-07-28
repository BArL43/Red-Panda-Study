import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteAccept } from "@/components/portal/InviteAccept";

export const metadata: Metadata = { title: "Персональное приглашение" };

export default function InvitePage() {
  return <Suspense><InviteAccept /></Suspense>;
}
