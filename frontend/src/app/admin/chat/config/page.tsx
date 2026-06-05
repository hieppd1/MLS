"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/lib/hooks";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

interface ChatSettings {
  maxGroupsPerUser: number;
  maxMembersPerGroup: number;
  allowImageUpload: boolean;
  allowFileUpload: boolean;
  maxImageSizeKb: number;
  maxFileSizeKb: number;
  allowedMimeTypes: string;
}

const DEFAULT_SETTINGS: ChatSettings = {
  maxGroupsPerUser: 3,
  maxMembersPerGroup: 12,
  allowImageUpload: true,
  allowFileUpload: true,
  maxImageSizeKb: 5120,
  maxFileSizeKb: 20480,
  allowedMimeTypes: "image/png,image/jpeg,image/webp,application/pdf",
};

const MLS_NAVY = "#1565C0";

export default function AdminChatSettingsPage() {
  const t = useTranslations("admin_chat_config");
  const token       = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug  = useAppSelector((s) => s.auth.tenantSlug);
  const isHydrated  = useAppSelector((s) => s.auth.isHydrated);

  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  function showMsg(type: "success" | "error" | "info", text: string) {
    setMsg({ type, text });
    if (type !== "error") setTimeout(() => setMsg(null), 3500);
  }

  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
    ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) { setLoading(false); showMsg("error", t("err_not_logged")); return; }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/chat-settings`, { headers: authHeaders() });
        if (!res.ok) {
          showMsg("info", t("err_load_http", { status: res.status }));
        } else {
          const data = await res.json();
          if (data && typeof data === "object") setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } catch {
        showMsg("info", t("err_load_net"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, token, tenantSlug]);

  async function save() {
    if (!token) { showMsg("error", t("err_not_logged")); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/chat-settings`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(String(res.status));
      showMsg("success", t("saved"));
    } catch (e) {
      showMsg("error", t("save_failed", { err: (e as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{t("title")}</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>{t("subtitle")}</p>
      </div>

      {msg && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 10,
          background: msg.type === "success" ? "#F0FDF4" : msg.type === "error" ? "#FEF2F2" : "#EFF6FF",
          color:      msg.type === "success" ? "#16A34A" : msg.type === "error" ? "#DC2626" : "#1565C0",
          fontSize: 14,
        }}>{msg.text}</div>
      )}

      {loading ? (
        <p style={{ color: "#9CA3AF" }}>{t("loading")}</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <NumberField label={t("f_max_groups")} value={settings.maxGroupsPerUser}
              onChange={(v) => setSettings({ ...settings, maxGroupsPerUser: v })} />
            <NumberField label={t("f_max_members")} value={settings.maxMembersPerGroup}
              onChange={(v) => setSettings({ ...settings, maxMembersPerGroup: v })} />
            <NumberField label={t("f_max_image")} value={settings.maxImageSizeKb}
              onChange={(v) => setSettings({ ...settings, maxImageSizeKb: v })} />
            <NumberField label={t("f_max_file")} value={settings.maxFileSizeKb}
              onChange={(v) => setSettings({ ...settings, maxFileSizeKb: v })} />
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Toggle label={t("f_allow_image")} value={settings.allowImageUpload}
              onChange={(v) => setSettings({ ...settings, allowImageUpload: v })} />
            <Toggle label={t("f_allow_file")} value={settings.allowFileUpload}
              onChange={(v) => setSettings({ ...settings, allowFileUpload: v })} />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              {t("f_mime_label")}
            </label>
            <input value={settings.allowedMimeTypes ?? ""}
              onChange={(e) => setSettings({ ...settings, allowedMimeTypes: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
              {t("f_mime_hint")}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button onClick={save} disabled={saving}
              style={{ padding: "10px 24px", borderRadius: 10, background: MLS_NAVY, color: "#fff",
                       border: "none", fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? t("btn_saving") : t("btn_save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}
