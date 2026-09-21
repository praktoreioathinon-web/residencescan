import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#071017",
        card: "#0C1821",
        surface: "#101E28",
        popover: "#101E28",
        fg: "#F4F8FA",
        subtext: "#8EA4AE",
        line: "#FFFFFF1A",
        primary: "#55D6C7",
        "primary-fg": "#04100F",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
