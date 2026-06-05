"use client";

import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { formatCurrency } from "@/lib/i18nFormat";
import {
  useGetAdminBooksQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  usePublishBookMutation,
  useUnpublishBookMutation,
  type AdminBookListItem,
  type BookUpsertPayload,
} from "@/lib/features/admin/adminBooksApi";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  Draft:     "bg-gray-100 text-gray-600",
  Published: "bg-green-100 text-green-700",
  Hidden:    "bg-yellow-100 text-yellow-700",
  Archived:  "bg-red-100 text-red-600",
};

const TYPE_BADGE: Record<string, string> = {
  Ebook:    "bg-blue-100 text-blue-700",
  Physical: "bg-orange-100 text-orange-700",
  Combo:    "bg-purple-100 text-purple-700",
};

const EMPTY_FORM: BookUpsertPayload = {
  title: "", type: "Ebook", price: 0,
  description: "", shortDescription: "", author: "", publisher: "", isbn: "",
  coverColor: "#1a3a5c", coverEmoji: "📚", coverUrl: "",
  categoryId: null, level: "", tags: "",
  discountPrice: null, discountEndsAt: null,
  pageCount: null, fileUrl: "", fileSizeMb: null, sampleUrl: "",
  isFeatured: false, sortOrder: 0,
};

type Modal = "none" | "create" | "edit" | "delete";

function fmt(v: number) {
  return formatCurrency(v);
}

export default function AdminBooksPage() {
  const t = useTranslations("admin_books");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState<Modal>("none");
  const [target, setTarget] = useState<AdminBookListItem | null>(null);
  const [form, setForm] = useState<BookUpsertPayload>(EMPTY_FORM);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const token = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview,  setCoverPreview]  = useState("");
  const [coverUploading,  setCoverUploading]  = useState(false);
  const [fileUploading,   setFileUploading]   = useState(false);
  const [sampleUploading, setSampleUploading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

  const uploadCover = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/cms/upload-thumbnail`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
        },
        body: fd,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } catch { return null; }
  };

  const uploadBookFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/books/upload-file`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
        },
        body: fd,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } catch { return null; }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    uploadCover(file).then((url) => {
      setCoverUploading(false);
      if (url) setForm(f => ({ ...f, coverUrl: url }));
      else { setCoverPreview(""); setMsg({ type: "error", text: t("toast_cover_fail") }); }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    uploadBookFile(file).then((url) => {
      setFileUploading(false);
      if (url) setForm(f => ({ ...f, fileUrl: url }));
      else setMsg({ type: "error", text: t("toast_ebook_fail") });
    });
  };

  const handleSampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSampleUploading(true);
    uploadBookFile(file).then((url) => {
      setSampleUploading(false);
      if (url) setForm(f => ({ ...f, sampleUrl: url }));
      else setMsg({ type: "error", text: t("toast_sample_fail") });
    });
  };

  const { data, isLoading, isError } = useGetAdminBooksQuery({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const [createBook, { isLoading: isCreating }] = useCreateBookMutation();
  const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();
  const [deleteBook, { isLoading: isDeleting }] = useDeleteBookMutation();
  const [publishBook] = usePublishBookMutation();
  const [unpublishBook] = useUnpublishBookMutation();

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit = (b: AdminBookListItem) => {
    setTarget(b);
    setForm({
      title: b.title, type: b.type, price: b.price,
      discountPrice: b.discountPrice, coverColor: b.coverColor,
      coverEmoji: b.coverEmoji, coverUrl: b.coverUrl ?? "",
      author: b.author ?? "", isFeatured: b.isFeatured,
      description: null, shortDescription: null, publisher: null, isbn: null,
      categoryId: null, level: null, tags: null,
      discountEndsAt: null, pageCount: null, fileUrl: null, fileSizeMb: null,
      sampleUrl: null, sortOrder: 0,
    });
    setModal("edit");
  };
  const openDelete = (b: AdminBookListItem) => { setTarget(b); setModal("delete"); };
  const close = () => { setModal("none"); setTarget(null); setMsg(null); };

  const handleCreate = async () => {
    try {
      await createBook(form).unwrap();
      setMsg({ type: "success", text: t("toast_create_ok") });
      setTimeout(close, 1200);
    } catch { setMsg({ type: "error", text: t("toast_create_fail") }); }
  };

  const handleUpdate = async () => {
    if (!target) return;
    try {
      await updateBook({ id: target.id, ...form }).unwrap();
      setMsg({ type: "success", text: t("toast_update_ok") });
      setTimeout(close, 1200);
    } catch { setMsg({ type: "error", text: t("toast_update_fail") }); }
  };

  const handleDelete = async () => {
    if (!target) return;
    try {
      await deleteBook(target.id).unwrap();
      setMsg({ type: "success", text: t("toast_delete_ok") });
      setTimeout(close, 1000);
    } catch { setMsg({ type: "error", text: t("toast_delete_fail") }); }
  };

  const handleTogglePublish = async (b: AdminBookListItem) => {
    try {
      if (b.status === "Published") await unpublishBook(b.id).unwrap();
      else await publishBook(b.id).unwrap();
    } catch { /* ignore */ }
  };

  const inp = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500";

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? t("count", { n: data.total }) : t("loading")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <span>＋</span> {t("add")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search_ph")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-500"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
          <option value="">{t("all_statuses")}</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Hidden">Hidden</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
          <option value="">{t("all_types")}</option>
          <option value="Ebook">Ebook</option>
          <option value="Physical">Physical</option>
          <option value="Combo">Combo</option>
        </select>
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_book")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_type")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_status")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("col_price")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("col_sold")}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-12 rounded flex items-center justify-center text-xl shrink-0"
                          style={{ background: b.coverColor }}>
                          {b.coverUrl ? (
                            <img src={b.coverUrl} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <span>{b.coverEmoji}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">{b.title}</div>
                          <div className="text-xs text-gray-400">{b.author ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[b.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {fmt(b.price)}
                      {b.discountPrice && (
                        <div className="text-xs text-red-500">{fmt(b.discountPrice)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{b.purchaseCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleTogglePublish(b)}
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                            b.status === "Published"
                              ? "border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-100"
                              : "border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"
                          }`}>
                          {b.status === "Published" ? t("btn_hide") : t("btn_publish")}
                        </button>
                        <button onClick={() => openEdit(b)}
                          className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100">
                          {t("btn_edit")}
                        </button>
                        <button onClick={() => openDelete(b)}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100">
                          {t("btn_delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">{t("empty")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > PAGE_SIZE && (
            <div className="mt-4">
              <AdminPagination
                page={page}
                totalPages={Math.ceil(data.total / PAGE_SIZE)}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {modal === "create" ? t("modal_add_title") : t("modal_edit_title")}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_title")}</label>
                <input className={inp} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_type")}</label>
                <select className={inp} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Ebook">Ebook</option>
                  <option value="Physical">Physical</option>
                  <option value="Combo">Combo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_price")}</label>
                <input type="number" className={inp} value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_discount")}</label>
                <input type="number" className={inp} value={form.discountPrice ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, discountPrice: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_author")}</label>
                <input className={inp} value={form.author ?? ""} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_cover_emoji")}</label>
                <input className={inp} value={form.coverEmoji ?? "📚"} onChange={(e) => setForm(f => ({ ...f, coverEmoji: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_cover_color")}</label>
                <input type="color" className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer"
                  value={form.coverColor ?? "#1a3a5c"} onChange={(e) => setForm(f => ({ ...f, coverColor: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_cover_url")}</label>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                  style={{ height: 96 }}
                >
                  {(coverPreview || form.coverUrl) ? (
                    <img src={coverPreview || form.coverUrl || ""} alt="cover" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                      <span className="text-2xl">🖼️</span>
                      <span className="text-xs">{t("cover_ph")}</span>
                    </div>
                  )}
                </div>
                {coverUploading && <p className="mt-1 text-xs text-indigo-500">{t("uploading")}</p>}
                {(coverPreview || form.coverUrl) && !coverUploading && (
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="text-xs text-indigo-600 hover:underline">{t("btn_change_cover")}</button>
                    <button type="button" onClick={() => { setCoverPreview(""); setForm(f => ({ ...f, coverUrl: "" })); }} className="text-xs text-red-500 hover:underline">{t("btn_remove")}</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">File URL (ebook)</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.epub,.mobi,.azw3" className="hidden" onChange={handleFileChange} />
                {form.fileUrl ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700 flex-1 truncate">{form.fileUrl.split("/").pop() || form.fileUrl}</span>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-600 hover:underline shrink-0">{t("btn_change")}</button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, fileUrl: "" }))} className="text-xs text-red-500 hover:underline shrink-0">{t("btn_remove")}</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-center">
                    {fileUploading ? t("uploading") : t("ebook_file")}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sample URL</label>
                <input ref={sampleInputRef} type="file" accept=".pdf,.epub" className="hidden" onChange={handleSampleChange} />
                {form.sampleUrl ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700 flex-1 truncate">{form.sampleUrl.split("/").pop() || form.sampleUrl}</span>
                    <button type="button" onClick={() => sampleInputRef.current?.click()} className="text-xs text-indigo-600 hover:underline shrink-0">{t("btn_change")}</button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, sampleUrl: "" }))} className="text-xs text-red-500 hover:underline shrink-0">{t("btn_remove")}</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => sampleInputRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-center">
                    {sampleUploading ? t("uploading") : t("sample_file")}
                  </button>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_short_desc")}</label>
                <textarea rows={2} className={inp} value={form.shortDescription ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value || null }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_description")}</label>
                <textarea rows={3} className={inp} value={form.description ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value || null }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.isFeatured}
                  onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                <label htmlFor="featured" className="text-sm text-gray-700">{t("field_featured")}</label>
              </div>
            </div>
            {msg && (
              <div className={`mx-6 mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={close} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={modal === "create" ? handleCreate : handleUpdate}
                disabled={isCreating || isUpdating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
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
            <p className="text-sm text-gray-500 mb-6">
              {t.rich("delete_confirm", { title: target.title, strong: (chunks) => <strong>{chunks}</strong> })}
            </p>
            {msg && (
              <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={close} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Huỷ
              </button>
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
