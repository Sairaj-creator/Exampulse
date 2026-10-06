import React from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

export function OptionEditor({
  type,
  options,
  correctKeys,
  onChangeOptions,
  onChangeCorrectKeys,
  disabled = false,
}) {
  const handleToggleSingle = (key) => {
    onChangeCorrectKeys([key]);
  };

  const handleToggleMultiple = (key) => {
    if (correctKeys.includes(key)) {
      if (correctKeys.length > 1) {
        onChangeCorrectKeys(correctKeys.filter((k) => k !== key));
      }
    } else {
      onChangeCorrectKeys([...correctKeys, key]);
    }
  };

  const handleOptionTextChange = (index, text) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, text } : opt
    );
    onChangeOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextKey = OPTION_KEYS[options.length];
    const newOptions = [...options, { key: nextKey, text: "" }];
    onChangeOptions(newOptions);
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length <= 2) return;
    const filtered = options.filter((_, i) => i !== indexToRemove);
    // Re-key options sequentially
    const rekeyed = filtered.map((opt, i) => ({
      ...opt,
      key: OPTION_KEYS[i],
    }));
    onChangeOptions(rekeyed);

    // If removed key was in correctKeys, recompute correctKeys
    const validKeys = new Set(rekeyed.map((o) => o.key));
    const updatedCorrect = correctKeys
      .map((oldKey) => {
        const oldIndex = OPTION_KEYS.indexOf(oldKey);
        if (oldIndex === indexToRemove) return null;
        if (oldIndex > indexToRemove) return OPTION_KEYS[oldIndex - 1];
        return oldKey;
      })
      .filter((k) => k && validKeys.has(k));

    if (updatedCorrect.length === 0 && rekeyed.length > 0) {
      onChangeCorrectKeys([rekeyed[0].key]);
    } else {
      onChangeCorrectKeys(updatedCorrect);
    }
  };

  if (type === "truefalse") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
            True / False Answer Selection
          </label>
          <span className="text-[11px] text-stone-400">Fixed 2 choices</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isSelected = correctKeys.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                disabled={disabled}
                onClick={() => handleToggleSingle(opt.key)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left font-medium transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-600"
                    : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-emerald-700 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </div>
                {isSelected && (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
            {type === "multiple"
              ? "Options & Multiple Correct Answers"
              : "Options & Single Correct Answer"}
          </label>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {type === "multiple"
              ? "Check all options that apply as correct answers"
              : "Select the radio button for the single correct option"}
          </p>
        </div>
        {options.length < 6 && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs"
          >
            <Plus size={14} /> Add Option
          </Button>
        )}
      </div>

      <div className="space-y-2.5">
        {options.map((opt, index) => {
          const isSelected = correctKeys.includes(opt.key);
          return (
            <div
              key={opt.key}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/40"
                  : "border-stone-200 bg-white"
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  type === "multiple"
                    ? handleToggleMultiple(opt.key)
                    : handleToggleSingle(opt.key)
                }
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
                title={
                  isSelected
                    ? "Correct Answer (Click to toggle)"
                    : "Click to mark as correct answer"
                }
              >
                {opt.key}
              </button>

              <input
                type="text"
                required
                disabled={disabled}
                value={opt.text}
                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                placeholder={`Option ${opt.key} explanation or answer text...`}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-transparent focus:border-stone-300 focus:bg-white focus:outline-hidden bg-transparent"
              />

              {isSelected && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md hidden sm:inline">
                  Correct
                </span>
              )}

              {options.length > 2 && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove this option"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
