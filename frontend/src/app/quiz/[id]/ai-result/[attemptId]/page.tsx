"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useGetSpeakingResultQuery } from "@/lib/features/quiz/speakingApi";
import { useGetWritingResultQuery } from "@/lib/features/quiz/writingApi";
import { useFormatters } from "@/lib/hooks/useFormatters";

const MLS_NAVY = "#1565C0";
const MLS_RED  = "#e5173f";

function ScoreCard({ label, score, color }: { label: string; score: number | null | undefined; color: string }) {
  if (score == null) return null;
  return (
    <div style={{ background: "#fff", border: `2px solid ${color}20`, borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 120 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{Math.round(score)}</div>
      <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Speaking Result ────────────────────────────────────────────────────────────
function SpeakingResult({ quizId, submissionId }: { quizId: string; submissionId: string }) {
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const [pollInterval, setPollInterval] = useState(4000);
  const { data: result, isLoading, refetch } = useGetSpeakingResultQuery(
    submissionId, { skip: !submissionId || !isHydrated, pollingInterval: pollInterval }
  );

  useEffect(() => {
    if (result?.status === "Done" || result?.status === "Failed") setPollInterval(0);
  }, [result?.status]);

  return <AiResultShell
    quizId={quizId} type="speaking" result={result} isLoading={isLoading}
    refetch={refetch} isHydrated={isHydrated}
    renderScores={() => <>
      <ScoreCard label="Phát âm"  score={result?.pronunciationScore} color="#3B82F6" />
      <ScoreCard label="Ngữ điệu" score={result?.fluencyScore}       color="#8B5CF6" />
      <ScoreCard label="Chính xác" score={result?.accuracyScore}     color="#10B981" />
      <ScoreCard label="Mạch lạc"  score={result?.coherenceScore}    color="#F59E0B" />
      <ScoreCard label="Từ vựng"   score={result?.vocabularyScore}   color="#EF4444" />
      <ScoreCard label="Nội dung"  score={result?.taskAchievementScore} color="#EC4899" />
    </>}
    renderExtra={() => <>
      {result?.audioUrl && (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>🎧 Nghe lại bài của bạn</h3>
          <audio controls src={result.audioUrl} style={{ width: "100%", borderRadius: 8 }} />
        </div>
      )}
      {result?.transcriptText && (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 }}>📝 Nội dung đã nói</h3>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "16px 18px", color: "#374151", fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>
            &ldquo;{result.transcriptText}&rdquo;
          </div>
        </div>
      )}
    </>}
    retryHref={`/quiz/${quizId}/speaking`}
    titleLabel="🤖 Kết quả AI Speaking"
    gradingLabel="phát âm, ngữ điệu và độ chính xác"
  />;
}

// ── Writing Result ────────────────────────────────────────────────────────────
function WritingResult({ quizId, submissionId }: { quizId: string; submissionId: string }) {
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const [pollInterval, setPollInterval] = useState(4000);
  const { data: result, isLoading, refetch } = useGetWritingResultQuery(
    submissionId, { skip: !submissionId || !isHydrated, pollingInterval: pollInterval }
  );

  useEffect(() => {
    if (result?.status === "Done" || result?.status === "Failed") setPollInterval(0);
  }, [result?.status]);

  return <AiResultShell
    quizId={quizId} type="writing" result={result} isLoading={isLoading}
    refetch={refetch} isHydrated={isHydrated}
    renderScores={() => <>
      <ScoreCard label="Ngữ pháp"   score={result?.grammarScore}         color="#3B82F6" />
      <ScoreCard label="Từ vựng"    score={result?.vocabularyScore}      color="#8B5CF6" />
      <ScoreCard label="Mạch lạc"   score={result?.coherenceScore}       color="#10B981" />
      <ScoreCard label="Nội dung"   score={result?.taskAchievementScore} color="#F59E0B" />
    </>}
    renderExtra={() => <>
      {result?.wordCount != null && (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "20px 24px", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14, color: "#374151" }}>
          <span>📄 <strong>Số từ:</strong> {result.wordCount}</span>
          {result.taskType && <span>📋 <strong>Loại bài:</strong> {result.taskType}</span>}
          {result.essayType && <span>🏷 <strong>Kiểu luận:</strong> {result.essayType}</span>}
        </div>
      )}
    </>}
    retryHref={`/quiz/${quizId}/writing`}
    titleLabel="✍️ Kết quả AI Writing"
    gradingLabel="ngữ pháp, từ vựng, mạch lạc và nội dung"
  />;
}

// ── Shared shell ──────────────────────────────────────────────────────────────
function AiResultShell({
  quizId, type, result, isLoading, refetch, isHydrated,
  renderScores, renderExtra, retryHref, titleLabel, gradingLabel,
}: {
  quizId: string; type: string;
  result: { status: string; finalScore?: number | null; llmFeedback?: string | null; processedAt?: string | null } | undefined;
  isLoading: boolean; refetch: () => void; isHydrated: boolean;
  renderScores: () => React.ReactNode;
  renderExtra: () => React.ReactNode;
  retryHref: string; titleLabel: string; gradingLabel: string;
}) {
  const { fmtDateTime } = useFormatters();
  if (!isHydrated || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Đang tải kết quả AI...</p>
        </div>
      </div>
    );
  }

  if (!result || result.status === "Pending" || result.status === "Processing") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <div style={{ width: 64, height: 64, border: "5px solid #E5E7EB", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 10 }}>AI đang chấm điểm...</h2>
          <p style={{ color: "#6B7280", lineHeight: 1.6 }}>
            Đang phân tích {gradingLabel}. Thường mất 30–60 giây.
          </p>
          <button onClick={() => refetch()} style={{ marginTop: 24, background: "transparent", border: `2px solid ${MLS_NAVY}`, color: MLS_NAVY, borderRadius: 24, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Kiểm tra lại
          </button>
        </div>
      </div>
    );
  }

  if (result.status === "Failed") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: MLS_RED, fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Chấm điểm thất bại</h2>
          <p style={{ color: "#6B7280" }}>Không thể chấm điểm bài làm này. Vui lòng thử lại.</p>
          <Link href={retryHref} style={{ display: "inline-block", marginTop: 20, color: MLS_NAVY, textDecoration: "none", fontWeight: 600 }}>
            ← Làm lại
          </Link>
        </div>
      </div>
    );
  }

  const finalScore = result.finalScore ?? 0;
  const scoreColor = finalScore >= 80 ? "#16A34A" : finalScore >= 60 ? "#F59E0B" : MLS_RED;
  const scoreBg    = finalScore >= 80 ? "#F0FDF4" : finalScore >= 60 ? "#FFFBEB" : "#FEF2F2";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${MLS_NAVY}, #1976D2)`, padding: "28px 24px 48px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Link href={`/quiz/${quizId}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.8)", textDecoration: "none", marginBottom: 16, fontSize: 14 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>{titleLabel}</h1>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 6 }}>
            {result.processedAt ? `Chấm lúc: ${fmtDateTime(result.processedAt)}` : "Đã chấm xong"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "-24px auto 0", padding: "0 24px 56px" }}>
        {/* Final score hero */}
        <div style={{ background: scoreBg, border: `2px solid ${scoreColor}30`, borderRadius: 16, padding: "28px 24px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{Math.round(finalScore)}</div>
          <div style={{ fontSize: 18, color: "#374151", marginTop: 8 }}>Điểm tổng</div>
        </div>

        {/* Score breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Chi tiết điểm</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {renderScores()}
          </div>
        </div>

        {/* Type-specific extra content */}
        {renderExtra()}

        {/* AI Feedback */}
        {result.llmFeedback && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "24px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 }}>🤖 Nhận xét từ AI</h3>
            <div style={{ background: "#EFF6FF", borderLeft: `4px solid ${MLS_NAVY}`, borderRadius: "0 10px 10px 0", padding: "16px 18px", color: "#1E40AF", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {result.llmFeedback}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
          <Link href={retryHref} style={{ background: "transparent", border: `2px solid ${MLS_NAVY}`, color: MLS_NAVY, borderRadius: 24, padding: "12px 28px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            🔄 Làm lại
          </Link>
          <Link href={`/quiz/${quizId}`} style={{ background: MLS_NAVY, color: "#fff", borderRadius: 24, padding: "12px 28px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            ← Về trang quiz
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AiResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "speaking";

  if (type === "writing") {
    return <WritingResult quizId={id} submissionId={attemptId} />;
  }
  return <SpeakingResult quizId={id} submissionId={attemptId} />;
}
