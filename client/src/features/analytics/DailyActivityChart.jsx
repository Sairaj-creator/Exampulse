import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

export function DailyActivityChart({ data = [], height = 280, title = "Attempt Volume (Last 14 Days)" }) {
  const totalRecorded = (data || []).reduce(
    (sum, item) => sum + (Number(item.count) || 0),
    0,
  );

  if (!data || data.length === 0 || totalRecorded === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center h-[280px]">
        <Activity size={32} className="text-stone-300 mb-2" />
        <h3 className="text-sm font-bold text-stone-700">No Activity Recorded</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Submissions over the last 14 days will be plotted here in real-time.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => {
    let formattedDate = item.date;
    try {
      const parts = item.date.split("-");
      if (parts.length === 3) {
        const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        formattedDate = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }
    } catch {
      // fallback to raw string
    }
    return {
      date: item.date,
      displayDate: formattedDate,
      Submissions: Number(item.count) || 0,
    };
  });

  const totalAttempts = chartData.reduce((acc, curr) => acc + curr.Submissions, 0);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Total of <span className="font-semibold text-stone-700">{totalAttempts}</span> submissions across all batches
          </p>
        </div>
        <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          14-Day Trajectory
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
            <defs>
              <linearGradient id="attemptsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ee" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: "#78716c" }}
              angle={-20}
              textAnchor="end"
              height={35}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#78716c" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-stone-900 text-white rounded-xl px-3 py-2 text-xs shadow-lg space-y-1">
                      <div className="font-bold text-stone-200">{entry.displayDate}</div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-stone-300">Attempts:</span>
                        <span className="font-bold text-white">{entry.Submissions}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="Submissions"
              stroke="#059669"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#attemptsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
