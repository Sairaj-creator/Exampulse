import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium tracking-wide">
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
    // Redirect to user's authorized role dashboard
    const roleRoutes = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
    };
    const redirectPath = roleRoutes[user.role] || "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
