"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ActionButtons } from "@/app/admin/_components/ActionButtons";
import { useGetRolesQuery, useCreateRoleMutation, useDeleteRoleMutation } from "@/lib/features/admin/adminApi";

export default function AdminRolesPage() {
  const t = useTranslations("admin_roles");
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRole({ name: newName, description: newDesc || undefined }).unwrap();
      setMsg({ type: "success", text: t("toast_create_ok", { name: newName }) });
      setShowCreate(false);
      setNewName(""); setNewDesc("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_create_fail") });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id).unwrap();
      setMsg({ type: "success", text: t("toast_delete_ok", { name: deleteTarget.name }) });
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_delete_fail") });
    }
    setDeleteTarget(null);
  }

  const PROTECTED = ["SuperAdmin", "Admin", "Student"];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setMsg(null); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t("create")}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 font-bold">×</button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {t("load_error")}
        </p>
      )}

      {roles && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <Link href={`/admin/roles/${role.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 hover:text-indigo-600">{role.name}</h3>
                  {role.description && (
                    <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    {role.userCount} users
                  </span>
                  <ActionButtons
                    viewHref={`/admin/roles/${role.id}`}
                    onDelete={
                      !PROTECTED.includes(role.name)
                        ? () => { setDeleteTarget({ id: role.id, name: role.name }); setMsg(null); }
                        : undefined
                    }
                    canDelete={!PROTECTED.includes(role.name)}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 4).map((p) => (
                  <span key={p} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{p}</span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{t("modal_create_title")}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_name")}</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required
                  placeholder="VD: Moderator"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_description")}</label>
                <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t("desc_ph")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isCreating}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {isCreating ? t("btn_creating") : t("btn_create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-gray-900">{t("modal_delete_title")}</h2>
            <p className="mb-6 text-sm text-gray-600">
              {t("delete_confirm", { name: deleteTarget.name })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? t("btn_deleting") : t("btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
