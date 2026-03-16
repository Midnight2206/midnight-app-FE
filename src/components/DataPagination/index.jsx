import { Button } from "@/components/ui/button";
import { getVisiblePages } from "@/utils/pagination";

export default function DataPagination({
  page,
  totalPages,
  total,
  isFetching = false,
  onPageChange,
  label = "bản ghi",
  compact = false,
}) {
  const pages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Tổng: {total} {label} {totalPages > 0 ? `• Trang ${page}/${totalPages}` : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={isFetching || page <= 1}
        >
          Trước
        </Button>

        {!compact &&
          pages.map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              size="sm"
              variant={pageNumber === page ? "default" : "outline"}
              onClick={() => onPageChange(pageNumber)}
              disabled={isFetching}
            >
              {pageNumber}
            </Button>
          ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
          disabled={isFetching || totalPages === 0 || page >= totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
