import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrderMind — Precision Packaging Intelligence",
  description:
    "OrderMind turns messy customer conversations (text, voice, images) into a reliable, evidence-backed structured order for packaging manufacturers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-canvas text-ink antialiased selection:bg-brand-lime selection:text-ink">
        {children}
      </body>
    </html>
  );
}
