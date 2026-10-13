import { useContext } from "react";
import { ThemeContext } from "../context/themeContextInstance";

export function useTheme() {
  return useContext(ThemeContext);
}
