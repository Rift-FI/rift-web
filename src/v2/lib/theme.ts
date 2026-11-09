import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const KEY = "rift_theme";

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(pref: ThemePreference = readPreference()) {
  const dark = pref === "dark" || (pref === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", !!dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0d1214" : "#f6f7f7");
}

/** Call once before first render so there is no light flash in dark mode. */
export function initTheme() {
  applyTheme();
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (readPreference() === "system") applyTheme("system");
  });
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePreference>(readPreference);
  useEffect(() => {
    applyTheme(pref);
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* ignore */
    }
  }, [pref]);
  return { theme: pref, setTheme: setPref };
}
