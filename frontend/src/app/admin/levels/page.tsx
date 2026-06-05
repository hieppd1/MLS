"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ActionButtons } from "@/app/admin/_components/ActionButtons";
import {
  useGetLearningLevelsQuery,
  useCreateLearningLevelMutation,
  useUpdateLearningLevelMutation,
  useSetLearningLevelActiveMutation,
  useDeleteLearningLevelMutation,
  type LearningLevel,
} from "@/lib/features/cms/cmsApi";

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "mb-1 block text-sm font-semibold text-gray-700";

export default function LearningLevelsPage() {
  const t = useTranslations("admin_levels");
  const { data: levels = [], isLoading } = useGetLearningLevelsQuery({ includeInactive: true });
  const [createLevel, { isLoading: creating }] = useCreateLearningLevelMutation();
  const [updateLevel, { isLoading: updating }] = useUpdateLearningLevelMutation();
  const [setActive] = useSetLearningLevelActiveMutation();
  const [deleteLevel] = useDeleteLearningLevelMutation();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "", orderIndex: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", orderIndex: 0 });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLevel({
        name: addForm.name,
        description: addForm.description || undefined,
        orderIndex: addForm.orderIndex,
      }).unwrap();
      setShowAdd(false);
      setAddForm({ name: "", description: "", orderIndex: levels.length });
      showMsg("success", t("toast_add_ok"));
    } catch {
      showMsg("error", t("toast_add_fail"));
    }
  };

  const startEdit = (lv: LearningLevel) => {
    setEditingId(lv.id);
    setEditForm({ name: lv.name, description: lv.description ?? "", orderIndex: lv.orderIndex });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateLevel({
        id: editingId,
        name: editForm.name,
        description: editForm.description || undefined,
        orderIndex: editForm.orderIndex,
      }).unwrap();
      setEditingId(null);
      showMsg("success", t("toast_update_ok"));
    } catch {
      showMsg("error", t("toast_update_fail"));
    }
  };

  const handleToggleActive = async (lv: LearningLevel) => {
    try {
      await setActive({ id: lv.id, active: !lv.isActive }).unwrap();
      showMsg("success", lv.isActive ? t("toast_hide_ok") : t("toast_activate_ok"));
    } catch {
      showMsg("error", t("toast_action_fail"));
    }
  };

  const handleDelete = async (lv: LearningLevel) => {
    if (!confirm(t("delete_confirm", { name: lv.name }))) return;
    try {
      await deleteLevel(lv.id).unwrap();
      showMsg("success", t("toast_delete_ok"));
    } catch {
      showMsg("error", t("toast_delete_fail"));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm({ name: "", description: "", orderIndex: levels.length }); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t("add")}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-gray-400">{t("loading")}</div>
      ) : levels.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="mb-3 text-5xl">🎓</div>
          <p className="font-semibold text-gray-600">{t("empty")}</p>
          <p className="mt-1 text-sm text-gray-400">{t("empty_hint")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("col_order")}</th>
                <th className="px-5 py-3 text-left">{t("col_name")}</th>
                <th className="px-5 py-3 text-left">{t("col_description")}</th>
                <th className="px-5 py-3 text-center">{t("col_status")}</th>
                <th className="px-5 py-3 text-right">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...levels].sort((a, b) => a.orderIndex - b.orderIndex).map((lv) => (
                <tr key={lv.id} className={`transition-colors hover:bg-gray-50/50 ${!lv.isActive ? "opacity-50" : ""}`}>
                  {editingId === lv.id ? (
                    <td colSpan={5} className="px-5 py-4">
                      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
                        <div style={{ width: 80 }}>
                          <label className={labelCls}>{t("col_order")}</label>
                          <input type="number" min={0} value={editForm.orderIndex}
                            onChange={(e) => setEditForm({ ...editForm, orderIndex: Number(e.target.value) })}
                            className={inputCls} />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                          <label className={labelCls}>{t("field_name")}</label>
                          <input required value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className={inputCls} placeholder={t("name_ph")} />
                        </div>
                        <div style={{ flex: "2 1 240px" }}>
                          <label className={labelCls}>{t("field_description")}</label>
                          <input value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className={inputCls} placeholder={t("desc_ph")} />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                          <button type="submit" disabled={updating}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                            {updating ? t("btn_saving") : t("btn_save")}
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm hover:bg-gray-50">
                            Hủy
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-4">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {lv.orderIndex + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{lv.name}</td>
                      <td className="px-5 py-4 text-gray-500">{lv.description ?? <span className="italic text-gray-300">—</span>}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lv.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {lv.isActive ? t("status_active") : t("status_hidden")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggleActive(lv)}
                            className={`rounded-lg px-3 py-1 text-xs font-medium ${
                              lv.isActive
                                ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}>
                            {lv.isActive ? t("btn_hide") : t("btn_activate")}
                          </button>
                          <ActionButtons
                            onEdit={() => startEdit(lv)}
                            onDelete={() => handleDelete(lv)}
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{t("modal_add_title")}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={labelCls}>{t("field_name")}</label>
                <input required value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className={inputCls}
                  placeholder={t("name_ph")} />
              </div>
              <div>
                <label className={labelCls}>{t("field_description")}</label>
                <input value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className={inputCls}
                  placeholder={t("add_desc_ph")} />
              </div>
              <div>
                <label className={labelCls}>{t("field_order")}</label>
                <input type="number" min={0} value={addForm.orderIndex}
                  onChange={(e) => setAddForm({ ...addForm, orderIndex: Number(e.target.value) })}
                  className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={creating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {creating ? t("btn_adding") : t("btn_add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
