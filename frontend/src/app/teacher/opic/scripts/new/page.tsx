"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCreateScriptMutation } from "@/lib/features/quiz/opicApi";

const MLS_NAVY = "#1565C0";

const COMBO_TYPE_KEYS = [
  { value: "describe",         key: "describe" },
  { value: "routine",          key: "routine" },
  { value: "experience",       key: "experience" },
  { value: "roleplay",         key: "roleplay" },
  { value: "question-asking",  key: "qasking" },
] as const;

const TARGET_LEVELS = ["", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

const TOPIC_SUGGESTIONS = [
  "self-intro", "home", "hobby", "work", "travel",
  "food", "health", "technology", "environment", "education",
];

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "#9CA3AF", marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewScriptPage() {
  const t = useTranslations("teacher_opic_scripts_new");
  const tCombo = useTranslations("opic_combo_labels");
  const tLang = useTranslations("language_labels");
  const router = useRouter();
  const [createScript, { isLoading }] = useCreateScriptMutation();

  const [form, setForm] = useState({
    topicCategory: "",
    comboType: "describe",
    targetLevel: "",
    language: "vi",
    openingTemplate: "",
    bodyTemplate: "",
    closingTemplate: "",
    vocabList: "",
    usefulPhrases: "",
  });
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.topicCategory.trim()) { setError(t("err_topic")); return; }
    if (!form.openingTemplate.trim()) { setError(t("err_opening")); return; }
    if (!form.bodyTemplate.trim()) { setError(t("err_body")); return; }
    if (!form.closingTemplate.trim()) { setError(t("err_closing")); return; }
    setError(null);
    try {
      await createScript({
        topicCategory:   form.topicCategory.trim(),
        comboType:       form.comboType,
        targetLevel:     form.targetLevel || undefined,
        language:        form.language,
        openingTemplate: form.openingTemplate.trim(),
        bodyTemplate:    form.bodyTemplate.trim(),
        closingTemplate: form.closingTemplate.trim(),
        vocabList:       form.vocabList.trim() || undefined,
        usefulPhrases:   form.usefulPhrases.trim() || undefined,
      }).unwrap();
      router.push("/teacher/opic/scripts");
    } catch {
      setError(t("toast_fail"));
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB",
    fontSize: 14, boxSizing: "border-box" as const,
  };

  const textareaStyle = {
    ...inputStyle,
    resize: "vertical" as const,
    lineHeight: 1.6,
    fontFamily: "inherit",
  };

  return (
    <div style={{ padding: 32, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/teacher/opic/scripts" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 8, width: "fit-content" }}>
          {t("back")}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
          {t("subtitle")}
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Row 1: Topic + Combo type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label={t("field_topic")} hint={t("topic_hint")}>
              <input
                value={form.topicCategory}
                onChange={(e) => set("topicCategory", e.target.value)}
                placeholder={t("topic_ph")}
                list="topic-suggestions"
                style={inputStyle}
              />
              <datalist id="topic-suggestions">
                {TOPIC_SUGGESTIONS.map((tp) => <option key={tp} value={tp} />)}
              </datalist>
            </FormField>
            <FormField label={t("field_combo")}>
              <select value={form.comboType} onChange={(e) => set("comboType", e.target.value)} style={inputStyle}>
                {COMBO_TYPE_KEYS.map((c) => <option key={c.value} value={c.value}>{tCombo(c.key)}</option>)}
              </select>
            </FormField>
          </div>

          {/* Row 2: Target level + Language */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label={t("field_level")} hint={t("optional")}>
              <select value={form.targetLevel} onChange={(e) => set("targetLevel", e.target.value)} style={inputStyle}>
                {TARGET_LEVELS.map((l) => <option key={l} value={l}>{l || t("level_all")}</option>)}
              </select>
            </FormField>
            <FormField label={t("field_language")}>
              <select value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle}>
                <option value="vi">{tLang("vi")}</option>
                <option value="en">{tLang("en")}</option>
                <option value="ko">{tLang("ko")}</option>
              </select>
            </FormField>
          </div>

          {/* Script templates */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>{t("section_content")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label={t("field_opening")} hint={t("opening_hint")}>
                <textarea
                  value={form.openingTemplate}
                  onChange={(e) => set("openingTemplate", e.target.value)}
                  rows={4}
                  placeholder={t("opening_ph")}
                  style={textareaStyle}
                />
              </FormField>
              <FormField label={t("field_body")} hint={t("body_hint")}>
                <textarea
                  value={form.bodyTemplate}
                  onChange={(e) => set("bodyTemplate", e.target.value)}
                  rows={6}
                  placeholder={t("body_ph")}
                  style={textareaStyle}
                />
              </FormField>
              <FormField label={t("field_closing")} hint={t("closing_hint")}>
                <textarea
                  value={form.closingTemplate}
                  onChange={(e) => set("closingTemplate", e.target.value)}
                  rows={3}
                  placeholder={t("closing_ph")}
                  style={textareaStyle}
                />
              </FormField>
            </div>
          </div>

          {/* Optional extras */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>{t("section_extra")} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>{t("optional")}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label={t("field_vocab")} hint={t("vocab_hint")}>
                <textarea
                  value={form.vocabList}
                  onChange={(e) => set("vocabList", e.target.value)}
                  rows={4}
                  placeholder="hobby&#10;leisure&#10;relax&#10;..."
                  style={textareaStyle}
                />
              </FormField>
              <FormField label={t("field_phrases")} hint={t("phrases_hint")}>
                <textarea
                  value={form.usefulPhrases}
                  onChange={(e) => set("usefulPhrases", e.target.value)}
                  rows={4}
                  placeholder="In my free time...&#10;I tend to...&#10;..."
                  style={textareaStyle}
                />
              </FormField>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <Link href="/teacher/opic/scripts"
            style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            {t("btn_cancel")}
          </Link>
          <button onClick={handleSubmit} disabled={isLoading}
            style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", cursor: isLoading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? t("btn_creating") : t("btn_create")}
          </button>
        </div>
      </div>
    </div>
  );
}
