import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  Layers,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getBatchesApi } from "../features/auth/api";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/button";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadBatches() {
      try {
        const data = await getBatchesApi();
        setBatches(data || []);
        if (data && data.length > 0) {
          setBatchId(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
      } finally {
        setLoadingBatches(false);
      }
    }
    loadBatches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!batchId) {
      setError("Please select an assigned batch.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, batchId });
      navigate("/student", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Registration failed. Please check the provided information.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create student account"
      subtitle="Register with your batch to access timed assessments"
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
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <User size={16} />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Mercer"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            />
          </div>
        </div>

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
              placeholder="alex@college.edu"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Password (min 8 chars, 1 letter & 1 number)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Assigned Batch
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Layers size={16} />
            </span>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={loadingBatches}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 focus:ring-1 focus:ring-stone-600 bg-white"
            >
              {loadingBatches ? (
                <option value="">Loading batches...</option>
              ) : batches.length === 0 ? (
                <option value="">No active batches found</option>
              ) : (
                batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.year})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full mt-2">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Register <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-stone-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-emerald-800 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
