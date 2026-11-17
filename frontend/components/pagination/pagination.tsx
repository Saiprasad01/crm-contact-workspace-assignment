interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav aria-label="Contacts pagination" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrev}
      >
        Previous
      </button>
      <span className="text-body-s" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
      >
        Next
      </button>
    </nav>
  );
}
