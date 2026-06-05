"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useDiscoverGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useUpdateGroupMutation,
  useGetGroupDetailQuery,
  type ChatGroupDiscovery,
  type ChatGroupType,
} from "@/lib/features/chat/chatApi";

const TYPE_COLOR: Record<string, string> = {
  Public:  "bg-emerald-100 text-emerald-700",
  Private: "bg-amber-100 text-amber-700",
};

export default function AdminChatGroupsPage() {
  const t = useTranslations("admin_chat_groups");
  const typeLabel = (k: string) => k === "Public" ? t("type_public") : k === "Private" ? t("type_private") : k;
  const [search, setSearch] = useState("");
  const [type, setType]     = useState<"" | ChatGroupType>("");
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { data: groups = [], isLoading, refetch } = useDiscoverGroupsQuery({
    search: search || undefined,
    type: type || undefined,
    page: 1, pageSize: 100,
  });

  const [createGroup, createState] = useCreateGroupMutation();
  const [deleteGroup, { isLoading: deleting }] = useDeleteGroupMutation();
  const [updateGroup, updateState] = useUpdateGroupMutation();

  const [editTarget, setEditTarget] = useState<ChatGroupDiscovery | null>(null);
  const [viewTargetId, setViewTargetId] = useState<string | null>(null);

  const rows = groups;

  // create form
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<ChatGroupType>("Public");
  const [fMax, setFMax]   = useState(20);
  const [fDesc, setFDesc] = useState("");

  function flash(t: "ok" | "err", text: string) {
    setMsg(`${t === "ok" ? "✓" : "⚠"} ${text}`);
    setTimeout(() => setMsg(null), 3000);
  }

  async function onCreate() {
    if (!fName.trim()) { flash("err", t("err_name_required")); return; }
    try {
      await createGroup({ name: fName.trim(), type: fType, maxMembers: fMax, description: fDesc }).unwrap();
      flash("ok", t("toast_created"));
      setShowCreate(false);
      setFName(""); setFDesc(""); setFMax(20); setFType("Public");
      refetch();
    } catch (e) {
      flash("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_create_fail"));
    }
  }

  async function handleDelete(g: ChatGroupDiscovery) {
    if (!confirm(t("confirm_delete", { name: g.name }))) return;
    try {
      await deleteGroup(g.id).unwrap();
      flash("ok", t("toast_deleted"));
      await refetch();
    } catch (e: unknown) {
      flash("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_delete_fail"));
    }
  }

  function openEdit(g: ChatGroupDiscovery) {
    setEditTarget(g);
  }

  function openView(g: ChatGroupDiscovery) {
    setViewTargetId(g.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_ph")}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64" />
          <select value={type} onChange={(e) => setType(e.target.value as "" | ChatGroupType)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">{t("all_types")}</option>
            <option value="Public">{t("type_public")}</option>
            <option value="Private">{t("type_private")}</option>
          </select>
          <button onClick={() => setShowCreate(true)}
            className="bg-[#1565C0] hover:bg-[#0d4a91] text-white text-sm font-semibold px-4 py-2 rounded-md">
            {t("btn_create")}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-md text-sm ${
          msg.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>{msg}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">{t("col_name")}</th>
              <th className="text-left px-4 py-3">{t("col_type")}</th>
              <th className="text-left px-4 py-3">{t("col_members")}</th>
              <th className="text-left px-4 py-3">{t("col_desc")}</th>
              <th className="text-right px-4 py-3">{t("col_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t("loading")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t("empty")}</td></tr>
            ) : rows.map((g) => (
              <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {g.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[g.type] ?? ""}`}>
                    {typeLabel(g.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{g.currentMembers} / {g.maxMembers}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{g.description ?? "—"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openView(g)}
                    className="text-[#1565C0] hover:text-[#0d4a91] text-sm font-medium">
                    {t("btn_view")}
                  </button>
                  <button onClick={() => openEdit(g)}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                    {t("btn_edit")}
                  </button>
                  <button onClick={() => handleDelete(g)} disabled={deleting}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50">
                    {t("btn_delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[440px]">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("modal_create_title")}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_name")}</label>
                <input value={fName} onChange={(e) => setFName(e.target.value)} maxLength={120}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_desc")}</label>
                <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_type")}</label>
                  <select value={fType} onChange={(e) => setFType(e.target.value as ChatGroupType)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="Public">{t("type_public")}</option>
                    <option value="Private">{t("type_private")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_max")}</label>
                  <input type="number" min={2} max={500} value={fMax}
                    onChange={(e) => setFMax(parseInt(e.target.value) || 20)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm">{t("btn_cancel")}</button>
              <button onClick={onCreate} disabled={createState.isLoading}
                className="px-4 py-2 rounded-md bg-[#1565C0] hover:bg-[#0d4a91] text-white text-sm font-semibold disabled:opacity-60">
                {createState.isLoading ? t("btn_creating") : t("btn_create_group")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <EditGroupModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={async (patch) => {
            try {
              await updateGroup({ id: editTarget.id, ...patch }).unwrap();
              flash("ok", t("toast_updated"));
              setEditTarget(null);
              await refetch();
            } catch (e) {
              flash("err", (e as { data?: { message?: string } })?.data?.message ?? t("toast_update_fail"));
            }
          }}
          submitting={updateState.isLoading}
        />
      )}

      {viewTargetId && (
        <ViewGroupModal id={viewTargetId} onClose={() => setViewTargetId(null)} />
      )}
    </div>
  );
}

/* ---------- Edit modal ---------- */
function EditGroupModal({ row, onClose, onSubmit, submitting }: {
  row: ChatGroupDiscovery;
  onClose: () => void;
  onSubmit: (patch: { name: string; description: string; maxMembers: number }) => void;
  submitting: boolean;
}) {
  const t = useTranslations("admin_chat_groups");
  const [name, setName] = useState(row.name);
  const [desc, setDesc] = useState(row.description ?? "");
  const [max, setMax]   = useState(row.maxMembers);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 w-[440px]">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t("modal_edit_title")}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_desc")}</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("f_max")}</label>
            <input type="number" min={2} max={500} value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 20)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm">{t("btn_cancel")}</button>
          <button disabled={submitting || !name.trim()}
            onClick={() => onSubmit({ name: name.trim(), description: desc, maxMembers: max })}
            className="px-4 py-2 rounded-md bg-[#1565C0] hover:bg-[#0d4a91] text-white text-sm font-semibold disabled:opacity-60">
            {submitting ? t("btn_saving") : t("btn_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- View modal ---------- */
function ViewGroupModal({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations("admin_chat_groups");
  const typeLabel = (k: string) => k === "Public" ? t("type_public") : k === "Private" ? t("type_private") : k;
  const { data, isLoading, error } = useGetGroupDetailQuery(id);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 w-[520px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t("view_title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        {isLoading && <p className="text-sm text-gray-500">{t("loading")}</p>}
        {error && <p className="text-sm text-red-600">{t("view_err")}</p>}
        {data && (
          <div className="space-y-3 text-sm">
            <div><span className="font-semibold text-gray-700">{t("v_name")} </span><span className="text-gray-900">{data.name}</span></div>
            <div><span className="font-semibold text-gray-700">{t("v_type")} </span><span>{typeLabel(data.type)}</span></div>
            <div><span className="font-semibold text-gray-700">{t("v_members")} </span><span>{data.currentMembers} / {data.maxMembers}</span></div>
            <div><span className="font-semibold text-gray-700">{t("v_desc")} </span><span className="text-gray-600">{data.description ?? "—"}</span></div>
            <div><span className="font-semibold text-gray-700">{t("v_creator")} </span><span className="font-mono text-xs text-gray-600">{data.createdBy}</span></div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">{t("v_members_count", { n: data.members.length })}</p>
              <div className="border border-gray-200 rounded-md max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-2 py-1.5 text-left">{t("v_col_user")}</th><th className="px-2 py-1.5 text-left">{t("v_col_role")}</th><th className="px-2 py-1.5 text-left">{t("v_col_status")}</th></tr>
                  </thead>
                  <tbody>
                    {data.members.length === 0
                      ? <tr><td colSpan={3} className="px-2 py-2 text-center text-gray-500">{t("v_no_members")}</td></tr>
                      : data.members.map((m) => (
                        <tr key={m.userId} className="border-t border-gray-100">
                          <td className="px-2 py-1.5 font-mono">{m.userId.slice(0, 8)}…</td>
                          <td className="px-2 py-1.5">{m.role}</td>
                          <td className="px-2 py-1.5">{m.status}</td>
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
