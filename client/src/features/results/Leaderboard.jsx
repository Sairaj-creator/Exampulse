import React from "react";
import { Trophy, Medal, Clock, Award, Users } from "lucide-react";

export function Leaderboard({
  topEntries = [],
  myEntry = null,
  totalParticipants = 0,
  examTitle = "",
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs">
          <Trophy size={13} className="text-amber-500 fill-amber-500" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-stone-700 bg-stone-100 border border-stone-300 px-2.5 py-0.5 rounded-full text-xs">
          <Medal size={13} className="text-stone-400" /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 font-extrabold text-amber-900 bg-amber-100/60 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs">
          <Medal size={13} className="text-amber-700" /> #3
        </span>
      );
    }
    return (
      <span className="font-bold text-stone-500 text-xs px-2 py-0.5">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
            Official Standings · Final Competition Ranking
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {examTitle || "Exam Leaderboard"}
          </h2>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
            <Users size={14} className="text-stone-400" />
            <span>
              {totalParticipants} candidate{totalParticipants === 1 ? "" : "s"}{" "}
              participated
            </span>
          </p>
        </div>

        {/* My Entry highlight card */}
        {myEntry && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Your Rank
              </span>
              <span className="text-2xl font-extrabold text-emerald-950 block">
                #{myEntry.rank}
              </span>
            </div>
            <div className="border-l border-emerald-200/80 pl-4 space-y-0.5 text-xs text-emerald-900">
              <div>
                Score: <strong>{myEntry.score} / {myEntry.totalMarks}</strong> ({myEntry.percentage}%)
              </div>
              <div>
                Percentile: <strong>{myEntry.percentile}%</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/75 border-b border-stone-200 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-center">Time Taken</th>
                <th className="py-3.5 px-4 text-center">Percentile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topEntries.map((entry) => {
                const isCurrentUser =
                  myEntry && myEntry.attemptId === entry.attemptId;

                return (
                  <tr
                    key={entry.attemptId || entry.rank}
                    className={`transition-colors hover:bg-stone-50/60 ${
                      isCurrentUser ? "bg-emerald-50/40 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {getRankBadge(entry.rank)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">
                        {entry.student?.name || "Student"}
                        {isCurrentUser && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </div>
                      {entry.student?.rollNumber && (
                        <div className="text-xs text-stone-400">
                          Roll: {entry.student.rollNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-900">
                      {entry.score} / {entry.totalMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          entry.passed
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {entry.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-stone-600 font-mono">
                      {formatTime(entry.timeTakenSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-xs text-emerald-700">
                      {entry.percentile}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
