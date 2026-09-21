"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("rs_theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("rs_theme", "dark");
    }
  }

  return (
    <button
      type="button" onClick={toggle}
      title={light ? "Night mode" : "Day mode"}
      className="w-8 h-8 rounded-full border border-line flex items-center justify-center flex-shrink-0 text-subtext hover:text-fg"
    >
      {light ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}
