"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import {
  useGetBannerSlidesQuery,
  useCreateBannerSlideMutation,
  useUpdateBannerSlideMutation,
  useDeleteBannerSlideMutation,
  type BannerSlideDto,
  type BannerSlideRequest,
} from "@/lib/features/cms/cmsApi";
import { useTranslations } from "next-intl";

const EMPTY_FORM: BannerSlideRequest = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  badgeText: "",
  ctaText: "Đăng ký ngay",
  bgColor: "#1565C0",
  textColor: "#FFFFFF",
  orderIndex: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const t = useTranslations("admin_banners");
  const { data: banners = [], isLoading } = useGetBannerSlidesQuery();
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const [createBanner] = useCreateBannerSlideMutation();
  const [updateBanner] = useUpdateBannerSlideMutation();
  const [deleteBanner] = useDeleteBannerSlideMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerSlideRequest>(EMPTY_FORM);
  const [saving,      setSaving]     = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/v1/admin/system/banners/upload-image`, {
        method: "POST",
        headers: {
          "X-Tenant-Slug": "demo",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? t("upload_fail"));
      }
      const data = await res.json() as { url: string };
      setForm(f => ({ ...f, imageUrl: `${API_BASE}${data.url}` }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("upload_fail"));
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, orderIndex: banners.length });
    setShowForm(true);
  }

  function openEdit(banner: BannerSlideDto) {
    setEditId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      description: banner.description ?? "",
      imageUrl: banner.imageUrl ?? "",
      linkUrl: banner.linkUrl ?? "",
      badgeText: banner.badgeText ?? "",
      ctaText: banner.ctaText ?? "",
      bgColor: banner.bgColor ?? "#1565C0",
      textColor: banner.textColor ?? "#FFFFFF",
      orderIndex: banner.orderIndex,
      isActive: banner.isActive,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateBanner({ id: editId, ...form }).unwrap();
      } else {
        await createBanner(form).unwrap();
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("delete_confirm"))) return;
    await deleteBanner(id).unwrap();
  }

  async function handleToggleActive(banner: BannerSlideDto) {
    await updateBanner({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      badgeText: banner.badgeText,
      ctaText: banner.ctaText,
      bgColor: banner.bgColor,
      textColor: banner.textColor,
      orderIndex: banner.orderIndex,
      isActive: !banner.isActive,
    }).unwrap();
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1565C0", margin: 0 }}>{t("title")}</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}
        >
          {t("add")}
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6B7280" }}>{t("loading")}</div>
      ) : banners.length === 0 ? (
        <div style={{ textAlign: "center", padding: 64, color: "#9CA3AF", border: "2px dashed #E5E7EB", borderRadius: 12 }}>
          {t("empty")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {banners.map((b) => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: 16,
              border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 16px",
              background: "#fff", opacity: b.isActive ? 1 : 0.6
            }}>
              {/* Color preview */}
              <div style={{
                width: 56, height: 40, borderRadius: 6, flexShrink: 0,
                background: b.bgColor ?? "#1565C0",
                border: "1px solid #E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 5 }} />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{b.title}</div>
                {b.subtitle && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{b.subtitle}</div>}
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {t("col_order")} {b.orderIndex} {b.badgeText && `· Badge: ${b.badgeText}`} {b.ctaText && `· CTA: ${b.ctaText}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => handleToggleActive(b)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: b.isActive ? "#DCFCE7" : "#F3F4F6",
                    color: b.isActive ? "#16A34A" : "#6B7280",
                    border: "none"
                  }}
                >
                  {b.isActive ? t("status_visible") : t("status_hidden")}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: 13 }}
                >
                  {t("btn_edit")}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: 13 }}
                >
                  {t("btn_delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 32, width: "100%", maxWidth: 600,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
              {editId ? t("modal_edit_title") : t("modal_add_title")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label={t("field_title")}>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle} placeholder={t("title_ph")} />
              </Field>
              <Field label={t("field_subtitle")}>
                <input value={form.subtitle ?? ""} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  style={inputStyle} placeholder={t("subtitle_ph")} />
              </Field>
              <Field label={t("field_description")}>
                <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ ...inputStyle, height: 72, resize: "vertical" }} placeholder={t("desc_ph")} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label={t("field_badge")}>
                  <input value={form.badgeText ?? ""} onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))}
                    style={inputStyle} placeholder={t("badge_ph")} />
                </Field>
                <Field label={t("field_cta")}>
                  <input value={form.ctaText ?? ""} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                    style={inputStyle} placeholder={t("cta_ph")} />
                </Field>
              </div>
              <Field label={t("field_image")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Preview */}
                  {form.imageUrl ? (
                    <div style={{ position: "relative", width: "100%", height: 120, borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, lineHeight: 1 }}
                      >×</button>
                    </div>
                  ) : (
                    <label style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      height: 100, border: "2px dashed #D1D5DB", borderRadius: 8, cursor: uploadingImg ? "not-allowed" : "pointer",
                      background: "#FAFAFA", gap: 8, color: "#6B7280", fontSize: 13,
                    }}>
                      {uploadingImg ? (
                        <><div style={{ width: 24, height: 24, border: "2px solid #D1D5DB", borderTop: "2px solid #1565C0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span>{t("uploading")}</span></>
                      ) : (
                        <><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg><span>{t("upload_click")}</span></>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} disabled={uploadingImg} onChange={handleImageUpload} />
                    </label>
                  )}
                  {uploadError && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{uploadError}</p>}
                  {/* Manual URL fallback */}
                  <input
                    value={form.imageUrl ?? ""}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 12, color: "#6B7280" }}
                    placeholder={t("image_url_ph")}
                  />
                </div>
              </Field>
              <Field label={t("field_link")}>
                <input value={form.linkUrl ?? ""} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  style={inputStyle} placeholder="/courses/abc" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label={t("field_bg_color")}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={form.bgColor ?? "#1565C0"} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                      style={{ width: 44, height: 38, border: "none", cursor: "pointer", borderRadius: 4 }} />
                    <input value={form.bgColor ?? ""} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }} placeholder="#1565C0" />
                  </div>
                </Field>
                <Field label={t("field_text_color")}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={form.textColor ?? "#FFFFFF"} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                      style={{ width: 44, height: 38, border: "none", cursor: "pointer", borderRadius: 4 }} />
                    <input value={form.textColor ?? ""} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }} placeholder="#FFFFFF" />
                  </div>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label={t("field_order")}>
                  <input type="number" value={form.orderIndex ?? 0} onChange={e => setForm(f => ({ ...f, orderIndex: parseInt(e.target.value) || 0 }))}
                    style={inputStyle} />
                </Field>
                <Field label={t("field_status")}>
                  <select value={form.isActive ? "1" : "0"} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "1" }))}
                    style={inputStyle}>
                    <option value="1">{t("status_visible")}</option>
                    <option value="0">{t("status_hidden")}</option>
                  </select>
                </Field>
              </div>

              {/* Preview */}
              {(form.title || form.bgColor) && (
                <div style={{
                  borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB",
                  background: form.bgColor ?? "#1565C0", padding: "20px 24px", color: form.textColor ?? "#fff"
                }}>
                  {form.badgeText && (
                    <span style={{ background: "#FF6B35", color: "#fff", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {form.badgeText}
                    </span>
                  )}
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{form.title || "Tiêu đề"}</div>
                  {form.subtitle && <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{form.subtitle}</div>}
                  {form.ctaText && (
                    <button style={{ marginTop: 12, background: "#FF6B35", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, cursor: "pointer" }}>
                      {form.ctaText}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || !form.title}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#1565C0", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? t("btn_saving") : (editId ? t("btn_save") : t("btn_create"))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8,
  fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FAFAFA"
};
