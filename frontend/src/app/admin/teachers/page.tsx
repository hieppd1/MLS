"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { safeImgUrl } from "@/lib/utils";
import { formatNumber } from "@/lib/i18nFormat";
import {
  useGetAdminTeachersQuery,
  useSetTeacherVerifiedMutation,
  type AdminTeacherDto,
} from "@/lib/features/admin/adminApi";

export default function AdminTeachersPage() {
  const t = useTranslations("admin_teachers");
  const [page] = useState(1);
  const { data: teachers = [], isLoading } = useGetAdminTeachersQuery({ page, pageSize: 50 });
  const [setVerified] = useSetTeacherVerifiedMutation();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleToggleVerified(teacher: AdminTeacherDto) {
    try {
      await setVerified({ userId: teacher.userId, isVerified: !teacher.isVerified }).unwrap();
      setMsg({ type: "success", text: !teacher.isVerified ? t("toast_verify_ok", { name: teacher.fullName }) : t("toast_unverify_ok", { name: teacher.fullName }) });
    } catch {
      setMsg({ type: "error", text: t("toast_error") });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{t("title")}</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {t("subtitle", { n: teachers.length })}
          </p>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 8,
          background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${msg.type === "success" ? "#BBF7D0" : "#FECACA"}`,
          color: msg.type === "success" ? "#16A34A" : "#DC2626",
          fontSize: 13,
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 200px 100px 100px 120px",
          padding: "12px 20px", borderBottom: "1px solid #F3F4F6",
          fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <div>{t("col_teacher")}</div>
          <div>Slug / Profile</div>
          <div>Followers</div>
          <div>{t("col_courses")}</div>
          <div style={{ textAlign: "right" }}>{t("col_actions")}</div>
        </div>

        {isLoading && (
          <div style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</div>
        )}

        {teachers.map((teacher) => (
          <div key={teacher.userId} style={{
            display: "grid", gridTemplateColumns: "1fr 200px 100px 100px 120px",
            padding: "14px 20px", borderBottom: "1px solid #F9FAFB",
            alignItems: "center",
          }}>
            {/* Teacher info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {teacher.avatarUrl ? (
                <img src={safeImgUrl(teacher.avatarUrl)!} alt={teacher.fullName}
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                }}>
                  {teacher.fullName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{teacher.fullName}</span>
                  {teacher.isVerified && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#16A34A", color: "#fff", fontSize: 9, fontWeight: 800,
                    }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{teacher.email}</div>
              </div>
            </div>

            {/* Slug */}
            <div style={{ fontSize: 12 }}>
              {teacher.hasProfile ? (
                <span style={{ color: "#374151", fontFamily: "monospace" }}>{teacher.slug}</span>
              ) : (
                <span style={{ color: "#EF4444", fontSize: 11 }}>{t("no_profile")}</span>
              )}
            </div>

            {/* Followers */}
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
              {formatNumber(teacher.followerCount)}
            </div>

            {/* Courses */}
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
              {teacher.courseCount}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => handleToggleVerified(teacher)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", border: "1px solid",
                  background: teacher.isVerified ? "#F0FDF4" : "white",
                  borderColor: teacher.isVerified ? "#BBF7D0" : "#E5E7EB",
                  color: teacher.isVerified ? "#16A34A" : "#6B7280",
                }}
                title={teacher.isVerified ? t("btn_unverify") : t("btn_verify")}
              >
                {teacher.isVerified ? t("btn_verified") : t("btn_verify")}
              </button>
              <Link href={`/admin/teachers/${teacher.userId}`}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  textDecoration: "none", border: "1px solid #E5E7EB",
                  background: "white", color: "#6366F1",
                }}>
                {t("btn_edit")}
              </Link>
            </div>
          </div>
        ))}

        {!isLoading && teachers.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
