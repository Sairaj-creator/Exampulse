import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f3] flex flex-col items-center justify-center p-6 text-center text-[#172f29]">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6 shadow-xs border border-amber-200">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-stone-500 max-w-md mb-8 leading-relaxed">
        The assessment or dashboard view you are trying to access does not exist
        or may have been relocated.
      </p>
      <Button asChild>
        <Link to="/" className="inline-flex items-center gap-2">
          <Home size={16} /> Return to Portal
        </Link>
      </Button>
    </div>
  );
}
