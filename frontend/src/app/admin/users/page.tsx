"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatDate } from "@/lib/i18nFormat";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { AdminProfileEditModal } from "@/app/admin/_components/AdminProfileEditModal";
import {
  useGetUsersQuery,
  useInviteUserMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  type AdminUserListItem,
} from "@/lib/features/admin/adminApi";

const PAGE_SIZE = 20;

const ROLES = ["Student", "Teacher", "ContentManager", "Support", "Admin"];
type Modal = "none" | "invite" | "create" | "delete" | "editProfile";

interface ProfileTarget {
  id: string;
  role: string;
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function AdminUsersPage() {
  const t = useTranslations("admin_users");
  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    Active: { label: t("status_active"), className: "bg-green-100 text-green-700" },
    Inactive: { label: t("status_inactive"), className: "bg-gray-100 text-gray-600" },
    Suspended: { label: t("status_locked"), className: "bg-red-100 text-red-700" },
    PendingVerification: { label: t("status_pending"), className: "bg-yellow-100 text-yellow-700" },
  };
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modal, setModal] = useState<Modal>("none");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Student");

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRole, setCreateRole] = useState("Student");

  const [editTarget, setEditTarget] = useState<ProfileTarget | null>(null);

  const { data, isLoading, isError } = useGetUsersQuery({
    page,
    pageSize: PAGE_SIZE,
    search,
    role: roleFilter,
    status: statusFilter,
  });
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  function closeModal() {
    setModal("none");
    setDeleteTarget(null);
    setEditTarget(null);
    setInviteEmail("");
    setInviteRole("Student");
    setCreateEmail("");
    setCreatePassword("");
    setCreateName("");
    setCreatePhone("");
    setCreateRole("Student");
  }

  function openEditProfile(user: AdminUserListItem) {
    setEditTarget({ id: user.id, role: user.role });
    setModal("editProfile");
    setMsg(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await inviteUser({ email: inviteEmail, roleName: inviteRole }).unwrap();
      setMsg({ type: "success", text: t("toast_invite_ok") });
      closeModal();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_invite_fail") });
      closeModal();
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser({
        email: createEmail,
        password: createPassword,
        fullName: createName,
        phone: createPhone || undefined,
        roleName: createRole,
      }).unwrap();
      setMsg({ type: "success", text: t("toast_create_ok") });
      closeModal();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_create_fail") });
      closeModal();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id).unwrap();
      setMsg({ type: "success", text: t("toast_delete_ok", { name: deleteTarget.name }) });
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_delete_fail") });
    }
    closeModal();
  }

  async function handleEditProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await updateUser({
        userId: editTarget.id,
        fullName: editName,
        phone: editPhone || undefined,
      }).unwrap();
      setMsg({ type: "success", text: t("toast_update_ok") });
      closeModal();
    } catch {
      setMsg({ type: "error", text: t("toast_update_fail") });
    }
  }

  async function handleAvatarUpload(file: File): Promise<string> {
    if (!editTarget) throw new Error("No target");
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatar({ userId: editTarget.id, formData: fd }).unwrap();
    setEditAvatarUrl(res.avatarUrl);
    return res.avatarUrl;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? t("count", { n: data.totalCount }) : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setModal("invite"); setMsg(null); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("send_invite")}
          </button>
          <button
            onClick={() => { setModal("create"); setMsg(null); }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {t("create_user")}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 font-bold">x</button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t("search_ph")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">{t("all_roles")}</option>
          <option value="SuperAdmin">SuperAdmin</option>
          <option value="Admin">Admin</option>
          <option value="Teacher">Teacher</option>
          <option value="ContentManager">ContentManager</option>
          <option value="Support">Support</option>
          <option value="Student">Student</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">{t("all_statuses")}</option>
          <option value="Active">{t("status_active")}</option>
          <option value="Inactive">{t("status_inactive")}</option>
          <option value="Suspended">{t("status_locked")}</option>
          <option value="PendingVerification">{t("status_pending")}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading && (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse border-b border-gray-100 bg-gray-50" />
            ))}
          </div>
        )}
        {isError && (
          <p className="p-6 text-sm text-red-600">{t("load_error")}</p>
        )}
        {data && (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("col_user")}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("col_role")}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("col_status")}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("col_created")}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_LABELS[user.status]?.className ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[user.status]?.label ?? user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Xem */}
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {t("btn_view")}
                      </Link>
                      {/* Sửa → navigate tới trang detail ở edit mode */}
                      <Link
                        href={`/admin/users/${user.id}?edit=1`}
                        className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100"
                      >
                        <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t("btn_edit")}
                      </Link>
                      {/* Cập nhật Profile */}
                      <button
                        type="button"
                        onClick={() => openEditProfile(user)}
                        className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                      >
                        <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Profile
                      </button>
                      {/* Xóa */}
                      {user.role !== "SuperAdmin" && (
                        <button
                          type="button"
                          onClick={() => { setDeleteTarget({ id: user.id, name: user.fullName }); setModal("delete"); setMsg(null); }}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100"
                        >
                          <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t("btn_delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && (
        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {modal === "editProfile" && editTarget && (
        <AdminProfileEditModal
          userId={editTarget.id}
          userRole={editTarget.role}
          onClose={closeModal}
          onSaved={() => setMsg({ type: "success", text: t("toast_update_ok") })}
        />
      )}

      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{t("modal_create_title")}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_fullname")}</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="Nguyễn Văn A" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_email")}</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required placeholder="user@example.com" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_password")}</label>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={8} placeholder={t("password_ph")} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_phone")}</label>
                <input type="tel" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="0901234567" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_role")}</label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className={inputCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isCreating} className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {isCreating ? t("btn_creating") : t("btn_create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "invite" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{t("modal_invite_title")}</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_email")}</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="user@example.com" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_role")}</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={inputCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isInviting} className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {isInviting ? t("btn_sending") : t("btn_send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "delete" && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-gray-900">{t("modal_delete_title")}</h2>
            <p className="mb-5 text-sm text-gray-500">
              {t("delete_confirm", { name: deleteTarget.name })}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? t("btn_deleting") : t("btn_delete_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
