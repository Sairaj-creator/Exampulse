import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
const variants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-emerald-900",
        outline: "border border-stone-300 bg-white hover:bg-stone-50",
        ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        destructive: "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        default: "px-5 py-3 text-sm",
        sm: "px-3 py-2 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      ref={ref}
      className={cn(variants({ variant, size }), className)}
      {...props}
    />
  );
});
