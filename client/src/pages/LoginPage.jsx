import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, AlertCircle, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/button";

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
      if (from) {
        navigate(from, { replace: true });
      } else {
        const defaultDestinations = {
          student: "/student",
          teacher: "/teacher",
          admin: "/admin",
        };
        navigate(defaultDestinations[user.role] || "/", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ExamPulse account to continue"
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@exampulse.dev"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full mt-2">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign In <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      {/* Demo Quick-Fill Buttons */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          <KeyRound size={14} /> Quick Demo Logins
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              setDemoCredentials("admin@exampulse.dev", "Admin@123")
            }
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors text-center cursor-pointer"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() =>
              setDemoCredentials("teacher1@exampulse.dev", "Teacher@123")
            }
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors text-center cursor-pointer"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() =>
              setDemoCredentials("student@exampulse.dev", "Student@123")
            }
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors text-center cursor-pointer"
          >
            Student
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-stone-500">
        Are you a student?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald-800 hover:underline"
        >
          Register for an account
        </Link>
      </div>
    </AuthLayout>
  );
}
