import { useEffect } from "react";

/** Calls `onEscape` when Escape is pressed while `active` is true. */
export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onEscape?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [active, onEscape]);
}
