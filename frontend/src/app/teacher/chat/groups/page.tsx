"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18nFormat";
import {
  useListMyGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useUpdateGroupMutation,
  useGetGroupDetailQuery,
  type ChatGroupSummary,
  type ChatGroupType,
} from "@/lib/features/chat/chatApi";

const MLS_NAVY = "#1565C0";
const MLS_RED  = "#e5173f";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return formatDate(iso);
}

export default function TeacherChatGroupsPage() {
  const t = useTranslations("teacher_chat_groups");
  const { data: groups = [], isFetching, refetch } = useListMyGroupsQuery();
  const [createGroup, createState] = useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [updateGroup, updateState] = useUpdateGroupMutation();

  const [editTarget, setEditTarget] = useState<ChatGroupSummary | null>(null);
  const [viewTargetId, setViewTargetId] = useState<string | null>(null);

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | ChatGroupType>("");
  const [msg, setMsg]             = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toDelete, setToDelete]   = useState<ChatGroupSummary | null>(null);

  // form
  const [fName, setFName]               = useState("");
  const [fType, setFType]               = useState<ChatGroupType>("Public");
  const [fMax, setFMax]                 = useState(15);
  const [fDescription, setFDescription] = useState("");

  const owned = useMemo(
    () => groups.filter((g) => g.myRole === "Owner"),
    [groups],
  );

  const filtered = useMemo(() => {
    return owned.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && g.type !== typeFilter) return false;
      return true;
    });
  }, [owned, search, typeFilter]);

  function show(type: "ok" | "err", text: string) {
    setMsg(`${type === "ok" ? "✓" : "⚠"} ${text}`);
    setTimeout(() => setMsg(null), 3000);
  }

  async function onCreate() {
    if (!fName.trim()) { show("err", t("err_name_required")); return; }
    try {
      await createGroup({ name: fName.trim(), type: fType, maxMembers: fMax, description: fDescription }).unwrap();
      show("ok", t("toast_created"));
      setShowCreate(false);
      setFName(""); setFDescription(""); setFMax(15); setFType("Public");
      refetch();
    } catch (e) {
      show("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_create_fail"));
    }
  }

  async function onConfirmDelete() {
    if (!toDelete) return;
    try {
      await deleteGroup(toDelete.id).unwrap();
      show("ok", t("toast_deleted"));
      setToDelete(null);
      refetch();
    } catch (e) {
      show("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_delete_fail"));
    }
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{t("title")}</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            {t("subtitle", { n: owned.length })}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: MLS_NAVY, color: "#fff", border: "none", padding: "10px 20px",
                   borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          {t("btn_create")}
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: msg.startsWith("✓") ? "#F0FDF4" : "#FEF2F2",
          color: msg.startsWith("✓") ? "#16A34A" : "#DC2626", fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 16,
        display: "flex", gap: 12, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_ph")}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }}
        />
        <select
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "" | ChatGroupType)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }}
        >
          <option value="">{t("all_types")}</option>
          <option value="Public">{t("type_public")}</option>
          <option value="Private">{t("type_private")}</option>
        </select>
        {(search || typeFilter) && (
          <button onClick={() => { setSearch(""); setTypeFilter(""); }}
            style={{ padding: "8px 14px", borderRadius: 8, background: "#F3F4F6",
                     border: "1px solid #D1D5DB", fontSize: 13, cursor: "pointer", color: "#374151" }}>
            {t("clear_filter")}
          </button>
        )}
      </div>

      {/* Table card */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        {isFetching ? (
          <p style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>{t("empty")}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#6B7280", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700 }}>{t("col_name")}</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700 }}>{t("col_type")}</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700 }}>{t("col_members")}</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700 }}>{t("col_last")}</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 700 }}>{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} style={{ borderTop: "1px solid #F3F4F6" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#111827", fontWeight: 600 }}>
                    {g.name}
                    {g.description && (
                      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 400, marginTop: 2 }}>{g.description}</div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: g.type === "Public" ? "#DCFCE7" : "#FEE2E2",
                      color:      g.type === "Public" ? "#16A34A" : "#DC2626",
                    }}>{g.type === "Public" ? t("type_public") : t("type_private")}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                    {g.currentMembers} / {g.maxMembers}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{formatTime(g.lastMessageAt)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setViewTargetId(g.id)}
                      style={{ background: "#fff", color: MLS_NAVY, border: `1px solid ${MLS_NAVY}`, padding: "6px 12px",
                               borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6 }}
                    >
                      {t("btn_view")}
                    </button>
                    <button
                      onClick={() => setEditTarget(g)}
                      style={{ background: MLS_NAVY, color: "#fff", border: "none", padding: "6px 12px",
                               borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6 }}
                    >
                      {t("btn_edit")}
                    </button>
                    <button
                      onClick={() => setToDelete(g)}
                      style={{ background: MLS_RED, color: "#fff", border: "none", padding: "6px 12px",
                               borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      {t("btn_delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
                      alignItems: "center", justifyContent: "center", zIndex: 100 }}
             onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()}
               style={{ background: "#fff", borderRadius: 16, padding: 24, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 16 }}>{t("modal_create_title")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label={t("f_name")}>
                <input value={fName} onChange={(e) => setFName(e.target.value)} maxLength={120}
                  style={inputStyle} />
              </Field>
              <Field label={t("f_desc")}>
                <textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={t("f_type")}>
                  <select value={fType} onChange={(e) => setFType(e.target.value as ChatGroupType)} style={inputStyle}>
                    <option value="Public">{t("type_public")}</option>
                    <option value="Private">{t("type_private")}</option>
                  </select>
                </Field>
                <Field label={t("f_max")}>
                  <input type="number" min={2} max={100} value={fMax}
                    onChange={(e) => setFMax(parseInt(e.target.value) || 15)} style={inputStyle} />
                </Field>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 14 }}>
                {t("btn_cancel")}
              </button>
              <button onClick={onCreate} disabled={createState.isLoading}
                style={{ padding: "8px 20px", borderRadius: 8, background: MLS_NAVY, color: "#fff",
                         border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: createState.isLoading ? 0.6 : 1 }}>
                {createState.isLoading ? t("btn_creating") : t("btn_create_group")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {toDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
                      alignItems: "center", justifyContent: "center", zIndex: 100 }}
             onClick={() => setToDelete(null)}>
          <div onClick={(e) => e.stopPropagation()}
               style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{t("modal_delete_title")}</h3>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              {t.rich("delete_confirm", { name: toDelete.name, b: (chunks) => <b>{chunks}</b> })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setToDelete(null)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 14 }}>
                {t("btn_cancel")}
              </button>
              <button onClick={onConfirmDelete}
                style={{ padding: "8px 20px", borderRadius: 8, background: MLS_RED, color: "#fff",
                         border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                {t("btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <TeacherEditModal
          row={editTarget}
          submitting={updateState.isLoading}
          onClose={() => setEditTarget(null)}
          onSubmit={async (patch) => {
            try {
              await updateGroup({ id: editTarget.id, ...patch }).unwrap();
              show("ok", t("toast_updated"));
              setEditTarget(null);
              refetch();
            } catch (e) {
              show("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_update_fail"));
            }
          }}
        />
      )}

      {viewTargetId && (
        <TeacherViewModal id={viewTargetId} onClose={() => setViewTargetId(null)} />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function TeacherEditModal({ row, onClose, onSubmit, submitting }: {
  row: ChatGroupSummary;
  onClose: () => void;
  onSubmit: (p: { name: string; description: string; maxMembers: number }) => void;
  submitting: boolean;
}) {
  const t = useTranslations("teacher_chat_groups");
  const [name, setName] = useState(row.name);
  const [desc, setDesc] = useState(row.description ?? "");
  const [max, setMax]   = useState(row.maxMembers);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
                  alignItems: "center", justifyContent: "center", zIndex: 100 }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ background: "#fff", borderRadius: 16, padding: 24, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 16 }}>{t("modal_edit_title")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label={t("f_name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} style={inputStyle} />
          </Field>
          <Field label={t("f_desc")}>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <Field label={t("f_max_edit")}>
            <input type="number" min={2} max={500} value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 15)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 8, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 14 }}>
            {t("btn_cancel")}
          </button>
          <button disabled={submitting || !name.trim()}
            onClick={() => onSubmit({ name: name.trim(), description: desc, maxMembers: max })}
            style={{ padding: "8px 20px", borderRadius: 8, background: "#1565C0", color: "#fff",
                     border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? t("btn_saving") : t("btn_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherViewModal({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations("teacher_chat_groups");
  const { data, isLoading, error } = useGetGroupDetailQuery(id);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
                  alignItems: "center", justifyContent: "center", zIndex: 100 }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ background: "#fff", borderRadius: 16, padding: 24, width: 520, maxHeight: "80vh",
                    overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{t("view_title")}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#9CA3AF", cursor: "pointer" }}>×</button>
        </div>
        {isLoading && <p style={{ color: "#6B7280" }}>{t("view_loading")}</p>}
        {error && <p style={{ color: "#DC2626" }}>{t("view_err")}</p>}
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#374151" }}>
            <div><b>{t("v_name")} </b>{data.name}</div>
            <div><b>{t("v_type")} </b>{data.type === "Public" ? t("type_public") : t("type_private")}</div>
            <div><b>{t("v_members")} </b>{data.currentMembers} / {data.maxMembers}</div>
            <div><b>{t("v_desc")} </b>{data.description ?? "—"}</div>
            <div><b>{t("v_my_role")} </b>{data.myRole ?? "—"}</div>
            <div>
              <b>{t("v_members_count", { n: data.members.length })}</b>
              <div style={{ marginTop: 6, maxHeight: 220, overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ background: "#F9FAFB", color: "#6B7280" }}>
                    <tr><th style={{ padding: "6px 8px", textAlign: "left" }}>{t("v_col_user")}</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>{t("v_col_role")}</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>{t("v_col_status")}</th></tr>
                  </thead>
                  <tbody>
                    {data.members.length === 0
                      ? <tr><td colSpan={3} style={{ padding: 8, textAlign: "center", color: "#9CA3AF" }}>{t("v_no_members")}</td></tr>
                      : data.members.map((m) => (
                          <tr key={m.userId} style={{ borderTop: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{m.userId.slice(0, 8)}…</td>
                            <td style={{ padding: "6px 8px" }}>{m.role}</td>
                            <td style={{ padding: "6px 8px" }}>{m.status}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
