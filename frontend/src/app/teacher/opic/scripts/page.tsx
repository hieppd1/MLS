"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetTeacherScriptsQuery,
  type OPICScriptTemplateDto,
} from "@/lib/features/quiz/opicApi";

const MLS_NAVY = "#1565C0";

const TOPIC_OPTIONS = [
  { value: "",     label: "Tất cả chủ đề" },
  { value: "self-intro", label: "Tự giới thiệu" },
  { value: "home",       label: "Nhà ở" },
  { value: "hobby",      label: "Sở thích" },
  { value: "work",       label: "Công việc" },
  { value: "travel",     label: "Du lịch" },
  { value: "food",       label: "Ẩm thực" },
  { value: "health",     label: "Sức khỏe" },
  { value: "technology", label: "Công nghệ" },
];

const LANG_LABELS: Record<string, string> = { vi: "🇻🇳 VI", en: "🇺🇸 EN", ko: "🇰🇷 KO" };
const COMBO_LABELS: Record<string, string> = {
  describe:         "Miêu tả",
  routine:          "Thói quen",
  experience:       "Kinh nghiệm",
  roleplay:         "Nhập vai",
  "question-asking":"Đặt câu hỏi",
};

function ScriptCard({ s }: { s: OPICScriptTemplateDto }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 8px", background: "#EFF6FF", color: MLS_NAVY }}>
              {COMBO_LABELS[s.comboType] ?? s.comboType}
            </span>
            <span style={{ fontSize: 11, borderRadius: 4, padding: "2px 8px", background: "#F3F4F6", color: "#6B7280" }}>
              {s.topicCategory}
            </span>
            {s.targetLevel && (
              <span style={{ fontSize: 11, borderRadius: 4, padding: "2px 8px", background: "#FEF3C7", color: "#D97706", fontWeight: 600 }}>
                {s.targetLevel}
              </span>
            )}
            <span style={{ fontSize: 11, borderRadius: 4, padding: "2px 8px", background: "#F3F4F6", color: "#6B7280" }}>
              {LANG_LABELS[s.language] ?? s.language}
            </span>
            <span style={{
              fontSize: 11, borderRadius: 4, padding: "2px 8px", fontWeight: 600,
              background: s.isPublished ? "#DCFCE7" : "#F3F4F6",
              color: s.isPublished ? "#16A34A" : "#9CA3AF",
            }}>
              {s.isPublished ? "Đã xuất bản" : "Bản nháp"}
            </span>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            {s.topicCategory} — {COMBO_LABELS[s.comboType] ?? s.comboType}
          </h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
            {s.openingTemplate.slice(0, 100)}{s.openingTemplate.length > 100 ? "..." : ""}
          </p>
        </div>
        <button onClick={() => setExpanded((x) => !x)}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#9CA3AF", padding: 4 }}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Mở đầu", text: s.openingTemplate },
            { label: "Thân bài", text: s.bodyTemplate },
            { label: "Kết thúc", text: s.closingTemplate },
          ].map(({ label, text }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#374151", padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OPICScriptsPage() {
  const [topicFilter, setTopicFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");

  const { data: scripts = [], isLoading, error } = useGetTeacherScriptsQuery(
    topicFilter || langFilter ? { topic: topicFilter || undefined, language: langFilter || undefined } : undefined
  );

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Script mẫu OPIC</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {scripts.length} script template
          </p>
        </div>
        <Link href="/teacher/opic/scripts/new"
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          + Thêm script
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
          {TOPIC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
          <option value="">Tất cả ngôn ngữ</option>
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇺🇸 English</option>
          <option value="ko">🇰🇷 한국어</option>
        </select>
        {(topicFilter || langFilter) && (
          <button onClick={() => { setTopicFilter(""); setLangFilter(""); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13, color: "#6B7280" }}>
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          Đang tải...
        </div>
      )}

      {!isLoading && error && (
        <div style={{ padding: "20px 24px", borderRadius: 12, background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}>
          Không thể tải script. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !error && scripts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Chưa có script nào</div>
          <Link href="/teacher/opic/scripts/new"
            style={{ padding: "10px 24px", borderRadius: 10, background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Tạo script đầu tiên
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {scripts.map((s) => (
          <ScriptCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
