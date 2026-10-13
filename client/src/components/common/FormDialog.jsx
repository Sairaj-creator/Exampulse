import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

export function FormDialog({ open, title, description, children, onClose }) {
  useEscapeKey(open, onClose);
  if (!open) return null;
  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="glass-strong animate-pop my-8 w-full max-w-lg rounded-2xl bg-white"
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
            className="rounded-lg p-2 text-stone-400 transition-transform duration-300 hover:rotate-90 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
