import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";

export function QuestionFilters({
  filters,
  onChangeFilter,
  onResetFilters,
  subjects = [],
  topics = [],
}) {
  return (
    <div className="bg-white border border-[#dfe3dc] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Search questions or topics..."
            value={filters.search || ""}
            onChange={(e) => onChangeFilter("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
          />
        </div>

        {/* Subject */}
        <div>
          <select
            value={filters.subjectId || ""}
            onChange={(e) => onChangeFilter("subjectId", e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <select
            value={filters.topic || ""}
            onChange={(e) => onChangeFilter("topic", e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <select
            value={filters.type || ""}
            onChange={(e) => onChangeFilter("type", e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
          >
            <option value="">All Question Types</option>
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="truefalse">True / False</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
        <div className="flex items-center gap-4">
          {/* Difficulty */}
          <div className="flex items-center gap-1.5 text-stone-600">
            <span className="font-semibold uppercase tracking-wider text-stone-400">
              Difficulty:
            </span>
            <select
              value={filters.difficulty || ""}
              onChange={(e) => onChangeFilter("difficulty", e.target.value)}
              className="px-2 py-1 rounded-lg border border-stone-300 text-xs focus:outline-hidden focus:border-stone-600 bg-white"
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Include Archived toggle */}
          <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-600 select-none">
            <input
              type="checkbox"
              checked={Boolean(filters.includeArchived)}
              onChange={(e) => onChangeFilter("includeArchived", e.target.checked)}
              className="w-4 h-4 rounded-sm border-stone-300 text-primary focus:ring-primary"
            />
            <span>Include archived questions</span>
          </label>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900"
        >
          <RotateCcw size={13} /> Reset Filters
        </Button>
      </div>
    </div>
  );
}
