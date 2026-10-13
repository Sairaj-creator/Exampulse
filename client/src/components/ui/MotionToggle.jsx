import { Sparkles } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

/** Turns interface animations on or off for this browser. */
export function MotionToggle({ className = "" }) {
  const { motion, toggleMotion } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={motion}
      aria-label="Animations"
      title={motion ? "Turn animations off" : "Turn animations on"}
      onClick={toggleMotion}
      className={`grid h-8 w-8 flex-none place-items-center rounded-full border border-stone-200 transition-colors ${
        motion
          ? "bg-emerald-100 text-emerald-800"
          : "bg-stone-100 text-stone-400"
      } ${className}`}
    >
      <Sparkles
        size={14}
        className={`transition-transform duration-500 ease-spring ${
          motion ? "rotate-0 scale-100" : "-rotate-90 scale-75"
        }`}
      />
    </button>
  );
}
