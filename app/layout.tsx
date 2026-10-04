import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ordermind.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OrderMind — Precision Packaging SaaS | AI Order Engineering",
    template: "%s | OrderMind",
  },
  description:
    "OrderMind transforms messy customer conversations (text, WhatsApp, voice, images) into reliable, evidence-backed production orders for packaging manufacturers.",
  keywords: [
    "packaging software",
    "order management",
    "AI order extraction",
    "packaging manufacturing",
    "B2B SaaS",
    "Gemma",
    "ElevenLabs",
    "Sentry",
  ],
  authors: [{ name: "OrderMind Engineering Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "OrderMind — Precision Packaging Intelligence",
    description:
      "Turn messy customer conversations into certified, conflict-free manufacturing orders with deterministic proof.",
    url: siteUrl,
    siteName: "OrderMind",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderMind — Precision Packaging Intelligence",
    description:
      "Turn messy customer conversations into certified, conflict-free manufacturing orders.",
  },
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
