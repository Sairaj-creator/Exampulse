import { createContext } from "react";

// Defaults keep components usable when rendered without the provider (tests).
export const ThemeContext = createContext({
  theme: "light",
  motion: true,
  toggleTheme: () => {},
  toggleMotion: () => {},
});
