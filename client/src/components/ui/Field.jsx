import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

const controlClass =
  "w-full rounded-xl border border-stone-300 py-2.5 pr-3 text-sm disabled:opacity-60";

/**
 * Labelled form control with an optional leading icon. Renders an <input>
 * by default, or a <select> when `as="select"`. Password fields get a
 * show/hide toggle.
 */
export function Field({
  label,
  hint,
  icon: Icon,
  as = "input",
  type = "text",
  className,
  children,
  ...props
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = as === "input" && type === "password";
  const Control = as;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600"
      >
        {label}
      </label>
      <div className="group relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 transition-colors group-focus-within:text-emerald-700">
            <Icon size={16} />
          </span>
        )}
        <Control
          id={id}
          {...(as === "input"
            ? { type: isPassword && revealed ? "text" : type }
            : {})}
          className={cn(
            controlClass,
            Icon ? "pl-9" : "pl-3.5",
            isPassword && "pr-10",
          )}
          {...props}
        >
          {children}
        </Control>
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700"
          >
            <span
              key={revealed ? "hide" : "show"}
              className="animate-pop inline-flex"
            >
              {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}
