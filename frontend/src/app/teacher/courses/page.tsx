"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import dynamic from "next/dynamic";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useCloneCourseMutation,
} from "@/lib/features/cms/cmsApi";
import {
  useGetMyCoursesQuery,
  type MyTeacherCourseItem,
} from "@/lib/features/teacher/teacherApi";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });


const LEVEL_VALUES = [1, 2, 3, 4, 5, 6] as const;

type Modal = "none" | "create" | "delete";

const INIT_FORM = {
  title: "", description: "", shortDescription: "",
  level: 1, price: 0, discountPrice: "" as string | number, isFree: false,
  certificateEnabled: false, completionRequired: false,
  visibility: "Public", language: "VI", code: "", thumbnailUrl: "", tags: "",
};

export default function TeacherCoursesPage() {
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal]             = useState<Modal>("none");
  const [deleteTarget, setDeleteTarget] = useState<MyTeacherCourseItem | null>(null);
  const [msg, setMsg]                 = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm]               = useState(INIT_FORM);
  const { fmtCurrency } = useFormatters();

  const token      = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);
  const thumbInputRef                       = useRef<HTMLInputElement>(null);
  const [thumbPreview, setThumbPreview]     = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

  const { data: allCourses = [], isFetching, refetch } = useGetMyCoursesQuery();
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [deleteCourse, { isLoading: deleting }] = useDeleteCourseMutation();
  const [publishCourse]                         = usePublishCourseMutation();
  const [cloneCourse]                           = useCloneCourseMutation();

  const t = useTranslations("teacher_portal");
  const tLevels = useTranslations("level_labels");
  const tLang = useTranslations("language_labels");
  const tCommon = useTranslations("common");
  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    Draft:         { label: t("status_draft"),     className: "bg-gray-100 text-gray-600" },
    PendingReview: { label: t("status_pending"),   className: "bg-yellow-100 text-yellow-700" },
    Published:     { label: t("status_published"), className: "bg-green-100 text-green-700" },
    Hidden:        { label: t("status_hidden"),    className: "bg-orange-100 text-orange-600" },
    Archived:      { label: t("status_archived"),  className: "bg-red-100 text-red-600" },
  };

  const courses = allCourses.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter && c.level !== levelFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourse({
        title: form.title,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        level: form.level,
        price: form.isFree ? 0 : form.price,
        discountPrice: form.discountPrice !== "" ? Number(form.discountPrice) : undefined,
        isFree: form.isFree,
        certificateEnabled: form.certificateEnabled,
        completionRequired: form.completionRequired,
        visibility: form.visibility,
        language: form.language,
        code: form.code || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        tags: form.tags || undefined,
      }).unwrap();
      setModal("none");
      setForm(INIT_FORM);
      setThumbPreview("");
      refetch();
      showMsg("success", t("toast_create_success"));
    } catch {
      showMsg("error", t("toast_create_error"));
    }
  };

  const handleClone = async (id: string) => {
    try {
      await cloneCourse(id).unwrap();
      refetch();
      showMsg("success", t("toast_clone_success"));
    } catch {
      showMsg("error", t("toast_clone_error"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id).unwrap();
      setModal("none");
      setDeleteTarget(null);
      refetch();
      showMsg("success", t("toast_delete_success"));
    } catch {
      showMsg("error", t("toast_delete_error"));
    }
  };

  const handlePublish = async (id: string, approve: boolean) => {
    try {
      await publishCourse({ id, approve }).unwrap();
      refetch();
      showMsg("success", approve ? t("toast_publish_success") : t("toast_hide_success"));
    } catch {
      showMsg("error", t("toast_action_error"));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("courses_title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("courses_count", { count: allCourses.length })}</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t("create_course")}
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
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
            placeholder={t("search_courses")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">Tìm</button>
        </form>

        <select
          value={levelFilter ?? ""}
          onChange={(e) => setLevelFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t("all_levels")}</option>
          {LEVEL_VALUES.map((v) => <option key={v} value={v}>{tLevels(String(v))}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
        <div className="py-16 text-center text-gray-400">Đang tải...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
          {search || levelFilter || statusFilter ? t("no_courses_match") : t("no_courses")}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {courses.map((course) => {
            const s = STATUS_LABELS[course.status] ?? { label: course.status, className: "bg-gray-100 text-gray-600" };
            const isActive = course.status === "Published";
            return (
              <div key={course.id} className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                {/* Header */}
                <div className="flex items-start gap-3 p-4 pb-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%)" }}
                  >
                    {course.thumbnailUrl
                      ? <img src={course.thumbnailUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      : "📚"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="block truncate font-semibold text-gray-900 hover:text-blue-600"
                      style={{ fontSize: 15 }}
                    >
                      {course.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                        {tLevels(String(course.level))}
                      </span>
                      {course.isFree && (
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>{t("field_free")}</span>
                      )}
                    </div>
                  </div>
                  {isActive
                    ? <span className="flex-shrink-0 text-green-500" style={{ fontSize: 20 }}>✅</span>
                    : <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>
                  }
                </div>

                {course.shortDescription && (
                  <p className="truncate px-4 pb-3 text-xs leading-relaxed text-amber-500">
                    {course.shortDescription}
                  </p>
                )}

                {/* Meta */}
                <div className="mx-4 border-t border-gray-100" />
                <div className="space-y-2.5 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Modules</span>
                    <span className="font-semibold text-gray-800">{course.moduleCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-500">{t("col_students")}</span>
                    <span className="font-semibold text-gray-800">{course.enrollmentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("col_price")}</span>
                    <span>
                      {course.isFree || course.price === 0 ? (
                        <span className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600">FREE</span>
                      ) : course.discountPrice != null ? (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-red-600">{fmtCurrency(course.discountPrice)}</span>
                          <span className="text-xs text-gray-400 line-through">{fmtCurrency(course.price)}</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-red-600">{fmtCurrency(course.price)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("col_status")}</span>
                    {isActive
                      ? <span className="rounded-full px-3 py-0.5 text-xs font-semibold bg-green-100 text-green-700">Active</span>
                      : <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
                  {course.status === "Draft" || course.status === "PendingReview" ? (
                    <button
                      onClick={() => handlePublish(course.id, true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {t("btn_publish")}
                    </button>
                  ) : course.status === "Published" ? (
                    <button
                      onClick={() => handlePublish(course.id, false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      {t("btn_hide")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClone(course.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      {t("btn_clone")}
                    </button>
                  )}

                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    title={t("btn_settings")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </Link>

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

      {/* Create Modal */}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t("modal_create_title")}</h2>
              <button type="button" onClick={() => setModal("none")} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              <form id="create-course-form" onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_title")}</label>
                  <input
                    required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("field_title_ph")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_short_desc")}</label>
                  <textarea
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("field_short_desc_ph")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_description")}</label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(val) => setForm({ ...form, description: val })}
                    placeholder={t("field_description_ph")}
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
                      {LEVEL_VALUES.map((v) => <option key={v} value={v}>{tLevels(String(v))}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_language")}</label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="VI">{tLang("vi_short")}</option>
                      <option value="EN">{tLang("en_short")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_code")}</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("field_code_ph")}
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
                        if (url) setForm((f) => ({ ...f, thumbnailUrl: url }));
                        else { setThumbPreview(""); showMsg("error", t("toast_upload_fail")); }
                      });
                    }}
                  />
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className="relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
                    style={{ height: 90, maxWidth: 160 }}
                  >
                    {(thumbPreview || form.thumbnailUrl) ? (
                      <img src={thumbPreview || form.thumbnailUrl} alt="thumb" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                        <span className="text-2xl">🖼️</span>
                        <span className="text-xs">{t("upload_click")}</span>
                      </div>
                    )}
                  </div>
                  {thumbUploading && <p className="mt-1 text-xs text-blue-500">{t("upload_uploading")}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_tags")}</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("field_tags_ph")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_price")}</label>
                    <input
                      type="number" min={0} step={1000} value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t("field_price_ph")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t("field_discount_price")}</label>
                    <input
                      type="number" min={0} step={1000} value={form.discountPrice}
                      onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder={t("field_discount_ph")}
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
                    <option value="Public">{t("field_public")}</option>
                    <option value="Private">{t("field_private")}</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModal("none")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                    {tCommon("cancel")}
                  </button>
                  <button type="submit" disabled={creating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
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
            <h2 className="mb-2 text-lg font-semibold">{t("modal_delete_course_title")}</h2>
            <p className="mb-4 text-sm text-gray-600">
              {t("modal_delete_course_confirm", { title: deleteTarget.title })}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setModal("none"); setDeleteTarget(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                {tCommon("cancel")}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? t("btn_deleting") : t("btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
