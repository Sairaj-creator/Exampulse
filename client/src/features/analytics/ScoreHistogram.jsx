import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart2 } from "lucide-react";

export function ScoreHistogram({ data = [], height = 260, title = "Score Distribution" }) {
  const totalScores = (data || []).reduce(
    (sum, bucket) => sum + (Number(bucket.count) || 0),
    0,
  );

  if (!data || data.length === 0 || totalScores === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center h-[260px]">
        <BarChart2 size={32} className="text-stone-300 mb-2" />
        <h3 className="text-sm font-bold text-stone-700">No Distribution Data</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Scores will populate across 10 decile buckets as candidates submit their attempts.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    bucket: d.range,
    count: d.count || 0,
  }));

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-stone-900">{title}</h3>
        <p className="text-xs text-stone-400 mt-0.5">
          Histogram of candidate percentages across 10 score deciles
        </p>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ee" />
            <XAxis
              dataKey="bucket"
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
                    <div className="bg-stone-900 text-white rounded-xl px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <div className="font-bold text-stone-300">Score Range: {entry.bucket}%</div>
                      <div className="text-emerald-400 font-semibold">
                        {entry.count} candidate{entry.count === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
