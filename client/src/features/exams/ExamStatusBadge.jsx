const styles = {
  draft: "bg-stone-100 text-stone-700 border-stone-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ended: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-amber-50 text-amber-800 border-amber-200",
};

export function ExamStatusBadge({ status, phase }) {
  const label = status === "published" ? phase : status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[label] || styles.draft}`}
    >
      {label === "live" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
      )}
      {label}
    </span>
  );
}
