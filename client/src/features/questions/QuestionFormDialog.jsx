import React, { useState, useEffect } from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import { OptionEditor } from "./OptionEditor";
import { Button } from "../../components/ui/button";
import { FormDialog } from "../../components/common/FormDialog";

const DEFAULT_OPTIONS_SINGLE = [
  { key: "A", text: "" },
  { key: "B", text: "" },
  { key: "C", text: "" },
  { key: "D", text: "" },
];

const DEFAULT_OPTIONS_TF = [
  { key: "A", text: "True" },
  { key: "B", text: "False" },
];

export function QuestionFormDialog({
  open,
  question,
  subjects = [],
  topics = [],
  onSubmit,
  onClose,
  busy = false,
}) {
  const isEditing = Boolean(question);

  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("single");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(DEFAULT_OPTIONS_SINGLE);
  const [correctKeys, setCorrectKeys] = useState(["A"]);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [defaultMarks, setDefaultMarks] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (question) {
      setSubjectId(question.subjectId?._id || question.subjectId || "");
      setTopic(question.topic || "");
      setType(question.type || "single");
      setText(question.text || "");
      setOptions(question.options || DEFAULT_OPTIONS_SINGLE);
      setCorrectKeys(question.correctKeys || ["A"]);
      setExplanation(question.explanation || "");
      setDifficulty(question.difficulty || "medium");
      setDefaultMarks(question.defaultMarks ?? 1);
    } else {
      setSubjectId(subjects[0]?._id || "");
      setTopic("");
      setType("single");
      setText("");
      setOptions(DEFAULT_OPTIONS_SINGLE);
      setCorrectKeys(["A"]);
      setExplanation("");
      setDifficulty("medium");
      setDefaultMarks(1);
    }
    setError(null);
  }, [question, subjects, open]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === "truefalse") {
      setOptions(DEFAULT_OPTIONS_TF);
      setCorrectKeys(["A"]);
    } else if (type === "truefalse") {
      setOptions(DEFAULT_OPTIONS_SINGLE);
      setCorrectKeys(["A"]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation checks before submit
    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }
    if (!topic.trim()) {
      setError("Please provide a topic name.");
      return;
    }
    if (text.trim().length < 5) {
      setError("Question stem must be at least 5 characters long.");
      return;
    }
    for (const opt of options) {
      if (!opt.text.trim()) {
        setError(`Option ${opt.key} text cannot be empty.`);
        return;
      }
    }
    if (correctKeys.length === 0) {
      setError("Please select at least one correct answer.");
      return;
    }

    try {
      await onSubmit({
        subjectId,
        topic: topic.trim(),
        type,
        text: text.trim(),
        options,
        correctKeys,
        explanation: explanation.trim(),
        difficulty,
        defaultMarks: Number(defaultMarks) || 1,
      });
    } catch (err) {
      setError(err.message || "Failed to save question");
    }
  };

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Edit Question" : "Create New Question"}
      description={
        isEditing
          ? "Update question stem, options, difficulty, or marking."
          : "Add a high-quality question with options and evaluation keys."
      }
      onClose={onClose}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Subject & Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="question-subject-select"
              className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
            >
              Subject
            </label>
            <select
              id="question-subject-select"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
            >
              <option value="">Select Subject...</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="question-topic-input"
              className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
            >
              Topic / Chapter
            </label>
            <input
              id="question-topic-input"
              type="text"
              required
              list="topic-suggestions"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Indexing, CPU Scheduling"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
            />
            <datalist id="topic-suggestions">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Type & Difficulty & Marks */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="question-type-select"
              className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
            >
              Question Type
            </label>
            <select
              id="question-type-select"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white font-medium"
            >
              <option value="single">Single Choice</option>
              <option value="multiple">Multiple Choice</option>
              <option value="truefalse">True / False</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="question-difficulty-select"
              className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
            >
              Difficulty
            </label>
            <select
              id="question-difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="question-marks-input"
              className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
            >
              Default Marks
            </label>
            <input
              id="question-marks-input"
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              required
              value={defaultMarks}
              onChange={(e) => setDefaultMarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
            />
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label
            htmlFor="question-text-input"
            className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
          >
            Question Stem / Statement
          </label>
          <textarea
            id="question-text-input"
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the complete question text..."
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white leading-relaxed resize-y"
          />
        </div>

        {/* Dynamic Option Editor */}
        <div className="pt-2 border-t border-stone-100">
          <OptionEditor
            type={type}
            options={options}
            correctKeys={correctKeys}
            onChangeOptions={setOptions}
            onChangeCorrectKeys={setCorrectKeys}
            disabled={busy}
          />
        </div>

        {/* Explanation */}
        <div className="pt-2 border-t border-stone-100">
          <label
            htmlFor="question-explanation-input"
            className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1.5"
          >
            <HelpCircle size={14} className="text-stone-400" /> Solution Explanation (Optional)
          </label>
          <textarea
            id="question-explanation-input"
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Provide context or explanation shown during candidate answer review..."
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white text-stone-700 resize-y"
          />
        </div>

        <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : isEditing ? "Save Changes" : "Create Question"}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
}
