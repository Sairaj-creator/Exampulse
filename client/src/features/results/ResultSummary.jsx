import React from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Trophy,
  Award,
} from "lucide-react";

export function ResultSummary({
  correctCount = 0,
  wrongCount = 0,
  unansweredCount = 0,
  timeTakenSeconds = 0,
  ranking = null,
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* Correct */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between text-stone-400 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Correct
          </span>
          <CheckCircle2 size={16} className="text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-stone-900">{correctCount}</div>
        <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
          Full marks awarded
        </div>
      </div>

      {/* Wrong */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between text-stone-400 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Wrong
          </span>
          <XCircle size={16} className="text-rose-600" />
        </div>
        <div className="text-2xl font-bold text-stone-900">{wrongCount}</div>
        <div className="text-[11px] text-rose-700 font-medium mt-0.5">
          Incorrect options
        </div>
      </div>

      {/* Skipped */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between text-stone-400 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Unanswered
          </span>
          <HelpCircle size={16} className="text-stone-400" />
        </div>
        <div className="text-2xl font-bold text-stone-900">{unansweredCount}</div>
        <div className="text-[11px] text-stone-400 font-medium mt-0.5">
          Zero penalty
        </div>
      </div>

      {/* Time Taken */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs">
        <div className="flex items-center justify-between text-stone-400 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Time Taken
          </span>
          <Clock size={16} className="text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-stone-900">
          {formatTime(timeTakenSeconds)}
        </div>
        <div className="text-[11px] text-stone-400 font-medium mt-0.5">
          Exam completion time
        </div>
      </div>

      {/* Rank and Percentile banner (spans all columns) */}
      <div className="col-span-2 sm:col-span-4 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 block">
              Performance Rank & Percentile
            </span>
            <span className="text-xs text-stone-500 block">
              {ranking
                ? `Ranked #${ranking.rank} out of ${ranking.totalParticipants} candidate(s)`
                : "Final batch ranking and percentile unlock after the scheduled exam window closes."}
            </span>
          </div>
        </div>

        {ranking ? (
          <div className="flex items-center gap-3">
            <div className="bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">
                Rank
              </span>
              <span className="text-base font-extrabold text-stone-900">
                #{ranking.rank}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                Percentile
              </span>
              <span className="text-base font-extrabold text-emerald-800">
                {ranking.percentile}%
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-stone-400 bg-stone-50 border border-stone-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Awaiting Window Close
          </span>
        )}
      </div>
    </div>
  );
}
