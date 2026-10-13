export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-stone-200 bg-stone-100 text-stone-400">
          <Icon size={26} />
        </span>
      )}
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">
          {description}
        </p>
      )}
    </div>
  );
}
