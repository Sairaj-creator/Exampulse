import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  CloudUpload,
  EyeOff,
  FileSpreadsheet,
  Gauge,
  Layers,
  LogIn,
  PenLine,
  ShieldCheck,
  Shuffle,
  Timer,
  Trophy,
  UserPlus,
} from "lucide-react";
import { getHealth } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Tilt } from "../components/ui/Tilt";
import { Reveal } from "../components/ui/Reveal";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { MotionToggle } from "../components/ui/MotionToggle";
import { BrandMark, BrandWordmark } from "../components/common/BrandMark";
import { HeroScene } from "../features/landing/HeroScene";

const ROLE_DASHBOARD = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

const FACTS = [
  { value: "3", label: "role workspaces" },
  { value: "400 ms", label: "answer autosave" },
  { value: "6", label: "analytics views" },
  { value: "1", label: "attempt per exam" },
];

const TICKER = [
  "Server-authoritative timer",
  "Autosave with retry",
  "Negative marking",
  "Question & option shuffling",
  "Immutable exam snapshots",
  "Tab-switch audit trail",
  "Rank & percentile",
  "Topic mastery",
  "Discrimination index",
  "CSV export",
];

const ROLES = [
  {
    icon: BookOpen,
    label: "Learn & improve",
    title: "For students",
    text: "Distraction-free exam room with server countdown, realtime answer autosave, instant grading, and topic mastery analytics.",
    link: "/student",
    tone: "bg-blue-100 text-blue-800",
  },
  {
    icon: ChartNoAxesCombined,
    label: "Assess & understand",
    title: "For teachers",
    text: "Rich question bank, stepper exam builder with immutable snapshots, negative marking, submissions table, and difficulty histograms.",
    link: "/teacher",
    tone: "bg-emerald-100 text-emerald-800",
  },
  {
    icon: ShieldCheck,
    label: "Organise & oversee",
    title: "For administrators",
    text: "Oversee faculty and student directories, manage academic batches, maintain subject catalogues, and monitor platform health.",
    link: "/admin",
    tone: "bg-purple-100 text-purple-800",
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: "Build",
    text: "Pick questions from your bank, set marks, the window and the rules. Publishing freezes a snapshot, so later edits never change a live paper.",
  },
  {
    icon: Timer,
    title: "Sit",
    text: "Students get one attempt on a server clock. Every answer saves as it is chosen, and the paper submits itself when time runs out.",
  },
  {
    icon: Gauge,
    title: "Understand",
    text: "Grading is instant. Score spread, question difficulty, weak topics and at-risk students are ready the moment the window closes.",
  },
];

const FEATURES = [
  {
    icon: Timer,
    title: "A clock that cannot be paused",
    text: "The deadline lives on the server. Closing the tab, refreshing, or changing the device clock does not buy extra time.",
    className: "md:col-span-2",
    accent: true,
  },
  {
    icon: CloudUpload,
    title: "Nothing to remember to save",
    text: "Answers are saved as they are picked, retried on a weak connection, and flushed before submission.",
  },
  {
    icon: EyeOff,
    title: "Answer keys stay on the server",
    text: "Correct options and explanations are never sent during an attempt, and review opens only when the teacher allows it.",
  },
  {
    icon: Shuffle,
    title: "A different paper for each seat",
    text: "Question and option order can be shuffled per student, and tab switches are logged for the teacher.",
  },
  {
    icon: Trophy,
    title: "Fair ranking",
    text: "Score first, then time taken. Ties share a rank, and standings appear only after the exam ends.",
  },
  {
    icon: FileSpreadsheet,
    title: "Results that travel",
    text: "Export any exam to CSV, or print a student's full report with per-question review.",
    className: "md:col-span-2",
  },
];

export function LandingPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30000,
  });
  const connected = health.isSuccess && health.data?.db === "connected";
  const { user } = useAuth();
  const dashboard = user ? ROLE_DASHBOARD[user.role] || "/" : "/login";

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
      {/* Navigation */}
      <header className="sticky top-4 z-30 pt-4">
        <div className="glass-strong animate-rise flex items-center justify-between rounded-2xl px-3 py-2.5 sm:px-5">
          <Link to="/" className="flex items-center gap-2.5 text-lg sm:text-xl">
            <BrandMark size={38} />
            <BrandWordmark className="text-stone-900" />
            <span className="ml-1 hidden rounded-md border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-500 sm:inline">
              Portal
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <MotionToggle className="hidden sm:grid" />
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to={dashboard}>
                  <span className="hidden sm:inline">
                    Go to Dashboard ({user.role})
                  </span>
                  <span className="sm:hidden">Dashboard</span>
                  <ArrowRight size={15} />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">
                    <LogIn size={14} /> Sign In
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/register">
                    <UserPlus size={14} /> Register
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="grid items-center gap-12 pb-10 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-20">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-600 backdrop-blur-md">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online examination &amp; analytics
            </div>

            <h1 className="display mt-6 text-[clamp(2.6rem,5.3vw,4.6rem)] leading-[1.02] text-stone-900">
              Every exam.
              <br />
              <span className="relative inline-block italic sm:whitespace-nowrap">
                A clearer picture.
                <svg
                  viewBox="0 0 300 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-3 w-full text-accent"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9c48-7 96-7 148-3s98 5 148-2"
                    pathLength="1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="line-draw"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-stone-600">
              Build thoughtful assessments, give students a focused, auto-saving
              exam experience, and turn every attempt into performance analytics
              you can act on.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={dashboard}>
                  {user
                    ? `Open ${user.role.toUpperCase()} Workspace`
                    : "Access Portal"}
                  <ArrowRight size={17} />
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="accent" size="lg">
                  <Link to="/register">
                    Create student account <ArrowUpRight size={17} />
                  </Link>
                </Button>
              )}
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {FACTS.map((fact) => (
                <div key={fact.label} className="border-l-2 border-accent pl-3">
                  <dt className="sr-only">{fact.label}</dt>
                  <dd className="font-mono text-xl font-bold tracking-tight text-stone-900">
                    {fact.value}
                  </dd>
                  <dd className="mt-0.5 text-[11px] leading-4 text-stone-500">
                    {fact.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroScene className="max-w-[560px]" />
        </section>

        {/* Capability ticker */}
        <div
          className="marquee-mask overflow-hidden border-y border-stone-200/70 py-3.5"
          aria-hidden="true"
        >
          <div className="marquee">
            {[...TICKER, ...TICKER].map((item, index) => (
              <span
                key={index}
                className="flex items-center gap-8 pl-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        </div>

        {/* System status */}
        <Reveal
          as="section"
          aria-live="polite"
          className="glass mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8"
        >
          <div>
            <div className="eyebrow">System connection</div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-stone-900">
              {health.isPending
                ? "Connecting to your workspace…"
                : connected
                  ? "Your foundation is connected."
                  : "Database connection needed."}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {connected
                ? "The API is responding and MongoDB is connected with strict session validation."
                : "Configure server/.env and start MongoDB to bring the workspace online."}
            </p>
          </div>
          <span
            className={`flex flex-none items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "live-dot bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {health.isFetching
              ? "Checking"
              : connected
                ? "Connected"
                : "Unavailable"}
          </span>
        </Reveal>

        {/* Roles */}
        <section className="pt-20">
          <Reveal className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <div className="eyebrow">Role-based academic experience</div>
              <h2 className="display mt-2 text-3xl text-stone-900 sm:text-4xl">
                One platform. Three perspectives.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-500">
              Each role signs in to its own workspace, with access enforced on
              every request.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {ROLES.map(
              ({ icon: Icon, title, text, label, link, tone }, index) => (
                <Reveal key={title} delay={index * 90}>
                  <Tilt
                    as="article"
                    className="glass flex h-full flex-col justify-between rounded-3xl p-7"
                  >
                    <div>
                      <span
                        className={`tilt-pop grid h-12 w-12 place-items-center rounded-2xl ${tone}`}
                      >
                        <Icon size={22} />
                      </span>
                      <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                        {label}
                      </div>
                      <h3 className="mt-1.5 text-xl font-bold tracking-tight text-stone-900">
                        {title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-stone-600">
                        {text}
                      </p>
                    </div>
                    <div className="mt-6 border-t border-stone-200/70 pt-4">
                      <Link
                        to={user ? link : "/login"}
                        className="group inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Enter role
                        <ArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </Link>
                    </div>
                  </Tilt>
                </Reveal>
              ),
            )}
          </div>
        </section>

        {/* Flow */}
        <section className="pt-24">
          <Reveal>
            <div className="eyebrow">How an exam moves</div>
            <h2 className="display mt-2 max-w-xl text-3xl text-stone-900 sm:text-4xl">
              From question bank to insight in three steps.
            </h2>
          </Reveal>

          <ol className="relative mt-10 grid gap-5 md:grid-cols-3">
            <span
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent md:block"
              aria-hidden="true"
            />
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <Reveal
                as="li"
                key={title}
                delay={index * 110}
                className="relative"
              >
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-lift">
                  <Icon size={22} />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-[11px] font-bold text-accent-ink">
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-bold text-stone-900">
                  {title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-7 text-stone-600">
                  {text}
                </p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Feature bento */}
        <section className="pt-24">
          <Reveal>
            <div className="eyebrow">Built for exam day</div>
            <h2 className="display mt-2 max-w-2xl text-3xl text-stone-900 sm:text-4xl">
              The details that make a result trustworthy.
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {FEATURES.map(
              ({ icon: Icon, title, text, className = "", accent }, index) => (
                <Reveal
                  key={title}
                  delay={(index % 3) * 80}
                  className={className}
                >
                  <Tilt
                    max={4}
                    className={`h-full rounded-3xl p-6 ${
                      accent ? "bg-primary text-white shadow-lift" : "glass"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        accent
                          ? "bg-accent text-accent-ink"
                          : "bg-stone-900 text-white"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <h3
                      className={`mt-5 text-base font-bold ${
                        accent ? "" : "text-stone-900"
                      }`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        accent ? "opacity-80" : "text-stone-600"
                      }`}
                    >
                      {text}
                    </p>
                  </Tilt>
                </Reveal>
              ),
            )}
          </div>
        </section>

        {/* Call to action */}
        <Reveal as="section" className="py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center text-white shadow-lift sm:px-12">
            <div
              className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl"
              aria-hidden="true"
            />
            <Layers size={28} className="relative mx-auto text-accent" />
            <h2 className="display relative mx-auto mt-4 max-w-2xl text-3xl sm:text-5xl">
              Ready when the next exam is.
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-sm leading-7 opacity-80">
              Sign in to your workspace, or register as a student with your
              batch to see the assessments assigned to you.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="accent" size="lg">
                <Link to={dashboard}>
                  {user ? "Open workspace" : "Sign in"} <ArrowRight size={17} />
                </Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  className="border border-white/25 bg-white/10 text-white shadow-none hover:bg-white/20"
                >
                  <Link to="/register">Register as a student</Link>
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="flex flex-col justify-between gap-3 border-t border-stone-200/70 py-7 text-xs text-stone-500 sm:flex-row">
        <span className="flex items-center gap-2">
          <BrandMark size={20} />
          ExamPulse / Online Examination &amp; Performance Analytics System
        </span>
        <span>MERN Stack Architecture</span>
      </footer>
    </div>
  );
}
