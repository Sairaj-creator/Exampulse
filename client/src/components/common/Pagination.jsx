import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1)
    return (
      <div className="px-5 py-3 text-xs text-stone-500">
        {total} record{total === 1 ? "" : "s"}
      </div>
    );
  return (
    <div className="flex items-center justify-between border-t border-stone-200 px-5 py-3">
      <span className="text-xs text-stone-500">
        Page {page} of {totalPages} · {total} records
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
