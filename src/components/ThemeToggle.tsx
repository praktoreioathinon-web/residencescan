"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");

    // Until the user picks a theme explicitly, keep following the OS setting live
    // (e.g. macOS switching to Night Shift / dark mode at sunset).
    const media = window.matchMedia("(prefers-color-scheme: light)");
    function onSystemChange(e: MediaQueryListEvent) {
      if (localStorage.getItem("rs_theme")) return;
      setLight(e.matches);
      if (e.matches) document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
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
