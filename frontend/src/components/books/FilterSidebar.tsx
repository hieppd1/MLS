"use client";

import { useTranslations } from "next-intl";
import type { BookCategory } from "@/lib/features/books/booksApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const BOOK_TYPES = [
  { value: "Ebook",    key: "type_ebook",    icon: "📱" },
  { value: "Physical", key: "type_physical", icon: "📖" },
  { value: "Combo",    key: "type_combo",    icon: "📚" },
];

const PRICE_RANGES = [
  { id: "all",  key: "price_all" },
  { id: "u100", key: "price_u100" },
  { id: "100",  key: "price_100" },
  { id: "200",  key: "price_200" },
  { id: "400",  key: "price_400" },
];

const RATING_OPTS = [
  { v: "",    key: "rating_all" },
  { v: "4.5", key: "rating_4_5" },
  { v: "4",   key: "rating_4" },
  { v: "3",   key: "rating_3" },
];

interface FilterState {
  categoryId: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
}

interface FilterSidebarProps {
  categories: BookCategory[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export default function FilterSidebar({ categories, filters, onChange, onReset }: FilterSidebarProps) {
  const tf = useTranslations("books_filters");
  const tfx = useTranslations("books_filters_extra");
  function set(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function toggleType(value: string) {
    set("type", filters.type === value ? "" : value);
  }

  // Map price range id → minPrice/maxPrice
  function setPriceRange(id: string) {
    if (id === "all")  { onChange({ ...filters, minPrice: "", maxPrice: "" }); return; }
    if (id === "u100") { onChange({ ...filters, minPrice: "", maxPrice: "100000" }); return; }
    if (id === "100")  { onChange({ ...filters, minPrice: "100000", maxPrice: "200000" }); return; }
    if (id === "200")  { onChange({ ...filters, minPrice: "200000", maxPrice: "400000" }); return; }
    if (id === "400")  { onChange({ ...filters, minPrice: "400000", maxPrice: "" }); return; }
  }

  function getPriceRangeId() {
    const { minPrice, maxPrice } = filters;
    if (!minPrice && !maxPrice) return "all";
    if (!minPrice && maxPrice === "100000") return "u100";
    if (minPrice === "100000" && maxPrice === "200000") return "100";
    if (minPrice === "200000" && maxPrice === "400000") return "200";
    if (minPrice === "400000" && !maxPrice) return "400";
    return "all";
  }

  const priceRangeId = getPriceRangeId();
  const totalBooks = categories.reduce((s, c) => s + (c.bookCount ?? 0), 0);

  return (
    <aside className="w-60 shrink-0">
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky shadow-md"
        style={{ top: "106px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
          style={{ backgroundColor: `${MLS_NAVY}08` }}
        >
          <span className="font-black text-sm flex items-center gap-2" style={{ color: MLS_NAVY }}>
            🏷️ {tf("filter_header")}
          </span>
          <button
            onClick={onReset}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
            style={{ backgroundColor: `${MLS_RED}15`, color: MLS_RED }}
          >
            {tfx("reset")}
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* Danh mục */}
          <SidebarSection title={tfx("category_section")}>
            <div className="space-y-0.5">
              <NavBtn
                active={!filters.categoryId}
                count={totalBooks}
                onClick={() => set("categoryId", "")}
              >
                {tfx("category_all")}
              </NavBtn>
              {categories.map((c) => (
                <NavBtn
                  key={c.id}
                  active={filters.categoryId === c.id}
                  count={c.bookCount ?? 0}
                  onClick={() => set("categoryId", filters.categoryId === c.id ? "" : c.id)}
                >
                  {c.name}
                </NavBtn>
              ))}
            </div>
          </SidebarSection>

          <div className="border-t border-gray-100" />

          {/* Loại tài liệu */}
          <SidebarSection title={tfx("type_section")}>
            <div className="space-y-1">
              {BOOK_TYPES.map((bt) => {
                const active = filters.type === bt.value;
                return (
                  <button
                    key={bt.value}
                    onClick={() => toggleType(bt.value)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-all text-left"
                    style={active
                      ? { backgroundColor: MLS_NAVY, color: "#fff" }
                      : { backgroundColor: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0" }}
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                      style={active ? { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.2)" } : { borderColor: "#cbd5e1" }}
                    >
                      {active && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="mr-0.5">{bt.icon}</span>
                    <span className="flex-1">{tfx(bt.key)}</span>
                  </button>
                );
              })}
            </div>
          </SidebarSection>

          <div className="border-t border-gray-100" />

          {/* Khoảng giá */}
          <SidebarSection title={tfx("price_section")}>
            <div className="space-y-0.5">
              {PRICE_RANGES.map((p) => (
                <RadioBtn
                  key={p.id}
                  active={priceRangeId === p.id}
                  onClick={() => setPriceRange(p.id)}
                >
                  {tfx(p.key)}
                </RadioBtn>
              ))}
            </div>
          </SidebarSection>

          <div className="border-t border-gray-100" />

          {/* Đánh giá */}
          <SidebarSection title={tfx("rating_section")}>
            <div className="space-y-0.5">
              {RATING_OPTS.map((r) => (
                <RadioBtn
                  key={r.v}
                  active={filters.minRating === r.v}
                  onClick={() => set("minRating", r.v)}
                >
                  {tfx(r.key)}
                </RadioBtn>
              ))}
            </div>
          </SidebarSection>
        </div>

        {/* Activation code promo */}
        <div className="px-3 pb-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: `${MLS_NAVY}0d`, border: `1px solid ${MLS_NAVY}20` }}
          >
            <p className="text-lg mb-1">🔑</p>
            <p className="text-[11px] font-bold mb-0.5" style={{ color: MLS_NAVY }}>{tfx("activation_title")}</p>
            <p className="text-[10px] text-gray-400 leading-snug">{tfx("activation_hint")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: MLS_NAVY }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function NavBtn({ active, count, onClick, children }: {
  active: boolean; count: number; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
      style={active
        ? { backgroundColor: MLS_NAVY, color: "#fff" }
        : { color: "#374151" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
    >
      <span>{children}</span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[22px] text-center"
        style={active
          ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
          : { backgroundColor: "#e2e8f0", color: "#64748b" }}
      >
        {count}
      </span>
    </button>
  );
}

function RadioBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] transition-all text-left"
      style={active
        ? { backgroundColor: MLS_NAVY, color: "#fff", fontWeight: 700 }
        : { color: "#4b5563" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
        style={active ? { borderColor: "#fff" } : { borderColor: "#cbd5e1" }}
      >
        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      {children}
    </button>
  );
}
