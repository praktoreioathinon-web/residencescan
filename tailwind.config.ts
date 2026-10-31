import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
  plugins: [
    // Applies only on touch screens (phones, tablets), so controls can reach
    // Apple's 44pt minimum there without growing on desktop.
    plugin(({ addVariant }) => addVariant("touch", "@media (pointer: coarse)")),
  ],
};
export default config;
