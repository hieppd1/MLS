"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateScriptMutation } from "@/lib/features/quiz/opicApi";

const MLS_NAVY = "#1565C0";

const COMBO_TYPES = [
  { value: "describe",         label: "Miêu tả (Describe)" },
  { value: "routine",          label: "Thói quen (Routine)" },
  { value: "experience",       label: "Kinh nghiệm (Experience)" },
  { value: "roleplay",         label: "Nhập vai (Role Play)" },
  { value: "question-asking",  label: "Đặt câu hỏi (Q.Asking)" },
];

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
    if (!form.topicCategory.trim()) { setError("Vui lòng nhập chủ đề."); return; }
    if (!form.openingTemplate.trim()) { setError("Vui lòng nhập script mở đầu."); return; }
    if (!form.bodyTemplate.trim()) { setError("Vui lòng nhập script thân bài."); return; }
    if (!form.closingTemplate.trim()) { setError("Vui lòng nhập script kết thúc."); return; }
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
      setError("Tạo script thất bại. Vui lòng thử lại.");
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
          ← Quay lại danh sách
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Tạo script OPIC mới</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
          Script mẫu giúp học viên luyện tập câu trả lời theo từng combo
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Row 1: Topic + Combo type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Chủ đề *" hint="ví dụ: home, hobby, work">
              <input
                value={form.topicCategory}
                onChange={(e) => set("topicCategory", e.target.value)}
                placeholder="nhập chủ đề..."
                list="topic-suggestions"
                style={inputStyle}
              />
              <datalist id="topic-suggestions">
                {TOPIC_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </FormField>
            <FormField label="Loại combo *">
              <select value={form.comboType} onChange={(e) => set("comboType", e.target.value)} style={inputStyle}>
                {COMBO_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
          </div>

          {/* Row 2: Target level + Language */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Cấp độ mục tiêu" hint="tùy chọn">
              <select value={form.targetLevel} onChange={(e) => set("targetLevel", e.target.value)} style={inputStyle}>
                {TARGET_LEVELS.map((l) => <option key={l} value={l}>{l || "— Tất cả cấp độ —"}</option>)}
              </select>
            </FormField>
            <FormField label="Ngôn ngữ *">
              <select value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle}>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 English</option>
                <option value="ko">🇰🇷 한국어</option>
              </select>
            </FormField>
          </div>

          {/* Script templates */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Nội dung script</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="Mở đầu *" hint="câu giới thiệu, dẫn dắt vào chủ đề">
                <textarea
                  value={form.openingTemplate}
                  onChange={(e) => set("openingTemplate", e.target.value)}
                  rows={4}
                  placeholder="Ví dụ: Tôi muốn nói về... / I would like to talk about..."
                  style={textareaStyle}
                />
              </FormField>
              <FormField label="Thân bài *" hint="nội dung chính, ý tưởng mở rộng">
                <textarea
                  value={form.bodyTemplate}
                  onChange={(e) => set("bodyTemplate", e.target.value)}
                  rows={6}
                  placeholder="Nội dung chính..."
                  style={textareaStyle}
                />
              </FormField>
              <FormField label="Kết thúc *" hint="câu tổng kết, kết luận">
                <textarea
                  value={form.closingTemplate}
                  onChange={(e) => set("closingTemplate", e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Tóm lại... / In conclusion..."
                  style={textareaStyle}
                />
              </FormField>
            </div>
          </div>

          {/* Optional extras */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Tài liệu bổ sung <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(tùy chọn)</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="Từ vựng gợi ý" hint="mỗi từ một dòng">
                <textarea
                  value={form.vocabList}
                  onChange={(e) => set("vocabList", e.target.value)}
                  rows={4}
                  placeholder="hobby&#10;leisure&#10;relax&#10;..."
                  style={textareaStyle}
                />
              </FormField>
              <FormField label="Cụm từ hữu ích" hint="mỗi cụm từ một dòng">
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
            Hủy
          </Link>
          <button onClick={handleSubmit} disabled={isLoading}
            style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", cursor: isLoading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Đang tạo..." : "Tạo script"}
          </button>
        </div>
      </div>
    </div>
  );
}
