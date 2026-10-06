import React from "react";

export function TopicBreakdown({ evaluations = [] }) {
  if (!evaluations.length) return null;

  const topics = Object.values(
    evaluations.reduce((accumulator, evaluation) => {
      const topic = evaluation.topic || "General";
      const entry = accumulator[topic] || {
        topic,
        correct: 0,
        total: 0,
        marksAwarded: 0,
        totalMarks: 0,
      };
      entry.correct += evaluation.isCorrect ? 1 : 0;
      entry.total += 1;
      entry.marksAwarded += Number(evaluation.marksAwarded) || 0;
      entry.totalMarks += Number(evaluation.marks) || 0;
      accumulator[topic] = entry;
      return accumulator;
    }, {}),
  ).map((entry) => ({
    ...entry,
    accuracy: Math.round((entry.correct / entry.total) * 100),
  }));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-stone-900">
          Topic Performance
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Accuracy across the topics covered in this assessment.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((entry) => (
          <div
            key={entry.topic}
            className="rounded-xl border border-stone-200 bg-stone-50/60 p-4"
          >
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-stone-800">{entry.topic}</span>
              <span className="font-extrabold text-emerald-700">
                {entry.accuracy}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${entry.accuracy}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-stone-500">
              {entry.correct}/{entry.total} correct · {entry.marksAwarded}/
              {entry.totalMarks} marks
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
