import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Timer,
  Trophy,
} from "lucide-react";
import { usePointerTilt } from "../../hooks/usePointerTilt";
import { cn } from "../../lib/utils";

// The scene is composed at this size and scaled as one unit to fit its
// container, so the layers keep their arrangement on any screen.
const STAGE_WIDTH = 560;
const STAGE_HEIGHT = 500;

const DISTRIBUTION = [12, 20, 31, 46, 64, 88, 100, 74, 49, 27];
const OPTIONS = [
  { key: "A", text: "Hash index" },
  { key: "B", text: "Compound B-tree index", selected: true },
  { key: "C", text: "Bitmap index" },
  { key: "D", text: "Spatial R-tree index" },
];
const PALETTE = [
  "done",
  "done",
  "done",
  "flag",
  "done",
  "done",
  "now",
  "todo",
  "todo",
  "todo",
];
const PALETTE_STYLES = {
  done: "bg-emerald-600",
  flag: "bg-amber-400",
  now: "bg-stone-900 ring-2 ring-amber-400",
  todo: "bg-stone-300",
};

/**
 * Decorative 3D composition for the landing hero: an exam card, a score
 * distribution and a few floating details, layered in real depth. The whole
 * stage leans toward the pointer.
 */
export function HeroScene({ className, compact = false }) {
  const tilt = usePointerTilt(9);
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setScale(Math.min(1, width / STAGE_WIDTH));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...tilt}
      aria-hidden="true"
      className={cn(
        "scene relative mx-auto w-full min-w-0 select-none",
        className,
      )}
    >
      <div
        ref={frameRef}
        className="relative w-full"
        style={{ height: STAGE_HEIGHT * scale, transformStyle: "preserve-3d" }}
      >
        {/* Scaling lives on its own wrapper so the stage still rotates
            around its centre. It is taken out of flow so its unscaled width
            never stretches the layout. */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            scale: String(scale),
            transformOrigin: "top left",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="scene-stage h-full w-full">
            <div className="scene-shadow" />

            {/* Back: score distribution */}
            <div className="scene-layer depth-back right-0 top-[2%] w-[64%]">
              <div className="glass float-b rounded-3xl p-5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Score distribution
                  <BarChart3 size={14} className="text-emerald-600" />
                </div>
                <div className="mt-4 flex h-28 items-end gap-1.5">
                  {DISTRIBUTION.map((height, index) => (
                    <span
                      key={index}
                      className={cn(
                        "bar-grow flex-1 rounded-t-md",
                        index === 6 ? "bg-amber-400" : "bg-emerald-600/70",
                      )}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${0.25 + index * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[9px] text-stone-400">
                  <span>0</span>
                  <span>50</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Middle: the exam card */}
            <div className="scene-layer depth-mid left-[4%] top-[20%] w-[70%]">
              <div className="glass-strong float-a rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Question 7 of 10
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-stone-900 px-2.5 py-1 font-mono text-[11px] font-semibold text-white">
                    <Timer size={12} className="text-amber-400" /> 18:42
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-snug text-stone-900">
                  Which index best serves equality and range queries on several
                  ordered attributes?
                </p>
                <div className="mt-3.5 space-y-2">
                  {OPTIONS.map((option) => (
                    <div
                      key={option.key}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs",
                        option.selected
                          ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-900"
                          : "border-stone-200 text-stone-600",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 flex-none place-items-center rounded-full border text-[10px] font-bold",
                          option.selected
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-stone-300",
                        )}
                      >
                        {option.selected ? <Check size={11} /> : option.key}
                      </span>
                      {option.text}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-1.5">
                  {PALETTE.map((state, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        PALETTE_STYLES[state],
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Front: autosave confirmation */}
            <div className="scene-layer depth-front bottom-[9%] left-0">
              <div className="glass-strong float-c flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 size={15} />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-stone-900">
                    Answer saved
                  </div>
                  <div className="text-[10px] text-stone-500">
                    synced with server clock
                  </div>
                </div>
              </div>
            </div>

            {/* Top: result ring */}
            <div className="scene-layer depth-top right-[3%] top-[47%]">
              <div className="glass-strong float-b flex items-center gap-3 rounded-2xl p-3 pr-4">
                <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="5"
                    className="stroke-stone-200"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="82 100"
                    className="stroke-emerald-600"
                  />
                </svg>
                <div className="leading-tight">
                  <div className="font-mono text-lg font-bold text-stone-900">
                    82%
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                    <Trophy size={10} /> Rank 3 of 54
                  </div>
                </div>
              </div>
            </div>

            {/* A real cube, slowly turning inside its orbit */}
            {!compact && (
              <div className="scene-layer depth-front bottom-[2%] right-[12%]">
                <div className="relative grid h-28 w-28 place-items-center">
                  <div className="orbit inset-0" />
                  <div className="cube">
                    <span className="cube-face">
                      <ShieldCheck size={26} />
                    </span>
                    <span className="cube-face">
                      <Clock size={26} />
                    </span>
                    <span className="cube-face">
                      <BarChart3 size={26} />
                    </span>
                    <span className="cube-face">
                      <Trophy size={26} />
                    </span>
                    <span className="cube-face" />
                    <span className="cube-face" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
