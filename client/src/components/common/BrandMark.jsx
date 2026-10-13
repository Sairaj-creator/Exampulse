import { cn } from "../../lib/utils";

/** The ExamPulse mark: a marigold pulse line on a pine tile. */
export function BrandMark({ size = 36, className }) {
  return (
    <span
      className={cn(
        "relative inline-grid flex-none place-items-center rounded-[28%] shadow-sm",
        className,
      )}
      style={{ width: size, height: size, background: "#193f32" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        width={size * 0.72}
        height={size * 0.72}
        fill="none"
      >
        <path
          d="M6 34h12l6-17 10 31 7-20 3 6h14"
          pathLength="1"
          stroke="#e4ac33"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="line-draw"
        />
      </svg>
    </span>
  );
}

export function BrandWordmark({ className }) {
  return (
    <span className={cn("font-extrabold tracking-tight", className)}>
      Exam<span className="text-emerald-600">Pulse</span>
    </span>
  );
}
