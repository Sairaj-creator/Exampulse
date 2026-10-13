import { useCallback, useRef } from "react";
import { useTheme } from "./useTheme";

const TILE_SELECTOR = ".bg-white.rounded-2xl";
// Only compact cards (KPI tiles) tilt; large panels and forms stay flat.
const MAX_TILE_HEIGHT = 190;
const MAX_TILE_WIDTH = 460;
const MAX_DEGREES = 6;

function release(tile) {
  if (!tile) return;
  tile.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
  tile.style.transform = "";
}

/**
 * Gives every small glass card under one container a pointer-tracked 3D
 * tilt, using a single delegated listener so pages need no extra markup.
 */
export function useTileTilt() {
  const active = useRef(null);
  const frame = useRef(0);
  const { motion } = useTheme();

  const onPointerMove = useCallback(
    (event) => {
      if (!motion || event.pointerType === "touch") return;
      const candidate = event.target.closest?.(TILE_SELECTOR);
      const tile =
        candidate &&
        candidate.offsetHeight <= MAX_TILE_HEIGHT &&
        candidate.offsetWidth <= MAX_TILE_WIDTH
          ? candidate
          : null;

      if (active.current !== tile) {
        release(active.current);
        active.current = tile;
      }
      if (!tile) return;

      const rect = tile.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        tile.style.transition = "transform 0.12s ease-out";
        tile.style.transform = `perspective(700px) rotateX(${(-y * MAX_DEGREES * 2).toFixed(2)}deg) rotateY(${(x * MAX_DEGREES * 2).toFixed(2)}deg) translateZ(6px)`;
      });
    },
    [motion],
  );

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    release(active.current);
    active.current = null;
  }, []);

  return { onPointerMove, onPointerLeave };
}
