"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/app/_components/AppShell";
import ChatRoom from "@/components/chat/ChatRoom";
import DiscoverGroups from "@/components/chat/DiscoverGroups";
import { useListMyGroupsQuery, type ChatGroupSummary } from "@/lib/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";

/* ── Palette helpers (same as MessagesSidebar) ──────────────────────── */
const PALETTE = ["#1565C0","#7B1FA2","#2E7D32","#C62828","#E65100","#00695C","#5D4037"];
function pickColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

/* ── Mobile group list (shown on mobile when no group is selected) ─── */
function MobileGroupList({ onSelect }: { onSelect: (id: string) => void }) {
  const isLoggedIn = useAppSelector((s: RootState) => !!s.auth?.accessToken);
  const { data: myGroups = [], isLoading } = useListMyGroupsQuery(undefined, { skip: !isLoggedIn });
  const t = useTranslations("groups");
  const approved = myGroups
    .filter((g: ChatGroupSummary) => g.myStatus === "Approved")
    .map((g: ChatGroupSummary) => ({ id: g.id, name: g.name, init: initials(g.name), color: pickColor(g.id) }));

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">{t("my_groups")}</h2>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-gray-400">Đang tải…</p>
      ) : approved.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400">{t("no_groups")}</p>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {approved.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => onSelect(g.id)}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: g.color }}
                >
                  {g.init}
                </div>
                <span className="min-w-0 truncate text-sm font-medium text-gray-800">{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Page content ────────────────────────────────────────────────────── */
function NhomContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const selectedId   = searchParams.get("id");  const tp = useTranslations("groups_page");
  return (
    <AppShell activeNavId="group">
      <main className="flex flex-1 min-w-0 overflow-hidden">
        {/* Mobile: full-screen group list when none selected */}
        {!selectedId && (
          <div className="md:hidden flex flex-1 flex-col overflow-hidden">
            <MobileGroupList onSelect={(id) => router.push(`/nhom?id=${id}`)} />
          </div>
        )}

        {/* Mobile: ChatRoom full-screen when group selected */}
        {selectedId && (
          <div className="md:hidden flex flex-1 flex-col overflow-hidden">
            <ChatRoom groupId={selectedId} onBack={() => router.push("/nhom")} />
          </div>
        )}

        {/* Desktop: empty state or ChatRoom */}
        {!selectedId ? (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-500">{tp("select_group")}</p>
              <p className="mt-1 text-xs text-gray-400">{tp("discover_hint")}</p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 min-w-0 overflow-hidden">
            <ChatRoom groupId={selectedId} />
          </div>
        )}
      </main>
      <DiscoverGroups onJoined={(id) => router.push(`/nhom?id=${id}`)} />
    </AppShell>
  );
}

export default function NhomPage() {
  return (
    <Suspense fallback={null}>
      <NhomContent />
    </Suspense>
  );
}
