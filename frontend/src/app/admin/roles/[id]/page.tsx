"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useGetRoleDetailQuery,
  useUpdateRolePermissionsMutation,
  useUpdateRoleMutation,
} from "@/lib/features/admin/adminApi";

type PermissionLeaf = { key: string; label: string };
type PermissionGroup = { key: string; label: string; children: PermissionLeaf[] };

const PERMISSION_TREE: PermissionGroup[] = [
  {
    key: "workspace",
    label: "Bàn làm việc",
    children: [
      { key: "workspace.personal", label: "Bàn làm việc cá nhân" },
      { key: "workspace.team",     label: "Bàn làm việc đội ngũ" },
    ],
  },
  {
    key: "users",
    label: "Người dùng",
    children: [
      { key: "users.view",   label: "Xem danh sách người dùng" },
      { key: "users.create", label: "Tạo người dùng" },
      { key: "users.edit",   label: "Chỉnh sửa người dùng" },
      { key: "users.delete", label: "Xóa người dùng" },
    ],
  },
  {
    key: "roles",
    label: "Vai trò & Phân quyền",
    children: [
      { key: "roles.view", label: "Xem vai trò" },
      { key: "roles.edit", label: "Chỉnh sửa vai trò" },
    ],
  },
  {
    key: "courses",
    label: "Khóa học",
    children: [
      { key: "courses.view",    label: "Xem khóa học" },
      { key: "courses.create",  label: "Tạo khóa học" },
      { key: "courses.edit",    label: "Chỉnh sửa khóa học" },
      { key: "courses.delete",  label: "Xóa khóa học" },
      { key: "courses.publish", label: "Xuất bản khóa học" },
    ],
  },
  {
    key: "enrollments",
    label: "Đăng ký học",
    children: [
      { key: "enrollments.view",   label: "Xem đăng ký" },
      { key: "enrollments.manage", label: "Quản lý đăng ký" },
    ],
  },
  {
    key: "quizzes",
    label: "Bài kiểm tra",
    children: [
      { key: "quizzes.view",   label: "Xem bài kiểm tra" },
      { key: "quizzes.create", label: "Tạo bài kiểm tra" },
      { key: "quizzes.edit",   label: "Chỉnh sửa bài kiểm tra" },
    ],
  },
  {
    key: "reports",
    label: "Báo cáo",
    children: [
      { key: "reports.view",   label: "Xem báo cáo" },
      { key: "reports.export", label: "Xuất báo cáo (Export)" },
    ],
  },
  {
    key: "files",
    label: "Tệp tin",
    children: [
      { key: "files.view",     label: "Xem tệp tin" },
      { key: "files.upload",   label: "Tải lên tệp tin" },
      { key: "files.download", label: "Tải xuống tệp tin" },
    ],
  },
  {
    key: "settings",
    label: "Cài đặt hệ thống",
    children: [
      { key: "settings.view", label: "Xem cài đặt" },
      { key: "settings.edit", label: "Chỉnh sửa cài đặt" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_TREE.flatMap((g) => g.children.map((c) => c.key));

// ─── Group header row with indeterminate checkbox ────────────────────────────
function GroupRow({
  group,
  selected,
  onToggleGroup,
  disabled,
  collapsed,
  onToggleCollapse,
}: {
  group: PermissionGroup;
  selected: Set<string>;
  onToggleGroup: (keys: string[], allChecked: boolean) => void;
  disabled: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const t = useTranslations("admin_role_detail");
  const keys = group.children.map((c) => c.key);
  const checkedCount = keys.filter((k) => selected.has(k)).length;
  const allChecked = checkedCount === keys.length;
  const someChecked = checkedCount > 0 && !allChecked;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someChecked;
  }, [someChecked]);

  return (
    <div className="flex items-center gap-2 bg-[#e8f1fa] border-b border-blue-100 px-3 py-2.5 select-none">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex h-5 w-5 items-center justify-center text-blue-600 hover:text-blue-800 flex-shrink-0"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <input
        ref={ref}
        type="checkbox"
        checked={disabled || allChecked}
        onChange={() => !disabled && onToggleGroup(keys, allChecked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
      />
      <span className="text-sm font-semibold text-blue-900">{t(`g_${group.key}` as 'g_workspace')}</span>
      <span className="ml-auto text-xs text-blue-500 font-medium tabular-nums">
        {disabled ? keys.length : checkedCount}/{keys.length}
      </span>
    </div>
  );
}

export default function AdminRoleDetailPage() {
  const t = useTranslations("admin_role_detail");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: role, isLoading, isError } = useGetRoleDetailQuery(params.id);
  const [updatePermissions, { isLoading: isSaving }] = useUpdateRolePermissionsMutation();
  const [updateRole, { isLoading: isUpdatingInfo }] = useUpdateRoleMutation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editInfo, setEditInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (role) setSelected(new Set(role.permissions));
  }, [role]);

  function startEditInfo() {
    setEditName(role?.name ?? "");
    setEditDesc(role?.description ?? "");
    setEditInfo(true);
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateRole({ roleId: params.id, name: editName, description: editDesc || undefined }).unwrap();
      setMsg({ type: "success", text: t("toast_info_ok") });
      setEditInfo(false);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setMsg({ type: "error", text: apiErr?.data?.error ?? t("toast_info_fail") });
    }
  }

  function toggle(perm: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  }

  function toggleGroup(keys: string[], allChecked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  }

  function toggleCollapse(groupKey: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  async function handleSave() {
    setMsg(null);
    try {
      await updatePermissions({ roleId: params.id, permissions: Array.from(selected) }).unwrap();
      setMsg({ type: "success", text: t("toast_perm_ok") });
    } catch {
      setMsg({ type: "error", text: t("toast_perm_fail") });
    }
  }

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (isError || !role) {
    return (
      <div>
        <p className="text-red-600">{t("not_found")}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-indigo-600">{t("back")}</button>
      </div>
    );
  }

  const isSuperAdmin = role.name === "SuperAdmin";
  const totalSelected = isSuperAdmin ? ALL_PERMISSIONS.length : selected.size;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
            {t("back")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("title", { name: role.name })}
          </h1>
        </div>
        {!isSuperAdmin && !editInfo && (
          <button
            onClick={startEditInfo}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("btn_edit_info")}
          </button>
        )}
      </div>

      {editInfo && (
        <form onSubmit={handleSaveInfo} className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-4">
          <h3 className="font-semibold text-indigo-900">{t("edit_title")}</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("f_name")}</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("f_desc")}</label>
            <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
              placeholder={t("f_desc_ph")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditInfo(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white">{t("btn_cancel")}</button>
            <button type="submit" disabled={isUpdatingInfo}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {isUpdatingInfo ? t("btn_saving") : t("btn_save")}
            </button>
          </div>
        </form>
      )}

      {isSuperAdmin && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          {t("super_note")}
        </div>
      )}

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 font-bold">×</button>
        </div>
      )}

      {/* ─── Permissions tree ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">
            {t("selected_count")}{" "}
            <span className="font-semibold text-gray-900">{totalSelected}</span>
            <span className="text-gray-400"> / {ALL_PERMISSIONS.length}</span>
            {" "}{t("perm_word")}
          </p>
          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setCollapsed(new Set(PERMISSION_TREE.map((g) => g.key)))}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {t("btn_collapse")}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setCollapsed(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {t("btn_expand")}
                </button>
                <span className="text-gray-300 ml-1">|</span>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? t("btn_saving") : t("btn_save_changes")}
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          {PERMISSION_TREE.map((group) => (
            <div key={group.key} className="border-b border-gray-100 last:border-0">
              <GroupRow
                group={group}
                selected={selected}
                onToggleGroup={toggleGroup}
                disabled={isSuperAdmin}
                collapsed={collapsed.has(group.key)}
                onToggleCollapse={() => toggleCollapse(group.key)}
              />
              {!collapsed.has(group.key) && (
                <div>
                  {group.children.map((leaf, idx) => (
                    <label
                      key={leaf.key}
                      className={`flex items-center gap-3 pl-10 pr-4 py-2 text-sm cursor-pointer transition-colors ${
                        idx < group.children.length - 1 ? "border-b border-gray-50" : ""
                      } ${
                        isSuperAdmin
                          ? "bg-gray-50 opacity-70 cursor-default"
                          : selected.has(leaf.key)
                          ? "bg-blue-50/60 hover:bg-blue-50"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSuperAdmin || selected.has(leaf.key)}
                        onChange={() => !isSuperAdmin && toggle(leaf.key)}
                        disabled={isSuperAdmin}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="flex-1 text-gray-700">{t(`p_${leaf.key.replace(".", "_")}` as 'p_users_view')}</span>
                      <span className="text-xs text-gray-300 font-mono">{leaf.key}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
