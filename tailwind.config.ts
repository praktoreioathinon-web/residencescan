import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        surface: "var(--surface)",
        popover: "var(--surface)",
        fg: "var(--fg)",
        subtext: "var(--subtext)",
        line: "var(--line)",
        primary: "var(--primary)",
        "primary-fg": "var(--primary-fg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
