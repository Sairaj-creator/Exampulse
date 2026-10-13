import { usePointerTilt } from "../../hooks/usePointerTilt";
import { cn } from "../../lib/utils";

/**
 * Tilts its content toward the pointer in 3D and moves a soft glare with it.
 * Purely decorative: see usePointerTilt for when it stays still.
 */
export function Tilt({
  as: Component = "div",
  max = 7,
  glare = true,
  className,
  children,
  ...props
}) {
  const tilt = usePointerTilt(max);

  return (
    <Component {...tilt} className={cn("tilt relative", className)} {...props}>
      {children}
      {glare && <span className="tilt-glare" aria-hidden="true" />}
    </Component>
  );
}
