import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

/** Fades its children up the first time they scroll into view. */
export function Reveal({
  as: Component = "div",
  delay = 0,
  className,
  children,
  ...props
}) {
  const ref = useRef(null);
  // Without IntersectionObserver (old browsers, tests) content is just shown.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={cn("reveal", visible && "is-visible", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
