"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { formatDate, formatDateTime } from "@/lib/i18nFormat";
import {
  useGetUserDetailQuery,
  useUpdateUserStatusMutation,
  useAssignRoleMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUploadUserAvatarMutation,
  type SessionSummary,
} from "@/lib/features/admin/adminApi";

const STATUS_OPTIONS = ["Active", "Suspended", "Inactive"];
const ROLE_OPTIONS = ["Student", "Teacher", "ContentManager", "Support", "Admin"];

export default function AdminUserDetailPage() {
  const t = useTranslations("admin_user_detail");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoEditRef = useRef(false);
  const { data: user, isLoading, isError } = useGetUserDetailQuery(params.id);
  const [updateStatus] = useUpdateUserStatusMutation();
  const [assignRole] = useAssignRoleMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [uploadAvatar] = useUploadUserAvatarMutation();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);

  // Auto-enter edit mode when navigated with ?edit=1
  useEffect(() => {
    if (autoEditRef.current) return;
    if (searchParams.get("edit") !== "1") return;
    if (!user || user.role === "SuperAdmin") return;
    autoEditRef.current = true;
    setEditName(user.fullName ?? "");
    setEditPhone(user.phone ?? "");
    setEditAvatarUrl(null);
    setEditMode(true);
  }, [user, searchParams]);

  function startEdit() {
    setEditName(user?.fullName ?? "");
    setEditPhone(user?.phone ?? "");
    setEditAvatarUrl(null);
    setEditMode(true);
  }

  async function handleAvatarUpload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatar({ userId: params.id, formData: fd }).unwrap();
    setEditAvatarUrl(res.avatarUrl);
    return res.avatarUrl;
  }

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({ userId: params.id, status }).unwrap();
      setMsg({ type: "success", text: t("toast_status_ok", { status }) });
    } catch {
      setMsg({ type: "error", text: t("toast_status_fail") });
    }
  }

  async function handleRoleChange(roleName: string) {
    try {
      await assignRole({ userId: params.id, roleName }).unwrap();
      setMsg({ type: "success", text: t("toast_role_ok", { roleName }) });
    } catch {
      setMsg({ type: "error", text: t("toast_role_fail") });
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateUser({ userId: params.id, fullName: editName, phone: editPhone || undefined }).unwrap();
      setMsg({ type: "success", text: t("toast_info_ok") });
      setEditMode(false);
    } catch {
      setMsg({ type: "error", text: t("toast_info_fail") });
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(params.id).unwrap();
      router.push("/admin/users");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_delete_fail") });
      setShowDelete(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div>
        <p className="text-red-600">{t("not_found")}</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm text-indigo-600">
          {t("back_link")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
            {t("back_link")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>
        </div>
        <div className="flex gap-2">
          {!editMode && user.role !== "SuperAdmin" && (
            <button
              onClick={startEdit}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("btn_edit")}
            </button>
          )}
          {user.role !== "SuperAdmin" && (
            <button
              onClick={() => { setShowDelete(true); setMsg(null); }}
              className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              {t("btn_delete")}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 font-bold">×</button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        {/* Basic info / Edit mode */}
        {editMode ? (
          <form onSubmit={handleEditSave} className="space-y-4">
            <h3 className="font-semibold text-gray-700">{t("edit_heading")}</h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t("field_avatar")}</label>
              <div className="flex items-center gap-4">
                <ImageUpload
                  value={editAvatarUrl}
                  onChange={setEditAvatarUrl}
                  uploadFn={handleAvatarUpload}
                  shape="circle"
                  placeholder={t("btn_upload_avatar")}
                />
                <p className="text-xs text-gray-400">{t("avatar_hint1")}<br />{t("avatar_hint2")}</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_fullname")}</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_phone")}</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder={t("phone_ph")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditMode(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("btn_cancel")}</button>
              <button type="submit" disabled={isUpdating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {isUpdating ? t("btn_saving") : t("btn_save")}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">{t("info_created")}</p>
            <p className="font-medium text-gray-700">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">{t("info_last_login")}</p>
            <p className="font-medium text-gray-700">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : t("info_never")}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">{t("info_sessions")}</p>
            <p className="font-medium text-gray-700">{user.activeSessions.length}</p>
          </div>
        </div>

        {/* Sessions table */}
        {user.activeSessions.length > 0 && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">{t("sessions_heading")}</p>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400">
                      <th className="px-3 py-2 text-left font-medium">{t("col_device")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("col_created")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("col_expires")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.activeSessions.map((s: SessionSummary) => (
                      <tr key={s.id} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-600 font-mono">{s.deviceId ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{formatDateTime(s.createdAt)}</td>
                        <td className="px-3 py-2 text-gray-600">{formatDateTime(s.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <hr className="border-gray-100" />

        {/* Status */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t("section_status")}</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  user.status === s
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        {user.role !== "SuperAdmin" && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">{t("section_role")}</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    user.role === r
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-gray-900">{t("modal_delete_title")}</h2>
            <p className="mb-6 text-sm text-gray-600">
              {t("delete_confirm", { name: user.fullName })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("btn_cancel")}</button>
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
