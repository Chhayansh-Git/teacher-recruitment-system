'use client';
/**
 * Pagination — Reusable pagination controls.
 */
export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to show (max 5 visible pages)
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startItem}–{endItem} of {total}
      </div>
      <div className="pagination-buttons">
        <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          ›
        </button>
      </div>
    </div>
  );
}
