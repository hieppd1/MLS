"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { safeImgUrl } from "@/lib/utils";
import {
  useGetAdminTeacherDetailQuery,
  useUpdateTeacherProfileMutation,
  useSetTeacherVerifiedMutation,
} from "@/lib/features/admin/adminApi";

export default function AdminTeacherEditPage() {
  const t = useTranslations("admin_teacher_detail");
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: teacher, isLoading } = useGetAdminTeacherDetailQuery(userId);
  const [updateProfile, { isLoading: isSaving }] = useUpdateTeacherProfileMutation();
  const [setVerified] = useSetTeacherVerifiedMutation();

  const [form, setForm] = useState({
    displayName: "",
    slug: "",
    avatarUrl: "",
    coverUrl: "",
    headline: "",
    bio: "",
    experienceYears: 0,
    specialization: "",
    facebookUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    websiteUrl: "",
    isPublic: true,
  });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (teacher) {
      setForm({
        displayName: teacher.fullName,
        slug: teacher.slug ?? "",
        avatarUrl: teacher.avatarUrl ?? "",
        coverUrl: "",
        headline: teacher.headline ?? "",
        bio: teacher.bio ?? "",
        experienceYears: teacher.experienceYears ?? 0,
        specialization: teacher.specialization ?? "",
        facebookUrl: teacher.facebookUrl ?? "",
        youtubeUrl: teacher.youtubeUrl ?? "",
        tiktokUrl: teacher.tiktokUrl ?? "",
        websiteUrl: teacher.websiteUrl ?? "",
        isPublic: teacher.isPublic ?? true,
      });
    }
  }, [teacher]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({
        userId,
        displayName: form.displayName,
        slug: form.slug,
        avatarUrl: form.avatarUrl || undefined,
        coverUrl: form.coverUrl || undefined,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        experienceYears: form.experienceYears,
        specialization: form.specialization || undefined,
        facebookUrl: form.facebookUrl || undefined,
        youtubeUrl: form.youtubeUrl || undefined,
        tiktokUrl: form.tiktokUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        isPublic: form.isPublic,
      }).unwrap();
      setMsg({ type: "success", text: t("toast_save_ok") });
    } catch {
      setMsg({ type: "error", text: t("toast_save_fail") });
    }
  }

  async function handleToggleVerified() {
    if (!teacher) return;
    try {
      await setVerified({ userId, isVerified: !teacher.isVerified }).unwrap();
      setMsg({ type: "success", text: !teacher.isVerified ? t("toast_verify_ok") : t("toast_unverify_ok") });
    } catch {
      setMsg({ type: "error", text: t("toast_verify_fail") });
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (isLoading) return <div style={{ padding: 32, color: "#6B7280" }}>{t("loading")}</div>;
  if (!teacher) return <div style={{ padding: 32, color: "#EF4444" }}>{t("not_found")}</div>;

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 760 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#6B7280" }}>
        <Link href="/admin/teachers" style={{ color: "#6366F1", textDecoration: "none" }}>{t("breadcrumb")}</Link>
        <span>/</span>
        <span>{teacher.fullName}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {teacher.fullName}
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{teacher.email}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Verified toggle */}
          <button onClick={handleToggleVerified} style={{
            padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            cursor: "pointer", border: "1px solid",
            background: teacher.isVerified ? "#F0FDF4" : "white",
            borderColor: teacher.isVerified ? "#BBF7D0" : "#E5E7EB",
            color: teacher.isVerified ? "#16A34A" : "#6B7280",
          }}>
            {teacher.isVerified ? t("btn_verified") : t("btn_verify")}
          </button>
          {teacher.slug && (
            <Link href={`/giao-vien/${teacher.slug}`} target="_blank"
              style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                textDecoration: "none", border: "1px solid #E5E7EB", color: "#6366F1" }}>
              {t("btn_public_page")}
            </Link>
          )}
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div style={{
          marginBottom: 20, padding: "10px 16px", borderRadius: 8,
          background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${msg.type === "success" ? "#BBF7D0" : "#FECACA"}`,
          color: msg.type === "success" ? "#16A34A" : "#DC2626",
          fontSize: 13,
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "inherit" }}>×</button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave}>
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {/* Section: Cơ bản */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>{t("section_basic")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label={t("field_display_name")}>
                <input value={form.displayName} onChange={f("displayName")} required
                  style={inputStyle} placeholder={t("display_name_ph")} />
              </Field>
              <Field label={t("field_slug")}>
                <input value={form.slug} onChange={f("slug")} required
                  style={inputStyle} placeholder={t("slug_ph")} />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label={t("field_headline")}>
                <input value={form.headline} onChange={f("headline")}
                  style={inputStyle} placeholder={t("headline_ph")} />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label={t("field_bio")}>
                <textarea value={form.bio} onChange={f("bio")}
                  rows={4} style={{ ...inputStyle, resize: "vertical" as const }}
                  placeholder={t("bio_ph")} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <Field label={t("field_experience")}>
                <input type="number" min={0} max={50} value={form.experienceYears}
                  onChange={(e) => setForm(p => ({ ...p, experienceYears: Number(e.target.value) }))}
                  style={inputStyle} />
              </Field>
              <Field label={t("field_expertise")}>
                <input value={form.specialization} onChange={f("specialization")}
                  style={inputStyle} placeholder={t("expertise_ph")} />
              </Field>
            </div>
          </div>

          {/* Section: Media */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>{t("section_images")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label={t("field_avatar_url")}>
                <input value={form.avatarUrl} onChange={f("avatarUrl")}
                  style={inputStyle} placeholder="https://..." />
              </Field>
              <Field label={t("field_cover_url")}>
                <input value={form.coverUrl} onChange={f("coverUrl")}
                  style={inputStyle} placeholder="https://..." />
              </Field>
            </div>
            {safeImgUrl(form.avatarUrl) && (
              <div style={{ marginTop: 12 }}>
                <img src={safeImgUrl(form.avatarUrl)!} alt="Avatar preview"
                  style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #E5E7EB" }} />
              </div>
            )}
          </div>

          {/* Section: Social */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>{t("section_social")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label={t("field_facebook")}>
                <input value={form.facebookUrl} onChange={f("facebookUrl")} style={inputStyle} placeholder="https://facebook.com/..." />
              </Field>
              <Field label={t("field_youtube")}>
                <input value={form.youtubeUrl} onChange={f("youtubeUrl")} style={inputStyle} placeholder="https://youtube.com/..." />
              </Field>
              <Field label={t("field_tiktok")}>
                <input value={form.tiktokUrl} onChange={f("tiktokUrl")} style={inputStyle} placeholder="https://tiktok.com/@..." />
              </Field>
              <Field label={t("field_website")}>
                <input value={form.websiteUrl} onChange={f("websiteUrl")} style={inputStyle} placeholder="https://..." />
              </Field>
            </div>
          </div>

          {/* Section: Cài đặt */}
          <div style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>{t("section_settings")}</h3>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isPublic}
                onChange={(e) => setForm(p => ({ ...p, isPublic: e.target.checked }))}
                style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: "#374151" }}>
                {t("field_public")}
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button type="submit" disabled={isSaving} style={{
            padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: "#6366F1", color: "white", border: "none", cursor: "pointer",
            opacity: isSaving ? 0.7 : 1,
          }}>
            {isSaving ? t("btn_saving") : t("btn_save")}
          </button>
          <button type="button" onClick={() => router.push("/admin/teachers")} style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: "white", color: "#6B7280", border: "1px solid #E5E7EB", cursor: "pointer",
          }}>
            {t("btn_cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 13,
  border: "1px solid #E5E7EB", borderRadius: 6, outline: "none",
  boxSizing: "border-box", color: "#111827", background: "#FAFAFA",
};
