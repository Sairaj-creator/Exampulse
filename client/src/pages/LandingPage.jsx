import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { getHealth } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";

export function LandingPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30000,
  });
  const connected = health.isSuccess && health.data?.db === "connected";
  const { user } = useAuth();

  const roleDashboard = {
    student: "/student",
    teacher: "/teacher",
    admin: "/admin",
  };

  return (
    <div className="landing-shell">
      <header>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          ExamPulse
          <span className="brand-tag">PORTAL</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Button asChild>
              <Link
                to={roleDashboard[user.role] || "/"}
                className="flex items-center gap-1.5"
              >
                Go to Dashboard ({user.role}) <ArrowRight size={16} />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login" className="flex items-center gap-1.5">
                  <LogIn size={15} /> Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link to="/register" className="flex items-center gap-1.5">
                  <UserPlus size={15} /> Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main>
        <div className="eyebrow">
          <span /> THE START OF BETTER ASSESSMENT
        </div>

        <section className="hero">
          <div>
            <h1>
              Every exam.
              <br />A clearer picture.
            </h1>
            <p>
              Build thoughtful assessments, give students a focused, auto-saving
              exam experience, and transform attempts into rich performance
              analytics via MongoDB aggregation pipelines.
            </p>
            <div className="hero-actions">
              {user ? (
                <Button asChild>
                  <Link
                    to={roleDashboard[user.role] || "/"}
                    className="flex items-center gap-2"
                  >
                    Open {user.role.toUpperCase()} Workspace{" "}
                    <ArrowRight size={17} />
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    Access Portal <ArrowRight size={17} />
                  </Link>
                </Button>
              )}
              <span>ExamPulse · MERN Online Examination & Analytics</span>
            </div>
          </div>

          <div className="graphic" aria-hidden="true">
            <div className="graphic-top">
              PERFORMANCE, IN PERSPECTIVE <ChartNoAxesCombined size={20} />
            </div>
            <div className="bars">
              {[38, 53, 46, 68, 61, 82, 94].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="graphic-bottom">
              <span>Assessment</span>
              <span>Insight ↗</span>
            </div>
          </div>
        </section>

        {/* System Health Card */}
        <section className="status-card" aria-live="polite">
          <div>
            <div className="eyebrow">SYSTEM CONNECTION</div>
            <h2>
              {health.isPending
                ? "Connecting to your workspace…"
                : connected
                  ? "Your foundation is connected."
                  : "Database connection needed."}
            </h2>
            <p>
              {connected
                ? "The API is responding and MongoDB is connected with strict session validation."
                : "Configure server/.env and start MongoDB to bring the workspace online."}
            </p>
          </div>
          <span className={`status ${connected ? "online" : ""}`}>
            <span />
            {health.isFetching
              ? "Checking"
              : connected
                ? "Connected"
                : "Unavailable"}
          </span>
        </section>

        <div className="section-label">
          <h2>One platform. Three perspectives.</h2>
          <span>Role-based Academic Experience</span>
        </div>

        <section className="cards">
          {[
            {
              icon: BookOpen,
              title: "For students",
              text: "Distraction-free exam room with server countdown, realtime answer autosave, instant grading, and topic mastery analytics.",
              label: "LEARN & IMPROVE",
              link: "/student",
            },
            {
              icon: ChartNoAxesCombined,
              title: "For teachers",
              text: "Rich question bank, stepper exam builder with immutable snapshots, negative marking, submissions table, and difficulty histograms.",
              label: "ASSESS & UNDERSTAND",
              link: "/teacher",
            },
            {
              icon: ShieldCheck,
              title: "For administrators",
              text: "Oversee faculty and student directories, manage academic batches, maintain subject catalogues, and monitor platform health.",
              label: "ORGANISE & OVERSEE",
              link: "/admin",
            },
          ].map(({ icon: Icon, title, text, label, link }) => (
            <article key={title} className="flex flex-col justify-between">
              <div>
                <Icon size={23} />
                <div className="card-label">{label}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-200/60">
                <Link
                  to={user ? link : "/login"}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                >
                  Enter role <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer>
        <span>
          ExamPulse / Online Examination & Performance Analytics System
        </span>
        <span>MERN Stack Architecture</span>
      </footer>
    </div>
  );
}
