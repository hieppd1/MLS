"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import dynamic from "next/dynamic";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import {
  useGetCoursesQuery,
  useCreateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useCloneCourseMutation,
  type CourseListItem,
} from "@/lib/features/cms/cmsApi";
import { formatCurrency } from "@/lib/i18nFormat";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const LEVEL_VALUES = [1, 2, 3, 4, 5, 6] as const;

type Modal = "none" | "create" | "delete";

export default function AdminCoursesPage() {
  const t = useTranslations("admin_courses");
  const tLevels = useTranslations("level_labels");
  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    Draft: { label: t("status_draft"), className: "bg-gray-100 text-gray-600" },
    PendingReview: { label: t("status_pending"), className: "bg-yellow-100 text-yellow-700" },
    Published: { label: t("status_published"), className: "bg-green-100 text-green-700" },
    Hidden: { label: t("status_hidden"), className: "bg-orange-100 text-orange-600" },
    Archived: { label: t("status_archived"), className: "bg-red-100 text-red-600" },
  };
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<Modal>("none");
  const [deleteTarget, setDeleteTarget] = useState<CourseListItem | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const token = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

  const uploadThumb = async (file: File): Promise<string | null> => {
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

  // Create form
  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "",
    level: 1, price: 0, discountPrice: "", isFree: false,
    certificateEnabled: false, completionRequired: false,
    visibility: "Public", language: "VI", code: "", thumbnailUrl: "", tags: "",
  });

  const { data, isFetching, refetch } = useGetCoursesQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    level: levelFilter,
    status: statusFilter || undefined,
  });

  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [deleteCourse, { isLoading: deleting }] = useDeleteCourseMutation();
  const [publishCourse] = usePublishCourseMutation();
  const [cloneCourse] = useCloneCourseMutation();

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourse({
        title: form.title, description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        level: form.level, price: form.isFree ? 0 : form.price,
        discountPrice: form.discountPrice !== "" ? Number(form.discountPrice) : undefined,
        isFree: form.isFree, certificateEnabled: form.certificateEnabled,
        completionRequired: form.completionRequired,
        visibility: form.visibility,
        language: form.language,
        code: form.code || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        tags: form.tags || undefined,
      }).unwrap();
      setModal("none");
      setForm({ title: "", description: "", shortDescription: "", level: 1, price: 0, discountPrice: "", isFree: false, certificateEnabled: false, completionRequired: false, visibility: "Public", language: "VI", code: "", thumbnailUrl: "", tags: "" });
      showMsg("success", t("toast_create_ok"));
    } catch {
      showMsg("error", t("toast_create_fail"));
    }
  };

  const handleClone = async (id: string) => {
    try {
      const res = await cloneCourse(id).unwrap();
      showMsg("success", t("toast_clone_ok"));
    } catch {
      showMsg("error", t("toast_clone_fail"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id).unwrap();
      setModal("none");
      setDeleteTarget(null);
      showMsg("success", t("toast_delete_ok"));
    } catch {
      showMsg("error", t("toast_delete_fail"));
    }
  };

  const handlePublish = async (id: string, approve: boolean) => {
    try {
      await publishCourse({ id, approve }).unwrap();
      showMsg("success", approve ? t("toast_publish_ok") : t("toast_reject_ok"));
    } catch {
      showMsg("error", t("toast_action_fail"));
    }
  };

  const courses = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("count", { n: total })}</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t("create")}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search_ph")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">
            Tìm
          </button>
        </form>

        <select
          value={levelFilter ?? ""}
          onChange={(e) => { setLevelFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t("all_levels")}</option>
          {LEVEL_VALUES.map((v) => (
            <option key={v} value={v}>{tLevels(String(v))}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t("all_statuses")}</option>
          <option value="Draft">{t("status_draft")}</option>
          <option value="PendingReview">{t("status_pending")}</option>
          <option value="Published">{t("status_published")}</option>
          <option value="Archived">{t("status_archived")}</option>
        </select>
      </div>

      {/* Cards */}
      {isFetching ? (
        <div className="py-16 text-center text-gray-400">{t("loading")}</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {courses.map((course) => {
            const s = STATUS_LABELS[course.status] ?? { label: course.status, className: "bg-gray-100 text-gray-600" };
            const plainDesc = course.description
              ? course.description.replace(/<[^>]*>/g, "").trim()
              : course.shortDescription ?? "";
            const isActive = course.status === "Published";
            return (
              <div
                key={course.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* ── Header ── */}
                <div className="flex items-start gap-3 p-4 pb-3">
                  {/* Icon */}
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" }}
                  >
                    📚
                  </div>

                  {/* Title + tags */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="block truncate font-semibold text-gray-900 hover:text-blue-600"
                      style={{ fontSize: 15 }}
                    >
                      {course.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                        Cấp {course.level}
                      </span>
                      {course.isFree && (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>
                          {t("tag_free")}
                        </span>
                      )}
                      {course.certificateEnabled && (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {t("tag_cert")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status icon top-right */}
                  {isActive ? (
                    <span className="flex-shrink-0 text-green-500" style={{ fontSize: 20 }}>✅</span>
                  ) : (
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
                      {s.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                {plainDesc && (
                  <p
                    className="truncate px-4 pb-3 text-xs leading-relaxed"
                    style={{ color: "#f59e0b" }}
                  >
                    {plainDesc}
                  </p>
                )}

                {/* ── Metadata rows ── */}
                <div className="mx-4 border-t border-gray-100" />
                <div className="space-y-2.5 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Modules</span>
                    <span className="font-semibold text-gray-800">{course.moduleCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#f59e0b" }}>{t("col_students")}</span>
                    <span className="font-semibold text-gray-800">{course.enrollmentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("col_price")}</span>
                    <span>
                      {course.isFree || course.price === 0 ? (
                        <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600">FREE</span>
                      ) : course.discountPrice != null ? (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold" style={{ color: "#e53e3e" }}>{formatCurrency(course.discountPrice)}</span>
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(course.price)}</span>
                        </span>
                      ) : (
                        <span className="font-semibold" style={{ color: "#e53e3e" }}>{formatCurrency(course.price)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    {isActive ? (
                      <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>Active</span>
                    ) : (
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>
                    )}
                  </div>
                </div>

                {/* ── Action bar ── */}
                <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
                  {/* Main wide button */}
                  {course.status === "Draft" ? (
                    <button
                      onClick={() => handlePublish(course.id, true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {t("btn_publish")}
                    </button>
                  ) : course.status === "PendingReview" ? (
                    <button
                      onClick={() => handlePublish(course.id, true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {t("btn_approve")}
                    </button>
                  ) : course.status === "Published" ? (
                    <button
                      onClick={() => handlePublish(course.id, false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClone(course.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Clone
                    </button>
                  )}

                  {/* Settings icon button */}
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    title="Cài đặt"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </Link>

                  {/* View icon button */}
                  <button
                    onClick={() => { setDeleteTarget(course); setModal("delete"); }}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                    title={t("btn_delete")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalCount={total}
          pageSize={20}
          onPageChange={setPage}
        />
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl flex flex-col" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t("modal_create_title")}</h2>
              <button type="button" onClick={() => setModal("none")} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
            <form id="create-course-form" onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_title")}</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("title_ph")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_short_desc")}</label>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("short_desc_ph")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_description")}</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Nhập mô tả khóa học..."
                  height={220}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_level")}</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEVEL_VALUES.map((v) => (
                      <option key={v} value={v}>{tLevels(String(v))}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_language")}</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="VI">🇻🇳 Tiếng Việt</option>
                    <option value="EN">🇬🇧 English</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_code")}</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: VN-BASIC-01"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_thumbnail")}</label>
                <input
                  ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setThumbPreview(URL.createObjectURL(file));
                    setThumbUploading(true);
                    uploadThumb(file).then((url) => {
                      setThumbUploading(false);
                      if (url) setForm({ ...form, thumbnailUrl: url });
                      else { setThumbPreview(""); showMsg("error", "Upload ảnh thất bại"); }
                    });
                  }}
                />
                <div
                  onClick={() => thumbInputRef.current?.click()}
                  className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  style={{ height: 90, maxWidth: 160 }}
                >
                  {(thumbPreview || form.thumbnailUrl) ? (
                    <img src={thumbPreview || form.thumbnailUrl} alt="thumb" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                      <span className="text-2xl">🖼️</span>
                      <span className="text-xs">{t("upload_click")}</span>
                    </div>
                  )}
                </div>
                {thumbUploading && <p className="mt-1 text-xs text-blue-500">{t("uploading")}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_tags")}</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IELTS, English, Beginner"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_price")}</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("price_ph")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_discount")}</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder={t("discount_ph")}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} />
                  {t("field_free")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.certificateEnabled} onChange={(e) => setForm({ ...form, certificateEnabled: e.target.checked })} />
                  {t("field_certificate")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.completionRequired} onChange={(e) => setForm({ ...form, completionRequired: e.target.checked })} />
                  {t("field_required_complete")}
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_visible")}</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Public">{t("visibility_public")}</option>
                  <option value="Private">{t("visibility_private")}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal("none")}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {creating ? t("btn_creating") : t("btn_create")}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold">Xóa khóa học</h2>
            <p className="mb-4 text-sm text-gray-600">
              Bạn có chắc muốn xóa khóa học <strong>{deleteTarget.title}</strong>? Toàn bộ modules và bài học sẽ bị xóa.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setModal("none"); setDeleteTarget(null); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
