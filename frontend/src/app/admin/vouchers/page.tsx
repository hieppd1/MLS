"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18nFormat";
import {
  useGetAdminVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useToggleVoucherStatusMutation,
  type VoucherDto,
  type VoucherUpsertPayload,
} from "@/lib/features/admin/adminVouchersApi";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  Active:   "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
  Expired:  "bg-red-100 text-red-600",
};

const EMPTY_FORM: VoucherUpsertPayload & { code: string } = {
  code: "", type: "Percentage", value: 10,
  description: "", minOrderAmount: null, maxDiscountAmount: null,
  usageLimit: null, startsAt: null, expiresAt: null, isPublic: true,
};

type Modal = "none" | "create" | "edit" | "delete";

function fmt(v: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v); }

export default function AdminVouchersPage() {
  const t = useTranslations("admin_vouchers");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<Modal>("none");
  const [target, setTarget] = useState<VoucherDto | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, isError } = useGetAdminVouchersQuery({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] = useDeleteVoucherMutation();
  const [toggleStatus] = useToggleVoucherStatusMutation();

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit = (v: VoucherDto) => {
    setTarget(v);
    setForm({
      code: v.code, type: v.type, value: v.value, description: v.description ?? "",
      minOrderAmount: v.minOrderAmount, maxDiscountAmount: v.maxDiscountAmount,
      usageLimit: v.usageLimit,
      startsAt: v.startsAt ? v.startsAt.slice(0, 16) : null,
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 16) : null,
      isPublic: v.isPublic,
    });
    setModal("edit");
  };
  const openDelete = (v: VoucherDto) => { setTarget(v); setModal("delete"); };
  const close = () => { setModal("none"); setTarget(null); setMsg(null); };

  const handleCreate = async () => {
    try {
      await createVoucher(form).unwrap();
      setMsg({ type: "success", text: t("toast_create_ok") });
      setTimeout(close, 1200);
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      setMsg({ type: "error", text: err?.data?.message ?? t("toast_create_fail") });
    }
  };

  const handleUpdate = async () => {
    if (!target) return;
    try {
      await updateVoucher({ id: target.id, ...form }).unwrap();
      setMsg({ type: "success", text: t("toast_update_ok") });
      setTimeout(close, 1200);
    } catch { setMsg({ type: "error", text: t("toast_update_fail") }); }
  };

  const handleDelete = async () => {
    if (!target) return;
    try {
      await deleteVoucher(target.id).unwrap();
      setMsg({ type: "success", text: t("toast_delete_ok") });
      setTimeout(close, 1000);
    } catch { setMsg({ type: "error", text: t("toast_delete_fail") }); }
  };

  const handleToggle = async (v: VoucherDto) => {
    await toggleStatus({ id: v.id, activate: v.status !== "Active" }).unwrap().catch(() => {});
  };

  const inp = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500";

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? t("count", { n: data.total }) : t("loading")}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          {t("add")}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search_ph")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-56 focus:outline-none focus:border-indigo-500" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
          <option value="">{t("all_statuses")}</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{t("loading")}</div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">{t("load_error")}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_code")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_discount")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_condition")}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{t("col_used")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_expires")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_status")}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-gray-900">{v.code}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{v.description ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {v.type === "Percentage" ? `${v.value}%` : fmt(v.value)}
                      {v.maxDiscountAmount && (
                        <div className="text-xs text-gray-400">{t("max_discount", { n: fmt(v.maxDiscountAmount) })}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {v.minOrderAmount ? t("min_order", { n: fmt(v.minOrderAmount) }) : t("no_limit")}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {v.usageCount}{v.usageLimit ? `/${v.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {v.expiresAt ? formatDate(v.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[v.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleToggle(v)}
                          className={`rounded px-2 py-1 text-xs font-medium ${v.status === "Active" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                          {v.status === "Active" ? t("btn_disable") : t("btn_enable")}
                        </button>
                        <button onClick={() => openEdit(v)}
                          className="rounded px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                          {t("btn_edit")}
                        </button>
                        <button onClick={() => openDelete(v)}
                          className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">
                          {t("btn_delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t("empty")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > PAGE_SIZE && (
            <div className="mt-4">
              <AdminPagination page={page} totalPages={Math.ceil(data.total / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{modal === "create" ? t("modal_add_title") : t("modal_edit_title")}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {modal === "create" && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_code")}</label>
                  <input className={inp} value={form.code ?? ""} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_type")}</label>
                <select className={inp} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Percentage">{t("type_percent")}</option>
                  <option value="FixedAmount">{t("type_fixed")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_value")}</label>
                <input type="number" className={inp} value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_min_order")}</label>
                <input type="number" className={inp} value={form.minOrderAmount ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_max_discount")}</label>
                <input type="number" className={inp} value={form.maxDiscountAmount ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, maxDiscountAmount: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_usage_limit")}</label>
                <input type="number" className={inp} value={form.usageLimit ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_expires")}</label>
                <input type="datetime-local" className={inp} value={form.expiresAt ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value || null }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_description")}</label>
                <input className={inp} value={form.description ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value || null }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isPublic" checked={form.isPublic}
                  onChange={(e) => setForm(f => ({ ...f, isPublic: e.target.checked }))} />
                <label htmlFor="isPublic" className="text-sm text-gray-700">{t("field_public")}</label>
              </div>
            </div>
            {msg && (
              <div className={`mx-6 mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={close} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button onClick={modal === "create" ? handleCreate : handleUpdate}
                disabled={isCreating || isUpdating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {isCreating || isUpdating ? t("btn_saving") : t("btn_save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">{t("modal_delete_title")}</h2>
            <p className="text-sm text-gray-500 mb-6">{t("delete_confirm", { code: target.code })}</p>
            {msg && (
              <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={close} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? t("btn_deleting") : t("btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
