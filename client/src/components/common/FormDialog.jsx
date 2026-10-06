import { X } from "lucide-react";

export function FormDialog({ open, title, description, children, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
      >
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <h2
              id="form-dialog-title"
              className="text-lg font-bold text-stone-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
