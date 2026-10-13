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
import { Field } from "../components/ui/Field";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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
    let isMounted = true;
    async function loadBatches() {
      try {
        const data = await getBatchesApi();
        if (!isMounted) return;
        setBatches(data || []);
        if (data && data.length > 0) {
          setBatchId(data[0]._id);
        }
      } catch {
        if (isMounted) {
          setError(
            "Could not load the batch list. Check your connection and reload.",
          );
        }
      } finally {
        if (isMounted) setLoadingBatches(false);
      }
    }
    loadBatches();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!batchId) {
      setError("Please select an assigned batch.");
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError(
        "Password must be at least 8 characters and include a letter and a number.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email, password, batchId });
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
          label="Full Name"
          icon={User}
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Mercer"
        />

        <Field
          label="Email Address"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@college.edu"
        />

        <Field
          label="Password"
          hint="At least 8 characters, with a letter and a number."
          icon={Lock}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Field
          label="Assigned Batch"
          icon={Layers}
          as="select"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          disabled={loadingBatches}
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
        </Field>

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
          className="font-semibold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
