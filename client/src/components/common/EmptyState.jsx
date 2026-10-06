export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && <Icon className="mb-4 text-stone-300" size={34} />}
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">
          {description}
        </p>
      )}
    </div>
  );
}
