"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

const MLS_NAVY = "#1565C0";
const MLS_RED  = "#e5173f";

interface EssayEditorProps {
  minWords: number;
  maxWords?: number;
  taskType?: string | null;    // null | "letter" | "essay_vstep"
  essayType?: string | null;   // "argumentative" | "discussion" | ...
  promptText?: string | null;
  bulletPoints?: string[];
  initialText?: string;
  disabled?: boolean;
  onSubmit: (essayText: string, wordCount: number) => void;
  submitting?: boolean;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function getTaskLabel(taskType?: string | null): string {
  switch (taskType) {
    case "letter":      return "VSTEP Task 1 — Viết thư";
    case "essay_vstep": return "VSTEP Task 2 — Viết luận";
    default:            return "Viết bài";
  }
}

function getEssayTypeLabel(essayType?: string | null): string {
  switch (essayType) {
    case "argumentative":    return "Argumentative";
    case "discussion":       return "Discussion";
    case "problem_solution": return "Problem-Solution";
    case "cause_effect":     return "Cause-Effect";
    default:                 return essayType ?? "";
  }
}

export default function EssayEditor({
  minWords,
  maxWords,
  taskType,
  essayType,
  promptText,
  bulletPoints,
  initialText = "",
  disabled = false,
  onSubmit,
  submitting = false,
}: EssayEditorProps) {
  const DRAFT_KEY = `essay_draft_${taskType ?? "std"}_${minWords}`;
  const [text, setText] = useState<string>(() => {
    if (initialText) return initialText;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(DRAFT_KEY) ?? "";
    }
    return "";
  });

  const wordCount  = countWords(text);
  const meetsMin   = wordCount >= minWords;
  const exceedsMax = maxWords != null && wordCount > maxWords;

  // Auto-save draft
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(DRAFT_KEY, text);
      }
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [text, DRAFT_KEY]);

  const handleSubmit = useCallback(() => {
    if (!meetsMin || exceedsMax || submitting || disabled) return;
    if (typeof window !== "undefined") sessionStorage.removeItem(DRAFT_KEY);
    onSubmit(text.trim(), wordCount);
  }, [text, wordCount, meetsMin, exceedsMax, submitting, disabled, onSubmit, DRAFT_KEY]);

  const badgeColor = exceedsMax ? MLS_RED : meetsMin ? "#2e7d32" : MLS_RED;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860, margin: "0 auto" }}>
      {/* Task label + essay type tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: MLS_NAVY }}>
          {getTaskLabel(taskType)}
        </span>
        {essayType && (
          <span style={{
            background: MLS_NAVY, color: "#fff",
            borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600
          }}>
            {getEssayTypeLabel(essayType)}
          </span>
        )}
      </div>

      {/* Prompt */}
      {promptText && (
        <div style={{
          background: "#f0f4ff", border: `1px solid ${MLS_NAVY}33`,
          borderRadius: 8, padding: "12px 16px",
          fontSize: 14, lineHeight: 1.6, color: "#1a1a2e"
        }}>
          <strong style={{ color: MLS_NAVY }}>Đề bài:</strong> {promptText}
        </div>
      )}

      {/* VSTEP Letter format guide */}
      {taskType === "letter" && (
        <div style={{
          background: "#fff8e1", border: "1px solid #f9a825",
          borderRadius: 8, padding: "10px 14px", fontSize: 13
        }}>
          <strong style={{ color: "#e65100" }}>Format thư VSTEP:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Lời chào (Dear ...)</li>
            <li>Thân thư: nêu đủ các ý yêu cầu</li>
            <li>Lời kết + chữ ký (Yours sincerely / Best regards, ...)</li>
          </ul>
        </div>
      )}

      {/* Bullet points for VSTEP Task 1 */}
      {bulletPoints && bulletPoints.length > 0 && (
        <div style={{
          background: "#e8f5e9", border: "1px solid #81c784",
          borderRadius: 8, padding: "10px 14px", fontSize: 13
        }}>
          <strong style={{ color: "#2e7d32" }}>Các ý cần đề cập:</strong>
          <ol style={{ margin: "6px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
            {bulletPoints.map((pt, i) => <li key={i}>{pt}</li>)}
          </ol>
        </div>
      )}

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || submitting}
          rows={14}
          placeholder="Bắt đầu viết bài tại đây..."
          spellCheck={true}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "14px 16px", paddingBottom: 36,
            borderRadius: 8,
            border: `2px solid ${exceedsMax ? MLS_RED : meetsMin ? "#66bb6a" : "#ccc"}`,
            fontSize: 15, lineHeight: 1.7,
            resize: "vertical", minHeight: 200,
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        {/* Word count badge in bottom-right of textarea */}
        <div style={{
          position: "absolute", bottom: 8, right: 12,
          background: badgeColor, color: "#fff",
          borderRadius: 12, padding: "2px 10px",
          fontSize: 12, fontWeight: 700, pointerEvents: "none"
        }}>
          {wordCount} / min {minWords}{maxWords != null ? ` / max ${maxWords}` : ""} từ
        </div>
      </div>

      {/* Hint row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#666" }}>
        <span>
          {exceedsMax
            ? `⚠️ Bài viết vượt quá ${maxWords} từ — vui lòng rút ngắn.`
            : !meetsMin
            ? `Cần viết thêm ${minWords - wordCount} từ nữa để đủ yêu cầu.`
            : "✅ Bài viết đạt số từ tối thiểu."}
        </span>
        <span style={{ color: "#999" }}>Nháp tự động lưu</span>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!meetsMin || exceedsMax || submitting || disabled}
        style={{
          alignSelf: "flex-end",
          background: (!meetsMin || exceedsMax || submitting || disabled) ? "#ccc" : MLS_NAVY,
          color: "#fff",
          border: "none", borderRadius: 8,
          padding: "10px 28px", fontSize: 15, fontWeight: 700,
          cursor: (!meetsMin || exceedsMax || submitting || disabled) ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {submitting ? "Đang nộp bài..." : "Nộp bài"}
      </button>
    </div>
  );
}
