"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import { useListMyGroupsQuery } from "@/lib/features/chat/chatApi";

/* ─── helpers ─────────────────────────────────────────────────── */
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
function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} ph`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.floor(h / 24);
  return `${d} ngày`;
}

interface Chat {
  id: string; name: string; init: string; color: string;
  lastMsg: string; time: string; unread: number; online: boolean;
  type: "message" | "group" | "qa" | "notify";
}

const TYPE_ICON: Record<string, string> = { group: "👥", qa: "❓", notify: "🔔", message: "" };

/* ─── INNER component (uses useSearchParams — must be in Suspense) ── */
function MessagesSidebarInner({ onToggle }: { onToggle?: () => void }) {
  const isLoggedIn   = useSelector((s: RootState) => !!s.auth?.accessToken);
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("id");
  const t = useTranslations("messages_sidebar");

  const { data: myGroups = [] } = useListMyGroupsQuery(undefined, { skip: !isLoggedIn });

  const [search, setSearch]           = useState("");
  const [tab, setTab]                 = useState<"all" | "unread">("all");
  const [showFilter, setShowFilter]   = useState(false);

  const chats: Chat[] = useMemo(
    () => myGroups
      .filter((g) => g.myStatus === "Approved")
      .map((g) => ({
        id: g.id, name: g.name, init: initials(g.name), color: pickColor(g.id),
        lastMsg: g.lastMessagePreview ?? t("no_message_preview"),
        time: relativeTime(g.lastMessageAt),
        unread: g.unreadCount, online: false, type: "group" as const,
      })),
    [myGroups],
  );

  const filtered = chats.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.lastMsg.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "unread" && c.unread === 0) return false;
    return true;
  });

  const totalUnread = chats.reduce((a, c) => a + c.unread, 0);

  function onChatClick(id: string) {
    router.push(`/nhom?id=${id}`);
  }

  return (
    <div style={{
      width: 290, flexShrink: 0, background: "white",
      borderRight: "1px solid #e5e7eb",
      display: "flex", flexDirection: "column", zIndex: 10,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 14px 0", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{t("title")}</h2>
          <button
            title={t("hide_tooltip")}
            onClick={onToggle}
            style={{
              width: 28, height: 28, borderRadius: "50%", border: "1px solid #E5E7EB",
              background: "#F9FAFB", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B7280",
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" strokeLinecap="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 15l-3-3 3-3" />
            </svg>
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text" placeholder={t("search_placeholder")} value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              border: "1px solid #E5E7EB", borderRadius: 20, fontSize: 12,
              outline: "none", boxSizing: "border-box", background: "#F9FAFB",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {(["all", "unread"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 500,
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: tab === k ? "2px solid #1565C0" : "2px solid transparent",
              cursor: "pointer", background: "transparent",
              color: tab === k ? "#1565C0" : "#6B7280",
            }}>{k === "all" ? t("tab_all") : t("tab_unread")}</button>
          ))}
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <button onClick={() => setShowFilter((v) => !v)} style={{
              padding: "7px 10px", fontSize: 12, fontWeight: 500,
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: showFilter ? "2px solid #1565C0" : "2px solid transparent",
              cursor: "pointer", background: "transparent",
              color: showFilter ? "#1565C0" : "#6B7280",
            }}>{t("tab_classify")} ▾</button>
            {showFilter && (
              <div style={{
                position: "absolute", right: 0, top: "100%", zIndex: 50,
                background: "white", border: "1px solid #E5E7EB", borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 130, padding: "4px 0",
              }}>
                {["Giáo viên", "Nhóm học", "Hỏi & Đáp", "Thông báo"].map((label) => (
                  <button key={label} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 14px", fontSize: 12, color: "#374151",
                    background: "none", border: "none", cursor: "pointer",
                  }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilter && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowFilter(false)} />
      )}

      {totalUnread > 0 && tab === "all" && (
        <div style={{
          margin: "8px 14px 0", padding: "6px 12px", borderRadius: 8,
          background: "#EFF6FF", border: "1px solid #DBEAFE",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "#1565C0", fontWeight: 500 }}>{totalUnread} tin chưa đọc</span>
          <button onClick={() => setTab("unread")} style={{
            fontSize: 11, color: "#1565C0", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>Xem tất cả</button>
        </div>
      )}

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>{t("empty_state")}</p>
          </div>
        ) : filtered.map((chat) => {
          const selected = pathname === "/nhom" && activeChatId === chat.id;
          return (
            <button key={chat.id} onClick={() => onChatClick(chat.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", width: "100%", textAlign: "left",
              background: selected ? "#EFF6FF" : "transparent",
              borderTop: "none", borderRight: "none",
              borderBottom: "1px solid #f3f4f6",
              borderLeft: selected ? "3px solid #1565C0" : "3px solid transparent",
              cursor: "pointer",
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: chat.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                }}>{chat.init}</div>
                {chat.online && <div style={{
                  position: "absolute", bottom: 1, right: 1, width: 11, height: 11,
                  borderRadius: "50%", background: "#22C55E", border: "2px solid #fff",
                }} />}
                {TYPE_ICON[chat.type] && <div style={{
                  position: "absolute", bottom: -2, right: -2, width: 17, height: 17,
                  borderRadius: "50%", background: "#fff", border: "1px solid #E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                }}>{TYPE_ICON[chat.type]}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{
                    fontSize: 13, fontWeight: chat.unread > 0 ? 700 : 600, color: "#111827",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140,
                  }}>{chat.name}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 }}>{chat.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 12, color: chat.unread > 0 ? "#374151" : "#9CA3AF",
                    fontWeight: chat.unread > 0 ? 500 : 400,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 172,
                  }}>{chat.lastMsg}</span>
                  {chat.unread > 0 && <div style={{
                    background: "#1565C0", color: "#fff", fontSize: 10, fontWeight: 700,
                    minWidth: 18, height: 18, borderRadius: 99,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    paddingLeft: 4, paddingRight: 4, flexShrink: 0, marginLeft: 4,
                  }}>{chat.unread}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── PUBLIC export — self-contained Suspense so all callers work ── */
export default function MessagesSidebar({ onToggle }: { onToggle?: () => void } = {}) {
  return (
    <Suspense fallback={null}>
      <MessagesSidebarInner onToggle={onToggle} />
    </Suspense>
  );
}
