export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
