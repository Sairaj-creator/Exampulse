import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { BookOpen } from "lucide-react";

const PALETTE = ["#059669", "#0284c7", "#7c3aed", "#d97706", "#dc2626"];

export function SubjectBarChart({ data = [], height = 300, title = "Subject Performance" }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center h-[300px]">
        <BookOpen size={32} className="text-stone-300 mb-2" />
        <h3 className="text-sm font-bold text-stone-700">No Subject Data Yet</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Complete assessments across different curriculum subjects to view disciplinary strengths.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.subjectCode || item.subjectName || "Subject",
    fullName: item.subjectName || item.subjectCode || "Subject",
    averagePercentage: Number(item.averagePercentage) || 0,
    assessments: item.examsTaken ?? item.attemptsCount ?? 0,
    volumeLabel: item.examsTaken !== undefined ? "assessment" : "submission",
  }));

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-stone-900">{title}</h3>
        <p className="text-xs text-stone-400 mt-0.5">
          Mean percentage achieved across distinct courses
        </p>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ee" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#78716c" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-stone-900 text-white rounded-xl px-3 py-2 text-xs shadow-lg space-y-1">
                      <div className="font-bold text-stone-200">{entry.fullName}</div>
                      <div className="text-emerald-400 font-semibold">
                        Average: {entry.averagePercentage}%
                      </div>
                      <div className="text-stone-400 text-[10px]">
                        {entry.assessments} {entry.volumeLabel}
                        {entry.assessments === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="averagePercentage" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
