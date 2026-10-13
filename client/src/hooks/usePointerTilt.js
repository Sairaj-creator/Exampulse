import { useCallback, useRef } from "react";
import { useTheme } from "./useTheme";

/**
 * Tracks the pointer over an element and exposes it as CSS variables
 * (--tilt-x, --tilt-y in degrees; --glare-x, --glare-y in percent). The
 * stylesheet turns those into a 3D rotation. Inert for touch input and when
 * animations are switched off.
 */
export function usePointerTilt(max = 7) {
  const ref = useRef(null);
  const frame = useRef(0);
  const { motion } = useTheme();

  const onPointerMove = useCallback(
    (event) => {
      if (!motion || event.pointerType === "touch") return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        node.classList.add("is-tilting");
        node.style.setProperty("--tilt-x", ((0.5 - y) * max * 2).toFixed(2));
        node.style.setProperty("--tilt-y", ((x - 0.5) * max * 2).toFixed(2));
        node.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
        node.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
      });
    },
    [max, motion],
  );

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const node = ref.current;
    if (!node) return;
    node.classList.remove("is-tilting");
    node.style.setProperty("--tilt-x", "0");
    node.style.setProperty("--tilt-y", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
