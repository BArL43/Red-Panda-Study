import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";
import "./panda-product.css";

export const metadata: Metadata = {
  title: {
    default: "Red Panda Study — поступление в Китай и Гонконг",
    template: "%s — Red Panda Study",
  },
  description:
    "Подбор университета, подготовка документов и сопровождение поступления в Китай и Гонконг.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
