import React, { Component } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, errors could be routed to an observability pipeline
    console.error("ExamPulse Application ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      return (
        <div className="min-h-screen bg-[#f6f7f3] text-[#172f29] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#dfe3dc] rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertOctagon size={28} />
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Application Exception
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-1">
                Something went wrong
              </h1>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                An unexpected interface exception occurred. Your ongoing answers and server sessions are safely saved.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] font-mono text-stone-700 overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} /> Reload Page
              </button>
              <a
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                <Home size={14} /> Home Page
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
