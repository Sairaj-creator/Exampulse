import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
const variants = cva(
  "btn inline-flex items-center justify-center gap-2 rounded-xl font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "btn-sheen bg-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_8px_18px_-10px_rgb(var(--c-emerald-900)/0.7)] hover:bg-primary-hover",
        accent:
          "btn-sheen bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_22px_-10px_rgb(var(--c-amber-600)/0.8)] hover:brightness-105",
        outline:
          "border border-stone-300 bg-white/60 text-stone-800 backdrop-blur-md hover:border-stone-400 hover:bg-white/90",
        ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        destructive:
          "btn-sheen bg-rose-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] hover:bg-rose-700",
      },
      size: {
        default: "px-5 py-3 text-sm",
        sm: "px-3 py-2 text-xs",
        lg: "px-6 py-3.5 text-[15px]",
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
