"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useDiscoverGroupsQuery,
  useJoinGroupMutation,
  type ChatGroupDiscovery,
} from "@/lib/features/chat/chatApi";
import { showToast } from "@/components/ui/Toaster";

interface Props {
  onJoined?: (id: string) => void;
}

type Filter = "all" | "Public" | "Private";
const FILTER_KEYS: { id: Filter; key: "tab_all" | "tab_public" | "tab_private" }[] = [
  { id: "all",     key: "tab_all" },
  { id: "Public",  key: "tab_public" },
  { id: "Private", key: "tab_private" },
];

const PALETTE = ["#1565C0", "#16A34A", "#DC2626", "#7C3AED", "#0891B2", "#EA580C", "#CA8A04", "#0D9488"];
function pickColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function DiscoverGroups({ onJoined }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const t = useTranslations("groups_page");
  const { data: items = [], isLoading, refetch } = useDiscoverGroupsQuery({ page: 1, pageSize: 50 });
  const [join, { isLoading: joining }] = useJoinGroupMutation();

  const filtered = useMemo(
    () => filter === "all" ? items : items.filter((g) => g.type === filter),
    [items, filter],
  );

  const handleJoin = async (g: ChatGroupDiscovery) => {
    try {
      const res = await join(g.id).unwrap();
      onJoined?.(g.id);
      if (res.status === "Pending") showToast("Yêu cầu đang chờ duyệt.", "info");
      else if (res.status === "Approved") showToast(`Đã tham gia nhóm "${g.name}".`, "success");
      await refetch();
    } catch (err) {
      showToast(
        (err as { data?: { message?: string } })?.data?.message ?? "Không tham gia được nhóm.",
        "error",
      );
    }
  };

  return (
    <aside className="hidden lg:flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3">{t("discover_title")}</h2>
        <div className="flex gap-1.5">
          {FILTER_KEYS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filter === f.id
                  ? "bg-[#1565C0] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t(f.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isLoading && <p className="p-4 text-sm text-gray-500">Đang tải…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="p-4 text-sm text-gray-500 text-center">Không có nhóm nào.</p>
        )}
        {filtered.map((g) => {
          const joined  = g.myStatus === "Approved";
          const pending = g.myStatus === "Pending";
          return (
            <div
              key={g.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#1565C0] hover:bg-blue-50/40 transition"
            >
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: pickColor(g.id) }}
              >
                {initials(g.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                  {g.type === "Private" && (
                    <span title="Nhóm riêng tư" className="text-gray-400 text-xs">🔒</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("members_count", { count: `${g.currentMembers} / ${g.maxMembers}` })}
                </p>
              </div>
              <button
                onClick={() => handleJoin(g)}
                disabled={joining || joined || pending}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  joined
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : pending
                    ? "bg-amber-100 text-amber-700 cursor-not-allowed"
                    : "bg-[#1565C0] text-white hover:bg-[#0d4a91]"
                }`}
              >
                {joined ? "" : pending ? "" : t("join_button")}
                {joined ? "✓" : pending ? "⋯" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
