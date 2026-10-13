import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

/**
 * Day/night switch. The knob slides and spins, stars fade in, and the new
 * palette wipes out from the click point.
 */
export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
      className={`theme-toggle ${className}`}
    >
      <span className="theme-toggle-stars" aria-hidden="true" />
      <span className="theme-toggle-knob" aria-hidden="true">
        {dark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  );
}
