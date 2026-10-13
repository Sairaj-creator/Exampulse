import { Link } from "react-router-dom";
import { BrandMark, BrandWordmark } from "./BrandMark";
import { Tilt } from "../ui/Tilt";

const TONES = {
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

/** Full-page message used for "not found" and "access restricted". */
export function StatusScreen({
  icon: Icon,
  tone = "warning",
  code,
  title,
  description,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center text-stone-900">
      <Link to="/" className="mb-8 flex items-center gap-2.5 text-lg">
        <BrandMark size={32} />
        <BrandWordmark className="text-stone-900" />
      </Link>

      <Tilt
        max={5}
        className="glass-strong animate-pop w-full max-w-md rounded-3xl p-8 sm:p-10"
      >
        {code && (
          <div
            className="display text-gradient-accent tilt-pop text-7xl leading-none"
            aria-hidden="true"
          >
            {code}
          </div>
        )}
        <div
          className={`mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${TONES[tone]}`}
        >
          <Icon size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
          {description}
        </p>
        <div className="mt-7">{children}</div>
      </Tilt>
    </div>
  );
}
