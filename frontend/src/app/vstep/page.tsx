"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../_components/AppShell";
import {
  useGetPublishedQuizzesQuery,
  useCreateSessionMutation,
  VSTEP_BAND_LABELS,
} from "@/lib/features/quiz/vstepApi";
import { useGetQuizQuery } from "@/lib/features/quiz/quizApi";
import { useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store";

const TARGET_BANDS = ["A2", "B1", "B2", "C1"];

const PART_ROUTE: Record<string, string> = {
  VSTEPListening: "listening",
  VSTEPReading:   "reading",
  VSTEPWriting:   "writing",
  VSTEPSpeaking:  "speaking",
};

export default function VSTEPPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center h-full"><p className="text-gray-500">Đang tải...</p></div></AppShell>}>
      <VSTEPContent />
    </Suspense>
  );
}

function VSTEPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetQuizId = searchParams.get("quizId") ?? "";

  const user = useAppSelector((s: RootState) => s.auth.user);
  const { data: quizzes = [], isLoading } = useGetPublishedQuizzesQuery("VSTEPMockTest");
  const { data: presetQuiz } = useGetQuizQuery(presetQuizId, { skip: !presetQuizId });
  const [createSession, { isLoading: creating }] = useCreateSessionMutation();

  const [selectedQuizId, setSelectedQuizId] = useState(presetQuizId);
  const [targetBand, setTargetBand] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (presetQuizId && quizzes.length > 0) {
      setSelectedQuizId(presetQuizId);
    } else if (quizzes.length === 1) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [presetQuizId, quizzes]);

  const handleStart = async () => {
    if (!user) { router.push("/auth/login"); return; }
    if (!selectedQuizId) { setError("Vui lòng chọn đề thi."); return; }
    setError("");
    try {
      const session = await createSession({ targetBand: targetBand || undefined }).unwrap();
      if (presetQuizId && presetQuiz) {
        const part = PART_ROUTE[presetQuiz.quizType];
        if (part) {
          router.push(`/vstep/${session.id}/${part}?quizId=${presetQuizId}`);
          return;
        }
      }
      router.push(`/vstep/${session.id}`);
    } catch {
      setError("Không thể tạo phiên thi. Vui lòng thử lại.");
    }
  };

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏅</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
            Thi thử VSTEP
          </h1>
          <p style={{ color: "#6B7280", marginTop: 8, fontSize: 15 }}>
            Bài kiểm tra năng lực tiếng Anh 4 kỹ năng theo chuẩn VSTEP Việt Nam
          </p>
        </div>

        {/* Info cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32,
        }}>
          {[
            { part: "Nghe", icon: "🎧", q: "35 câu", time: "40 phút", color: "#3B82F6" },
            { part: "Đọc",  icon: "📖", q: "40 câu", time: "60 phút", color: "#10B981" },
            { part: "Viết", icon: "✍️",  q: "2 tasks", time: "60 phút", color: "#F59E0B" },
            { part: "Nói",  icon: "🎙",  q: "3 phần", time: "12 phút", color: "#EF4444" },
          ].map(p => (
            <div key={p.part} style={{
              background: "white", borderRadius: 12, padding: 16, textAlign: "center",
              border: `2px solid ${p.color}20`,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 24 }}>{p.icon}</div>
              <div style={{ fontWeight: 600, color: p.color, marginTop: 4, fontSize: 13 }}>{p.part}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{p.q}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{p.time}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>
          {/* Quiz selection */}
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 12 }}>Đề thi đã chọn</h3>
          {presetQuizId && presetQuiz ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 10,
              border: "2px solid #EA580C", background: "#FFF7ED",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{presetQuiz.title}</div>
                {presetQuiz.description && (
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{presetQuiz.description}</div>
                )}
                <div style={{ fontSize: 12, color: "#EA580C", marginTop: 2, fontWeight: 500 }}>
                  {PART_ROUTE[presetQuiz.quizType] ? `Phần: ${presetQuiz.quizType.replace("VSTEP", "")}` : presetQuiz.quizType}
                </div>
              </div>
              <span style={{ fontSize: 18 }}>✅</span>
            </div>
          ) : isLoading ? (
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>Đang tải đề thi...</p>
          ) : quizzes.length === 0 ? (
            <p style={{ color: "#EF4444", fontSize: 14 }}>Chưa có đề thi VSTEP. Vui lòng liên hệ admin.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {quizzes.map(q => (
                <label key={q.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${selectedQuizId === q.id ? "#EA580C" : "#E5E7EB"}`,
                  background: selectedQuizId === q.id ? "#FFF7ED" : "white",
                  transition: "all 0.15s",
                }}>
                  <input
                    type="radio" name="quiz"
                    checked={selectedQuizId === q.id}
                    onChange={() => setSelectedQuizId(q.id)}
                    style={{ accentColor: "#EA580C" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{q.title}</div>
                    {q.description && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{q.description}</div>
                    )}
                    {q.duration && (
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                        Tổng thời gian: {Math.ceil(q.duration / 60)} phút
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Target band */}
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: "24px 0 12px" }}>
            Mục tiêu band (tùy chọn)
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setTargetBand("")}
              style={{
                padding: "8px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: `2px solid ${!targetBand ? "#EA580C" : "#E5E7EB"}`,
                background: !targetBand ? "#FFF7ED" : "white",
                color: !targetBand ? "#EA580C" : "#6B7280",
              }}
            >
              Không chọn
            </button>
            {TARGET_BANDS.map(b => (
              <button
                key={b}
                onClick={() => setTargetBand(b)}
                style={{
                  padding: "8px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: `2px solid ${targetBand === b ? "#EA580C" : "#E5E7EB"}`,
                  background: targetBand === b ? "#EA580C" : "white",
                  color: targetBand === b ? "white" : "#374151",
                }}
              >
                {VSTEP_BAND_LABELS[b as keyof typeof VSTEP_BAND_LABELS]}
              </button>
            ))}
          </div>

          {/* Band explanation */}
          <div style={{
            marginTop: 16, padding: 12, background: "#F9FAFB", borderRadius: 8,
            fontSize: 13, color: "#6B7280", lineHeight: 1.6,
          }}>
            <strong style={{ color: "#374151" }}>Thang điểm:</strong>{" "}
            Mỗi kỹ năng 0–10 điểm. Band C1: TB ≥ 8.0 & thấp nhất ≥ 6.0 |
            B2: TB ≥ 6.0 & thấp nhất ≥ 4.0 | B1: TB ≥ 4.0 | A2: TB ≥ 2.5
          </div>

          {error && (
            <p style={{ color: "#EF4444", fontSize: 13, marginTop: 12 }}>{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={creating || !selectedQuizId}
            style={{
              width: "100%", marginTop: 24,
              padding: "14px", borderRadius: 12, border: "none",
              background: creating || !selectedQuizId ? "#D1D5DB" : "#EA580C",
              color: "white", fontWeight: 700, fontSize: 16,
              cursor: creating || !selectedQuizId ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {creating ? "Đang tạo phiên thi..." : "Bắt đầu thi VSTEP →"}
          </button>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
