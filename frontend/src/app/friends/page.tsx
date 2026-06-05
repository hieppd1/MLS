"use client";

import { useTranslations } from "next-intl";
import AppShell from "../_components/AppShell";

export default function FriendsPage() {
  const t = useTranslations("friends_page");
  return (
    <AppShell activeNavId="friends">
      <main style={{ flex: 1, minWidth: 0, background: "#F9FAFB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>{t("subtitle")}</p>
        </div>

        <div className="mls-shell-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 440 }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#1565C0" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1565C0", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99, marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t("badge_coming_soon")}</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>{t("feature_title")}</h2>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "0 0 28px" }}>
              {t("feature_desc")}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {["feat_invite", "feat_study", "feat_leaderboard", "feat_share"].map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1565C0" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{t(k)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
