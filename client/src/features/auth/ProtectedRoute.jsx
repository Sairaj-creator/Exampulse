import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BrandMark } from "../../components/common/BrandMark";

const ROLE_HOME = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4" role="status">
          <div className="relative grid h-16 w-16 place-items-center">
            <div className="absolute inset-0 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
            <BrandMark size={38} />
          </div>
          <p className="text-xs font-medium tracking-wide text-stone-500">
            Authenticating session…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Send the user to the dashboard their role is allowed to open
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  }

  return children;
}
