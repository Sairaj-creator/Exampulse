import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  ChartNoAxesCombined,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/Field";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@exampulse.dev",
    password: "Admin@123",
    icon: ShieldCheck,
  },
  {
    role: "Teacher",
    email: "teacher1@exampulse.dev",
    password: "Teacher@123",
    icon: ChartNoAxesCombined,
  },
  {
    role: "Student",
    email: "student@exampulse.dev",
    password: "Student@123",
    icon: BookOpen,
  },
];

const DEFAULT_DESTINATIONS = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login({ email, password });
      const home = DEFAULT_DESTINATIONS[user.role] || "/";
      // Only return to the page that sent us here if this role can open it.
      const canReturn =
        from && (from === "/profile" || from.startsWith(`/${user.role}`));
      navigate(canReturn ? from : home, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ExamPulse account to continue"
    >
      {error && (
        <div
          role="alert"
          className="animate-pop mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email Address"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@exampulse.dev"
        />

        <Field
          label="Password"
          icon={Lock}
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign In <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      {/* Demo quick-fill */}
      <div className="mt-8 border-t border-stone-200 pt-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <KeyRound size={14} /> Quick Demo Logins
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const active = email === account.email;
            return (
              <button
                key={account.role}
                type="button"
                onClick={() => setDemoCredentials(account)}
                aria-pressed={active}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all duration-300 ease-spring hover:-translate-y-0.5 ${
                  active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 bg-stone-100/70 text-stone-700 hover:border-stone-300"
                }`}
              >
                <Icon size={16} />
                {account.role}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-stone-500">
        Are you a student?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Register for an account
        </Link>
      </div>
    </AuthLayout>
  );
}
