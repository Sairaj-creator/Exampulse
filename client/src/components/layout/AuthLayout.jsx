import React from "react";
import { Link } from "react-router-dom";
import { CloudUpload, EyeOff, Timer } from "lucide-react";
import { BrandMark, BrandWordmark } from "../common/BrandMark";
import { ThemeToggle } from "../ui/ThemeToggle";
import { MotionToggle } from "../ui/MotionToggle";
import { Tilt } from "../ui/Tilt";
import { HeroScene } from "../../features/landing/HeroScene";

const PROMISES = [
  { icon: Timer, text: "Server-timed attempts that survive a refresh" },
  { icon: CloudUpload, text: "Every answer saved as you choose it" },
  { icon: EyeOff, text: "Answer keys never leave the server mid-exam" },
];

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col text-stone-900">
      <header className="flex h-20 items-center justify-between px-5 sm:px-10">
        <Link
          to="/"
          className="flex items-center gap-3 text-xl transition-opacity hover:opacity-90"
        >
          <BrandMark size={38} />
          <BrandWordmark className="text-stone-900" />
          <span className="hidden rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500 sm:inline">
            Assessment Engine
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <MotionToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-8 sm:px-10 lg:grid-cols-2">
        {/* Brand panel */}
        <section className="animate-rise hidden lg:block">
          <div className="eyebrow">
            Secure examination &amp; performance analytics
          </div>
          <p className="display mt-3 max-w-md text-4xl leading-[1.08] text-stone-900">
            Sit the exam. <span className="italic">See where you stand.</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-stone-600"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <HeroScene compact className="mt-4 max-w-[420px]" />
        </section>

        {/* Form card */}
        <div className="mx-auto w-full max-w-md">
          <Tilt
            max={2.5}
            className="glass-strong animate-pop rounded-3xl p-7 sm:p-10"
          >
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </Tilt>
        </div>
      </main>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-stone-200/70 px-5 py-6 text-xs text-stone-500 sm:flex-row sm:px-10">
        <span>ExamPulse · Built with MongoDB, Express, React &amp; Node</span>
        <span>Role-based Academic Portal</span>
      </footer>
    </div>
  );
}
