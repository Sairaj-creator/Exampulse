import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CheckCircle2, XCircle } from "lucide-react";

export function PassFailDonut({ passRate = { passedCount: 0, failedCount: 0, passPercentage: 0 } }) {
  const { passedCount = 0, failedCount = 0, passPercentage = 0 } = passRate;
  const total = passedCount + failedCount;

  const data = [
    { name: "Passed", value: passedCount, color: "#059669" },
    { name: "Failed", value: failedCount, color: "#e11d48" },
  ];

  if (total === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center h-[260px]">
        <CheckCircle2 size={32} className="text-stone-300 mb-2" />
        <h3 className="text-sm font-bold text-stone-700">No Submissions Yet</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Pass/fail clearance rate will update automatically as candidates complete the exam.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-stone-900">Pass / Fail Clearance Rate</h3>
        <p className="text-xs text-stone-400 mt-0.5">
          Proportion of candidates achieving minimum qualifying standard
        </p>
      </div>

      <div className="relative w-full h-[180px] flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0];
                  return (
                    <div className="bg-stone-900 text-white rounded-xl px-3 py-1.5 text-xs shadow-lg">
                      <span className="font-semibold">{entry.name}:</span> {entry.value} candidate{entry.value === 1 ? "" : "s"}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-stone-900">{passPercentage}%</span>
          <span className="text-[10px] uppercase font-bold text-stone-400">Pass Rate</span>
        </div>
      </div>

      <div className="flex items-center justify-around pt-2 border-t border-stone-100 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>{passedCount} Passed</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-rose-800">
          <XCircle size={14} className="text-rose-600" />
          <span>{failedCount} Failed</span>
        </div>
      </div>
    </div>
  );
}
