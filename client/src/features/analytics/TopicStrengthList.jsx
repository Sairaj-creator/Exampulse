import React from "react";
import { CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export function TopicStrengthList({ topics = { strengths: [], weaknesses: [] } }) {
  const strengths = topics.strengths || [];
  const weaknesses = topics.weaknesses || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Strengths Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900">Topic Strengths (≥ 75%)</h3>
          </div>
          <p className="text-xs text-stone-400 mb-4">
            Curriculum domains where you consistently score above mastery threshold
          </p>

          {strengths.length === 0 ? (
            <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
              <Layers size={24} className="text-stone-300 mx-auto mb-1.5" />
              <p className="text-xs text-stone-500 font-medium">No Qualified Strengths Yet</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto mt-0.5">
                Maintain 75%+ accuracy across at least 5 questions in a topic to register a strength.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {strengths.map((item) => (
                <div key={item.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{item.topic}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.accuracy)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {item.correctQuestions} / {item.totalQuestions} questions correct
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weaknesses Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">Areas for Improvement (&lt; 50%)</h3>
          </div>
          <p className="text-xs text-stone-400 mb-4">
            Key concepts to revisit before subsequent comprehensive examinations
          </p>

          {weaknesses.length === 0 ? (
            <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
              <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs text-stone-700 font-bold">No Critical Weaknesses</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto mt-0.5">
                Great work! You have no curriculum topics performing below 50% accuracy.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weaknesses.map((item) => (
                <div key={item.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{item.topic}</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.accuracy)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {item.correctQuestions} / {item.totalQuestions} questions correct
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
