"use client";

import { useTranslations } from "next-intl";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const t = useTranslations("admin_common");
  if (totalPages <= 0) return null;

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Sliding window of page numbers
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);
  const pageNums: number[] = [];
  for (let i = left; i <= right; i++) pageNums.push(i);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-gray-500">
        {totalCount === 0 ? t("pagination_empty") : t("pagination_range", { from, to, total: totalCount })}
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>

        {/* First page + ellipsis */}
        {left > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50"
            >
              1
            </button>
            {left > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {/* Page window */}
        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg border px-3 py-1.5 transition ${
              p === page
                ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Ellipsis + last page */}
        {right < totalPages && (
          <>
            {right < totalPages - 1 && (
              <span className="px-1 text-gray-400">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
