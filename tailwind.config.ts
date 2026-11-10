import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spicy: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C", // Primary Warm Spicy Orange
          700: "#C2410C", // Deep Spicy Orange
          800: "#9A3412",
          900: "#7C2D12",
        },
        chili: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626", // Secondary Chili Red
          700: "#B91C1C",
        },
        crisp: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          400: "#FBBF24",
          500: "#F59E0B", // Golden Crisp Accent
          600: "#D97706",
        },
        cream: {
          DEFAULT: "#FAF8F5",
          warm: "#FFFBEB",
          border: "#F3E8D6",
        },
        admin: {
          slate: "#F8FAFC",
        },
      },
      boxShadow: {
        warm: "0 10px 30px -10px rgba(234, 88, 12, 0.14)",
        "warm-lg": "0 20px 40px -12px rgba(194, 65, 12, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;

