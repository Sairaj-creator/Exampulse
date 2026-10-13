import { forwardRef } from "react";

/** Animated on/off switch backed by a real checkbox, so labels and forms work. */
export const Switch = forwardRef(function Switch(
  { className = "", ...props },
  ref,
) {
  return (
    <span className={`switch ${className}`}>
      <input ref={ref} type="checkbox" className="switch-input" {...props} />
      <span className="switch-track" aria-hidden="true" />
      <span className="switch-thumb" aria-hidden="true" />
    </span>
  );
});
