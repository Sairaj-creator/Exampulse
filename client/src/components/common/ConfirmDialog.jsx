import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { useEscapeKey } from "../../hooks/useEscapeKey";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  useEscapeKey(open && !busy, onClose);
  if (!open) return null;
  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="glass-strong animate-pop w-full max-w-md rounded-2xl bg-white p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-stone-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
