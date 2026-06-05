"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18nFormat";
import {
  useGetLevelQuery,
  useUpdateLevelMutation,
  usePublishLevelMutation,
  useDeleteLevelMutation,
  useCreateModuleMutation,
  useDeleteModuleMutation,
  useUpdateModuleMutation,
} from "@/lib/features/cms/cmsApi";

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "mb-1 block text-sm font-semibold text-gray-700";

export default function LevelDetailPage() {
  const t = useTranslations("admin_level_detail");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: level, isLoading } = useGetLevelQuery(id);
  const [updateLevel, { isLoading: updating }] = useUpdateLevelMutation();
  const [publishLevel] = usePublishLevelMutation();
  const [deleteLevel] = useDeleteLevelMutation();
  const [createModule, { isLoading: creatingModule }] = useCreateModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();
  const [updateModule] = useUpdateModuleMutation();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", orderIndex: 0 });
  const [showAddModule, setShowAddModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleForm, setEditModuleForm] = useState({ title: "", description: "", orderIndex: 0 });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const startEdit = () => {
    if (!level) return;
    setForm({ name: level.name, description: level.description ?? "", orderIndex: level.orderIndex });
    setEditMode(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLevel({ id, courseId: level!.courseId, name: form.name, description: form.description || undefined, orderIndex: form.orderIndex }).unwrap();
      setEditMode(false);
      showMsg("success", t("toast_update_ok"));
    } catch {
      showMsg("error", t("toast_update_fail"));
    }
  };

  const handleTogglePublish = async () => {
    if (!level) return;
    try {
      await publishLevel({ id, courseId: level.courseId, publish: !level.isPublished }).unwrap();
      showMsg("success", level.isPublished ? t("toast_unpub_ok") : t("toast_pub_ok"));
    } catch {
      showMsg("error", t("toast_op_fail"));
    }
  };

  const handleDelete = async () => {
    if (!level) return;
    if (!confirm(t("confirm_delete_level", { name: level.name }))) return;
    try {
      await deleteLevel({ id, courseId: level.courseId }).unwrap();
      showMsg("success", t("toast_del_ok"));
      setTimeout(() => router.push(`/admin/courses/${level.courseId}`), 1000);
    } catch {
      showMsg("error", t("toast_del_fail"));
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!level) return;
    try {
      await createModule({ courseId: level.courseId, levelId: id, ...moduleForm }).unwrap();
      setShowAddModule(false);
      setModuleForm({ title: "", description: "" });
      showMsg("success", t("toast_mod_add_ok"));
    } catch {
      showMsg("error", t("toast_mod_add_fail"));
    }
  };

  const handleRemoveModuleFromLevel = async (moduleId: string, moduleTitle: string, orderIndex: number) => {
    if (!confirm(t("confirm_unlink_mod", { name: moduleTitle }))) return;
    try {
      await updateModule({ id: moduleId, title: moduleTitle, description: null, orderIndex, isLocked: false, levelId: undefined }).unwrap();
      showMsg("success", t("toast_mod_unlink_ok"));
    } catch {
      showMsg("error", t("toast_op_fail"));
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(t("confirm_delete_mod", { name: title }))) return;
    try {
      await deleteModule({ id: moduleId, courseId: level!.courseId }).unwrap();
      showMsg("success", t("toast_mod_del_ok"));
    } catch {
      showMsg("error", t("toast_del_fail"));
    }
  };

  const startEditModule = (mod: { id: string; title: string; description: string | null; orderIndex: number }) => {
    setEditingModuleId(mod.id);
    setEditModuleForm({ title: mod.title, description: mod.description ?? "", orderIndex: mod.orderIndex });
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModuleId) return;
    try {
      await updateModule({ id: editingModuleId, ...editModuleForm, description: editModuleForm.description || undefined, levelId: id }).unwrap();
      setEditingModuleId(null);
      showMsg("success", t("toast_mod_update_ok"));
    } catch {
      showMsg("error", t("toast_update_fail"));
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">{t("loading")}</div>;
  if (!level) return <div className="p-6 text-red-500">{t("not_found")}</div>;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-blue-600">{t("crumb_courses")}</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/courses/${level.courseId}`} className="hover:text-blue-600">{t("crumb_course")}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-800">{level.name}</span>
      </nav>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{level.name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            level.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {level.isPublished ? t("st_published") : t("st_draft")}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
            {t("order_no", { n: level.orderIndex + 1 })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTogglePublish}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              level.isPublished
                ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {level.isPublished ? t("btn_unpublish") : t("btn_publish")}
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            {t("btn_delete")}
          </button>
          {!editMode && (
            <button
              onClick={startEdit}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t("btn_edit")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Level info */}
        <div className="col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("section_info")}</h2>

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className={labelCls}>{t("f_name")} <span className="text-red-500">*</span></label>
                  <input required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls} placeholder={t("f_name_ph")} />
                </div>
                <div>
                  <label className={labelCls}>{t("f_desc")}</label>
                  <textarea rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputCls} placeholder={t("f_desc_ph")} />
                </div>
                <div>
                  <label className={labelCls}>{t("f_order")}</label>
                  <input type="number" min={0} value={form.orderIndex}
                    onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={updating}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                    {updating ? t("btn_saving") : t("btn_save")}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                    {t("btn_cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                {level.description && (
                  <p className="text-gray-600">{level.description}</p>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <span>📦</span>
                  <span>{t("info_modules", { n: level.modules.length })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>📅</span>
                  <span>{t("info_created", { date: formatDate(level.createdAt) })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>🔢</span>
                  <span>{t("info_order", { n: level.orderIndex + 1 })}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Modules list */}
        <div className="col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {t("modules_title", { n: level.modules.length })}
            </h2>
            <button onClick={() => setShowAddModule(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {t("btn_add_module")}
            </button>
          </div>

          {level.modules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-14 text-center">
              <div className="mb-2 text-4xl">📦</div>
              <p className="font-medium text-gray-500">{t("empty_modules")}</p>
              <p className="mt-1 text-sm text-gray-400">{t("empty_hint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {level.modules.map((mod, idx) => (
                <div key={mod.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  {editingModuleId === mod.id ? (
                    <form onSubmit={handleSaveModule} className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>{t("f_mod_title")}</label>
                          <input required value={editModuleForm.title}
                            onChange={(e) => setEditModuleForm({ ...editModuleForm, title: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>{t("f_mod_order")}</label>
                          <input type="number" min={0} value={editModuleForm.orderIndex}
                            onChange={(e) => setEditModuleForm({ ...editModuleForm, orderIndex: Number(e.target.value) })}
                            className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t("f_mod_desc")}</label>
                        <input value={editModuleForm.description}
                          onChange={(e) => setEditModuleForm({ ...editModuleForm, description: e.target.value })}
                          className={inputCls} placeholder={t("f_mod_desc_ph")} />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit"
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                          {t("btn_save")}
                        </button>
                        <button type="button" onClick={() => setEditingModuleId(null)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                          {t("btn_cancel")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {idx + 1}
                        </span>
                        <div>
                          <Link href={`/admin/modules/${mod.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600">
                            {mod.title}
                          </Link>
                          {mod.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{mod.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{t("sessions_count", { n: mod.sessionCount })}</span>
                        <Link href={`/admin/modules/${mod.id}`}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                          {t("btn_manage")}
                        </Link>
                        <button onClick={() => startEditModule(mod)}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
                          {t("btn_edit_short")}
                        </button>
                        <button onClick={() => handleRemoveModuleFromLevel(mod.id, mod.title, mod.orderIndex)}
                          className="rounded-lg bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100">
                          {t("btn_unlink")}
                        </button>
                        <button onClick={() => handleDeleteModule(mod.id, mod.title)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
                          {t("btn_delete_short")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{t("modal_add_title")}</h2>
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className={labelCls}>{t("f_mod_title")} <span className="text-red-500">*</span></label>
                <input required value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className={inputCls}
                  placeholder={t("f_add_title_ph")} />
              </div>
              <div>
                <label className={labelCls}>{t("f_desc")}</label>
                <textarea value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={2} className={inputCls}
                  placeholder={t("f_add_desc_ph")} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModule(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  {t("btn_cancel")}
                </button>
                <button type="submit" disabled={creatingModule}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {creatingModule ? t("btn_adding") : t("btn_add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
