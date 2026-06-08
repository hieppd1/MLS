"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useGetTeacherScriptsQuery,
  type OPICScriptTemplateDto,
} from "@/lib/features/quiz/opicApi";

const MLS_NAVY = "#1565C0";

const TOPIC_OPTION_KEYS = [
  { value: "",           key: "all" },
  { value: "self-intro", key: "intro" },
  { value: "home",       key: "housing" },
  { value: "hobby",      key: "hobby" },
  { value: "work",       key: "work" },
  { value: "travel",     key: "travel" },
  { value: "food",       key: "food" },
  { value: "health",     key: "health" },
  { value: "technology", key: "technology" },
] as const;

const LANG_LABELS: Record<string, string> = { vi: "🇦🇬 VI", en: "🇺🇸 EN", ko: "🇰🇷 KO" };
const COMBO_KEY_MAP: Record<string, string> = {
  describe:          "describe_short",
  routine:           "routine_short",
  experience:        "experience_short",
  roleplay:          "roleplay_short",
  "question-asking": "qasking_short",
};

function ScriptCard({ s }: { s: OPICScriptTemplateDto }) {
  const t = useTranslations("teacher_opic_scripts");
  const tCombo = useTranslations("opic_combo_labels");
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 8px", background: "#EFF6FF", color: MLS_NAVY }}>
              {tCombo(COMBO_KEY_MAP[s.comboType] ?? "describe_short")}
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
              {s.isPublished ? t("status_published") : t("status_draft")}
            </span>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            {s.topicCategory} — {tCombo(COMBO_KEY_MAP[s.comboType] ?? "describe_short")}
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
            { label: t("section_opening"), text: s.openingTemplate },
            { label: t("section_body"), text: s.bodyTemplate },
            { label: t("section_closing"), text: s.closingTemplate },
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
  const t = useTranslations("teacher_opic_scripts");
  const tTopic = useTranslations("opic_topic_labels");
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {scripts.length} script template
          </p>
        </div>
        <Link href="/teacher/opic/scripts/new"
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          {t("add")}
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
          {TOPIC_OPTION_KEYS.map((o) => <option key={o.value} value={o.value}>{tTopic(o.key)}</option>)}
        </select>
        <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
          <option value="">{t("all_langs")}</option>
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇺🇸 English</option>
          <option value="ko">🇰🇷 한국어</option>
        </select>
        {(topicFilter || langFilter) && (
          <button onClick={() => { setTopicFilter(""); setLangFilter(""); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13, color: "#6B7280" }}>
            {t("clear_filter")}
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          {t("loading")}
        </div>
      )}

      {!isLoading && error && (
        <div style={{ padding: "20px 24px", borderRadius: 12, background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}>
          {t("load_error")}
        </div>
      )}

      {!isLoading && !error && scripts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 12 }}>{t("empty")}</div>
          <Link href="/teacher/opic/scripts/new"
            style={{ padding: "10px 24px", borderRadius: 10, background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            {t("empty_cta")}
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
