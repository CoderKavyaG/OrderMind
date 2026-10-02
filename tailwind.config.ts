import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Funnel Display"', '"funnelDisplay Fallback"', "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"Geist Mono"', '"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Display scale
        "display-xl": ["72px", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-lg": ["64px", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-md": ["48px", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "700" }],
        // Heading scale
        "heading-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-md": ["24px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "heading-sm": ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        // Body scale
        "body-lg": ["16px", { lineHeight: "1.5", letterSpacing: "-0.005em" }],
        "body-sm": ["14px", { lineHeight: "1.45", letterSpacing: "-0.005em" }],
        "body-xs": ["12px", { lineHeight: "1.4", letterSpacing: "0em" }],
        // Mono evidence scale
        "mono-evidence": ["13px", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
      },
      colors: {
        // OrderMind Palette
        canvas: {
          DEFAULT: "#EDEAE1", // Kraft cream
          dark: "#14150F",    // Dark panel canvas
        },
        surface: {
          DEFAULT: "#F7F5EF",
          card: "#FFFFFF",
          muted: "#E8E5DC",
          dark: "#1C1E16",
          darkMuted: "#26291F",
        },
        ink: {
          DEFAULT: "#14150F",
          muted: "#5B5D50",
          subtle: "#8A8D7E",
          faint: "#B5B8A8",
          dark: "#F7F5EF",
          darkMuted: "#A8AB9B",
        },
        border: {
          DEFAULT: "#E2DFD6",
          dark: "#2A2D23",
          light: "#EBE8E0",
        },
        // Brand "Signal Lime"
        brand: {
          lime: "#C8F135",
          limeHover: "#B8E328",
          limeLight: "#F0FBCB",
          limeMuted: "#DFFA77",
          ink: "#14150F",
        },
        // Strict Field Status Colors (USED ONLY FOR FIELD STATUS)
        status: {
          confirmed: "#1F8A4C",
          confirmedBg: "#E8F6EE",
          confirmedBorder: "#BDE6CE",
          inferred: "#B7791F",
          inferredBg: "#FEF7EC",
          inferredBorder: "#FCE0B8",
          conflicting: "#D64545",
          conflictingBg: "#FDF2F2",
          conflictingBorder: "#F8BDBD",
          missing: "#8E9182",
          missingBg: "#F2EFE8",
          missingBorder: "#C8C5BA",
        },
        // Standard theme mappings for shadcn compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        "card-sm": "20px",
        card: "24px",
        "card-lg": "28px",
        pill: "9999px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        tactile: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 2px 4px rgba(20, 21, 15, 0.05), 0 1px 2px rgba(20, 21, 15, 0.03)",
        "tactile-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 12px rgba(20, 21, 15, 0.08), 0 2px 4px rgba(20, 21, 15, 0.04)",
        "tactile-pressed": "inset 0 2px 4px rgba(20, 21, 15, 0.12)",
        "tactile-dark": "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.35)",
        soft: "0 2px 8px rgba(20, 21, 15, 0.03), 0 8px 24px rgba(20, 21, 15, 0.05)",
        floating: "0 16px 40px -8px rgba(20, 21, 15, 0.12), 0 4px 16px rgba(20, 21, 15, 0.04)",
        lime: "0 0 24px rgba(200, 241, 53, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
