"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import BookCard from "@/components/books/BookCard";
import BookSubNav from "@/components/books/BookSubNav";
import HeroBanner from "@/components/books/HeroBanner";
import FilterSidebar from "@/components/books/FilterSidebar";
import { useGetBooksQuery, useGetBookCategoriesQuery } from "@/lib/features/books/booksApi";

const SORT_OPTION_KEYS = [
  { value: "newest",     key: "sort_newest" },
  { value: "popular",    key: "sort_popular" },
  { value: "rating",     key: "sort_rating" },
  { value: "price-asc",  key: "sort_price_asc" },
  { value: "price-desc", key: "sort_price_desc" },
] as const;

const EMPTY_FILTERS = {
  categoryId: "",
  type: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
};

export default function SachPage() {
  const t = useTranslations("sach_list");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const PAGE_SIZE = 12;

  const { data: booksData, isFetching } = useGetBooksQuery({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: filters.categoryId || undefined,
    type: filters.type || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    sort,
  });

  const { data: categories = [] } = useGetBookCategoriesQuery();

  const handleFilterChange = useCallback((f: typeof EMPTY_FILTERS) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSort("newest");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  const totalPages = booksData ? Math.ceil(booksData.total / PAGE_SIZE) : 1;

  return (
    <>
      <BookSubNav />

      {/* Hero banner — full width, outside padded container */}
      <HeroBanner />

      <main className="bg-[#f5f6fa] min-h-screen">
        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a2540] shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1565C0] text-white text-sm font-semibold rounded-xl hover:bg-[#1255A8] transition-colors"
            >
              {t("search_btn")}
            </button>
          </form>

          {/* Layout: sidebar + content */}
          <div className="flex gap-6 items-start">
            {/* Filter sidebar — desktop only */}
            <div className="hidden lg:block">
              <FilterSidebar
                categories={categories}
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Sort + count bar */}
              <div className="flex items-center gap-3 mb-5">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileSidebarOpen((v) => !v)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-3.5 py-2 rounded-xl hover:border-gray-300 transition-colors"
                >
                  🏷️ {t("filter_btn")}
                  {activeFilterCount > 0 && (
                    <span className="bg-[#1565C0] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-400">
                  {booksData ? (
                    <>
                      <span className="font-semibold text-gray-700">{booksData.total}</span> {t("items_suffix")}
                      {activeFilterCount > 0 && (
                        <button onClick={handleReset} className="ml-2 hover:underline font-semibold text-[#e5173f]">
                          {t("clear_filters")}
                        </button>
                      )}
                    </>
                  ) : t("loading")}
                </p>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:inline">{t("sort_label")}</span>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0a2540] cursor-pointer"
                  >
                    {SORT_OPTION_KEYS.map((o) => (
                      <option key={o.value} value={o.value}>{t(o.key)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile sidebar drawer */}
              {mobileSidebarOpen && (
                <div className="lg:hidden mb-4">
                  <FilterSidebar
                    categories={categories}
                    filters={filters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                  />
                </div>
              )}

              {/* Book grid */}
              {isFetching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl animate-pulse">
                      <div className="aspect-[3/4] bg-gray-200 rounded-t-xl" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : booksData && booksData.items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {booksData.items.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-4xl mb-3">📚</p>
                  <p className="text-gray-500 font-medium">{t("empty_title")}</p>
                  <button onClick={handleReset} className="mt-3 text-sm text-[#e5173f] hover:underline">{t("clear_filters")}</button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span key={`e${p}`} className="text-gray-400 text-sm px-1">…</span>
                        )}
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-[#1565C0] text-white" : "border border-gray-200 bg-white hover:bg-gray-50"}`}
                        >
                          {p}
                        </button>
                      </>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
