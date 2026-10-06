import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

export function TrendChart({ data = [], height = 300, title = "Performance Trend vs Batch Average" }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center h-[300px]">
        <TrendingUp size={32} className="text-stone-300 mb-2" />
        <h3 className="text-sm font-bold text-stone-700">No Assessment Trend Yet</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Take your first scheduled examination to unlock chronological progress tracking against your cohort.
        </p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item, idx) => ({
    name: item.examTitle || `Exam ${idx + 1}`,
    shortName: (item.examTitle || `Exam ${idx + 1}`).length > 15
      ? `${(item.examTitle || "").slice(0, 15)}…`
      : item.examTitle,
    Student: Number(item.percentage) || 0,
    BatchAverage: Number(item.batchAvg) || 0,
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
  }));

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Student score trajectory compared to peer cohort batch average
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ee" />
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 11, fill: "#78716c" }}
              angle={-20}
              textAnchor="end"
              height={40}
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
                      <div className="font-bold text-stone-200">{entry.name}</div>
                      {entry.date && <div className="text-[10px] text-stone-400">{entry.date}</div>}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-stone-300">Your Score:</span>
                        <span className="font-bold text-white">{entry.Student}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-400" />
                        <span className="text-stone-300">Batch Average:</span>
                        <span className="font-bold text-stone-300">{entry.BatchAverage}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="Student"
              name="Your Score"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#059669" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="BatchAverage"
              name="Batch Average"
              stroke="#a8a29e"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#a8a29e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
