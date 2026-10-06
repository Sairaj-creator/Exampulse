import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f3] flex flex-col items-center justify-center p-6 text-center text-[#172f29]">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-6 shadow-xs border border-red-200">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">
        Access Restricted
      </h1>
      <p className="text-sm text-stone-500 max-w-md mb-8 leading-relaxed">
        Your current role permissions do not authorize access to this requested
        examination or management resource.
      </p>
      <Button asChild>
        <Link to="/" className="inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Your Dashboard
        </Link>
      </Button>
    </div>
  );
}
