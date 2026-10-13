import React, { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ThemeContext } from "./themeContextInstance";

const THEME_KEY = "ep-theme";
const MOTION_KEY = "ep-motion";

function prefers(query) {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(query).matches
  );
}

function readStored(key, allowed) {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function store(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The preference simply will not persist when storage is unavailable.
  }
}

function initialTheme() {
  return (
    readStored(THEME_KEY, ["light", "dark"]) ||
    (prefers("(prefers-color-scheme: dark)") ? "dark" : "light")
  );
}

function initialMotion() {
  const stored = readStored(MOTION_KEY, ["on", "off"]);
  if (stored) return stored === "on";
  return !prefers("(prefers-reduced-motion: reduce)");
}

/**
 * Owns the colour theme and the animation preference. Both are mirrored onto
 * <html> as data attributes, which is what the stylesheet keys off.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [motion, setMotion] = useState(initialMotion);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "on" : "off";
  }, [motion]);

  // `origin` is the click position; the new theme wipes outward from it.
  const toggleTheme = useCallback(
    (origin) => {
      const next = theme === "dark" ? "light" : "dark";
      store(THEME_KEY, next);

      const root = document.documentElement;
      if (!motion || typeof document.startViewTransition !== "function") {
        setTheme(next);
        return;
      }

      if (origin) {
        root.style.setProperty("--wipe-x", `${origin.x}px`);
        root.style.setProperty("--wipe-y", `${origin.y}px`);
      }
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
        root.dataset.theme = next;
      });
    },
    [motion, theme],
  );

  const toggleMotion = useCallback(() => {
    setMotion((current) => {
      store(MOTION_KEY, current ? "off" : "on");
      return !current;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, motion, toggleTheme, toggleMotion }),
    [theme, motion, toggleTheme, toggleMotion],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
