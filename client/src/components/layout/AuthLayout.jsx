import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f7f3] text-[#172f29]">
      <header className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-[#dfe3dc]/80 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <Link
          to="/"
          className="flex items-center gap-3 font-bold text-xl tracking-tight text-stone-900 hover:opacity-90 transition-opacity"
        >
          <span className="w-9 h-9 rounded-xl bg-primary text-[#cfe697] flex items-center justify-center shadow-sm">
            <Activity size={20} />
          </span>
          ExamPulse
          <span className="text-[10px] tracking-wider uppercase font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
            ASSESSMENT ENGINE
          </span>
        </Link>
        <div className="text-xs text-stone-500 hidden sm:block">
          Secure Examination & Performance Analytics
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl shadow-sm p-8 sm:p-10">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>

      <footer className="py-6 px-6 sm:px-12 border-t border-[#dfe3dc] text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>ExamPulse · Built with MongoDB, Express, React & Node</span>
        <span>Role-based Academic Portal</span>
      </footer>
    </div>
  );
}
