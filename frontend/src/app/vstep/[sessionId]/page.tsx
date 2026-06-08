"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppShell from "../../_components/AppShell";
import {
  useGetSessionQuery,
  useGetResultQuery,
  VSTEP_PARTS,
  VSTEP_PART_LABELS,
  VSTEP_BAND_LABELS,
  type VSTEPPart,
} from "@/lib/features/quiz/vstepApi";

const PART_ICONS: Record<VSTEPPart, string> = {
  Listening: "🎧",
  Reading:   "📖",
  Writing:   "✍️",
  Speaking:  "🎙",
};

const PART_ROUTES: Record<VSTEPPart, string> = {
  Listening: "listening",
  Reading:   "reading",
  Writing:   "writing",
  Speaking:  "speaking",
};

const PART_COLORS: Record<VSTEPPart, string> = {
  Listening: "#3B82F6",
  Reading:   "#10B981",
  Writing:   "#F59E0B",
  Speaking:  "#EF4444",
};

function getPartStatus(session: { partState: Record<string, string>; isCompleted: boolean }, part: VSTEPPart) {
  if (session.isCompleted) return "done";
  const state = session.partState?.[part];
  if (!state || state === "pending") return "pending";
  if (state === "started")  return "active";
  if (state === "done")     return "done";
  return "pending";
}

export default function VSTEPSessionPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslations("vstep_player");

  const { data: session, isLoading } = useGetSessionQuery(sessionId, {
    pollingInterval: 5000,
  });
  const { data: result } = useGetResultQuery(sessionId, { skip: !session?.isCompleted });

  const partInfo: Record<VSTEPPart, { q: string; time: string; color: string; label: string }> = {
    Listening: { q: t("part_listening_q"), time: t("part_listening_time"), color: PART_COLORS.Listening, label: t("skill_listening") },
    Reading:   { q: t("part_reading_q"),   time: t("part_reading_time"),   color: PART_COLORS.Reading,   label: t("skill_reading") },
    Writing:   { q: t("part_writing_q"),   time: t("part_writing_time"),   color: PART_COLORS.Writing,   label: t("skill_writing") },
    Speaking:  { q: t("part_speaking_q"),  time: t("part_speaking_time"),  color: PART_COLORS.Speaking,  label: t("skill_speaking") },
  };

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>{t("session_not_found")}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.push("/vstep")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, padding: 0, marginBottom: 12 }}
          >
            {t("back")}
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            {t("session_title")}
          </h1>
          <p style={{ color: "#6B7280", fontSize: 13, marginTop: 6 }}>
            {t("instructions")}
          </p>
          {session.targetBand && (
            <p style={{ color: "#EA580C", fontSize: 13, marginTop: 4 }}>
              {t("target_band", { band: session.targetBand })}
            </p>
          )}
        </div>

        {/* Parts grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {VSTEP_PARTS.map((part, idx) => {
            const status = getPartStatus(session, part);
            const info = partInfo[part];
            const scoreKey = `${part.toLowerCase()}Score` as keyof typeof session;
            const score = session[scoreKey] as number | null;
            const isNext = !session.isCompleted && session.currentPart === part;

            return (
              <div
                key={part}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", borderRadius: 14, background: "white",
                  border: `2px solid ${isNext ? info.color : status === "done" ? "#D1FAE5" : "#E5E7EB"}`,
                  boxShadow: isNext ? `0 0 0 4px ${info.color}18` : "0 1px 4px rgba(0,0,0,.06)",
                  opacity: status === "pending" && !isNext ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: status === "done" ? "#D1FAE5" : `${info.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {status === "done" ? "✅" : PART_ICONS[part]}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                      {t("part_n", { n: idx + 1 })}{info.label}
                    </span>
                    {isNext && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: info.color, color: "white",
                      }}>{t("badge_next")}</span>
                    )}
                    {status === "done" && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: "#D1FAE5", color: "#065F46",
                      }}>{t("badge_completed")}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                    {info.q} · {info.time}
                  </div>
                  {score !== null && (
                    <div style={{ fontSize: 13, color: info.color, fontWeight: 600, marginTop: 3 }}>
                      {t("score_label")}{score.toFixed(1)}{t("score_suffix")}
                    </div>
                  )}
                </div>

                {isNext && (
                  <button
                    onClick={() => router.push(`/vstep/${sessionId}/${PART_ROUTES[part]}`)}
                    style={{
                      padding: "9px 22px", borderRadius: 99, border: "none",
                      background: info.color, color: "white",
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {t("enter_test")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Result card when completed */}
        {session.isCompleted && result && (
          <div style={{
            background: "#FFF7ED", borderRadius: 16, padding: 24,
            border: "2px solid #EA580C", textAlign: "center",
          }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#EA580C", margin: "8px 0 4px" }}>
              Band {result.assignedBand} — {VSTEP_BAND_LABELS[result.assignedBand]}
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 16px" }}>
              {t("avg_score")}{result.overallScore.toFixed(1)}{t("score_suffix")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
              {(["Listening", "Reading", "Writing", "Speaking"] as const).map((part, i) => {
                const keys = ["listeningScore", "readingScore", "writingScore", "speakingScore"] as const;
                const s = result[keys[i]];
                return (
                  <div key={part} style={{ background: "white", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#EA580C" }}>{s.toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{partInfo[part].label}</div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push(`/vstep/${sessionId}/result`)}
              style={{
                padding: "10px 28px", borderRadius: 99, border: "none",
                background: "#EA580C", color: "white",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              {t("view_detailed_result")}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
