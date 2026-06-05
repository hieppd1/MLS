"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useGetUsersQuery } from "@/lib/features/admin/adminApi";
import { formatDate } from "@/lib/i18nFormat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useUpdateModuleMutation,
  useCreateModuleMutation,
  useDeleteModuleMutation,
  usePublishCourseMutation,
  useSubmitForReviewMutation,
  useCloneCourseMutation,
  useHideCourseMutation,
  useArchiveCourseMutation,
  useGetLearningLevelsQuery,
  useUpsertCourseTranslationMutation,
} from "@/lib/features/cms/cmsApi";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
const AdminPackageManager = dynamic(() => import("@/components/pricing/AdminPackageManager"), { ssr: false });

// ── Helpers ───────────────────────────────────────────────────────────────────

function tryParseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr : []; } catch { return []; }
}

/** Simple list editor: add/remove text items */
function ArrayItemEditor({
  label, hint, placeholder, items, onChange,
}: {
  label: string; hint?: string; placeholder: string;
  items: string[]; onChange: (v: string[]) => void;
}) {
  const t = useTranslations("admin_course_detail");
  const [draft, setDraft] = useState("");
  const addItem = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) { onChange([...items, v]); setDraft(""); }
  };
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400 text-xs">{hint}</span>}
      </label>
      <div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="flex-1 text-sm text-gray-700">{item}</span>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        <button type="button" onClick={addItem}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {t("btn_add_item")}
        </button>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "VI", label: "🇻🇳 Tiếng Việt" },
  { value: "EN", label: "🇬🇧 English" },
];

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Draft:         { color: "#6b7280", bg: "#f3f4f6" },
  PendingReview: { color: "#d97706", bg: "#fef3c7" },
  Published:     { color: "#059669", bg: "#d1fae5" },
  Hidden:        { color: "#ea580c", bg: "#ffedd5" },
  Archived:      { color: "#dc2626", bg: "#fee2e2" },
};

type Tab = "info" | "media" | "price" | "settings" | "modules" | "translations";

interface CourseForm {
  title: string;
  code: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  level: number;
  language: string;
  tags: string;
  duration: string;
  teacherId: string;
  price: number;
  discountPrice: string;
  discountEndsAt: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  visibility: string;
  certificateEnabled: boolean;
  completionRequired: boolean;
  outcomes: string[];     // "Những gì bạn sẽ học"
  requirements: string[]; // "Yêu cầu"
  targetAudience: string[]; // "Khóa học này dành cho ai?"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const t = useTranslations("admin_course_detail");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: course, isLoading } = useGetCourseQuery(id);
  const [updateCourse, { isLoading: updating }] = useUpdateCourseMutation();
  const [createModule, { isLoading: creatingModule }] = useCreateModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();
  const [updateModule] = useUpdateModuleMutation();
  const [publishCourse] = usePublishCourseMutation();
  const [submitForReview] = useSubmitForReviewMutation();
  const [cloneCourse] = useCloneCourseMutation();
  const [hideCourse] = useHideCourseMutation();
  const [archiveCourse] = useArchiveCourseMutation();
  const [upsertCourseTranslation, { isLoading: savingTranslation }] = useUpsertCourseTranslationMutation();
  const { data: learningLevels = [] } = useGetLearningLevelsQuery();
  const { data: teachersData } = useGetUsersQuery({ role: "Teacher", pageSize: 100 });
  const allTeachers = teachersData?.items ?? [];

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<CourseForm>({
    title: "", code: "", shortDescription: "", description: "",
    thumbnailUrl: "", bannerUrl: "",
    level: 1, language: "VI", tags: "", duration: "",
    teacherId: "",
    price: 0, discountPrice: "", discountEndsAt: "",
    startDate: "", endDate: "",
    isFree: false, visibility: "Public",
    certificateEnabled: false, completionRequired: false,
    outcomes: [], requirements: [], targetAudience: [],
  });
  const [showAddModule, setShowAddModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", thumbnailUrl: "", estimatedDuration: "" });

  // III-6: Translation tab state
  const [transLocale, setTransLocale] = useState<"en" | "ko">("en");
  const [transForm, setTransForm] = useState({ title: "", shortDescription: "", description: "", outcomes: "", requirements: "", targetAudience: "" });

  // Drag-drop reorder modules
  const [dragModuleId, setDragModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<import("@/lib/features/cms/cmsApi").ModuleSummary[] | null>(null);

  async function handleModuleDrop(targetModuleId: string) {
    if (!dragModuleId || dragModuleId === targetModuleId || !course) return;
    const sorted = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const fromIdx = sorted.findIndex((m) => m.id === dragModuleId);
    const toIdx = sorted.findIndex((m) => m.id === targetModuleId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // Optimistic update — show new order immediately
    setLocalModules(reordered);
    setDragModuleId(null);
    setDragOverModuleId(null);
    // Persist new order to server
    await Promise.all(reordered.map((m, i) =>
      updateModule({ id: m.id, title: m.title, description: m.description ?? undefined, orderIndex: i, isLocked: false })
    ));
    setLocalModules(null); // revert to server state after refetch
  }
  const [teacherInputValue, setTeacherInputValue] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const filteredTeachers = teacherSearch
    ? allTeachers.filter(t =>
        t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase()))
    : allTeachers;

  const token = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Media tab: local file previews
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const moduleThumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbPreview, setThumbPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [moduleThumbPreview, setModuleThumbPreview] = useState<string>("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [moduleThumbUploading, setModuleThumbUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
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
    } catch {
      return null;
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnailUrl" | "bannerUrl",
    setPreview: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show blob URL as immediate local preview only
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setUploading(true);
    uploadImage(file).then((serverUrl) => {
      setUploading(false);
      if (serverUrl) {
        setForm((prev) => ({ ...prev, [field]: serverUrl }));
      } else {
        showMsg("error", t("toast_upload_image_fail"));
        setPreview("");
      }
    });
  };

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Strip blob URLs that were incorrectly saved to DB
  const safeUrl = (url: string | null | undefined) =>
    url?.startsWith("blob:") ? "" : (url ?? "");

  const startEdit = () => {
    if (!course) return;
    setForm({
      title: course.title,
      code: course.code ?? "",
      shortDescription: course.shortDescription ?? "",
      description: course.description ?? "",
      thumbnailUrl: safeUrl(course.thumbnailUrl),
      bannerUrl: safeUrl(course.bannerUrl),
      level: course.level,
      language: course.language ?? "VI",
      tags: course.tags ?? "",
      duration: course.duration != null ? String(course.duration) : "",
      teacherId: course.teacherId ?? "",
      price: course.price ?? 0,
      discountPrice: course.discountPrice != null ? String(course.discountPrice) : "",
      discountEndsAt: course.discountEndsAt ? course.discountEndsAt.slice(0, 10) : "",
      startDate: course.startDate ? course.startDate.slice(0, 10) : "",
      endDate: course.endDate ? course.endDate.slice(0, 10) : "",
      isFree: course.isFree ?? false,
      visibility: course.visibility ?? "Public",
      certificateEnabled: course.certificateEnabled ?? false,
      completionRequired: course.completionRequired ?? false,
      outcomes: tryParseJsonArray(course.outcomes),
      requirements: tryParseJsonArray(course.requirements),
      targetAudience: tryParseJsonArray(course.targetAudience),
    });
    const teacher = allTeachers.find(t => t.id === (course.teacherId ?? ""));
    setTeacherInputValue(teacher?.fullName ?? "");
    setTeacherSearch("");
    setThumbPreview("");
    setBannerPreview("");
    setEditMode(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCourse({
        id,
        title: form.title,
        code: form.code || undefined,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        level: form.level,
        language: form.language,
        tags: form.tags || undefined,
        duration: form.duration !== "" ? Number(form.duration) : undefined,
        teacherId: form.teacherId || undefined,
        price: form.isFree ? 0 : form.price,
        discountPrice: form.discountPrice !== "" ? Number(form.discountPrice) : undefined,
        discountEndsAt: form.discountEndsAt || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isFree: form.isFree,
        visibility: form.visibility,
        certificateEnabled: form.certificateEnabled,
        completionRequired: form.completionRequired,
        outcomes: form.outcomes.length > 0 ? JSON.stringify(form.outcomes) : undefined,
        requirements: form.requirements.length > 0 ? JSON.stringify(form.requirements) : undefined,
        targetAudience: form.targetAudience.length > 0 ? JSON.stringify(form.targetAudience) : undefined,
      }).unwrap();
      setEditMode(false);
      showMsg("success", t("toast_updated_ok"));
    } catch {
      showMsg("error", t("toast_updated_fail"));
    }
  };

  const handleSaveIsFree = async (val: boolean) => {
    await updateCourse({
      id,
      title: course.title,
      code: course.code || undefined,
      description: course.description || undefined,
      shortDescription: course.shortDescription || undefined,
      thumbnailUrl: course.thumbnailUrl || undefined,
      bannerUrl: course.bannerUrl || undefined,
      level: course.level,
      language: course.language,
      tags: course.tags || undefined,
      duration: course.duration ?? undefined,
      teacherId: course.teacherId || undefined,
      price: val ? 0 : (course.price ?? 0),
      discountPrice: course.discountPrice ?? undefined,
      discountEndsAt: course.discountEndsAt || undefined,
      startDate: course.startDate || undefined,
      endDate: course.endDate || undefined,
      isFree: val,
      visibility: course.visibility ?? "Public",
      certificateEnabled: course.certificateEnabled ?? false,
      completionRequired: course.completionRequired ?? false,
    }).unwrap();
    showMsg("success", val ? t("toast_free_on") : t("toast_free_off"));
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createModule({
        courseId: id, title: moduleForm.title,
        description: moduleForm.description || undefined,
        thumbnailUrl: moduleForm.thumbnailUrl || undefined,
        estimatedDuration: moduleForm.estimatedDuration !== "" ? Number(moduleForm.estimatedDuration) : undefined,
      }).unwrap();
      setShowAddModule(false);
      setModuleForm({ title: "", description: "", thumbnailUrl: "", estimatedDuration: "" });
      showMsg("success", t("toast_module_added"));
    } catch {
      showMsg("error", t("toast_module_add_fail"));
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(t("confirm_delete_module", { title }))) return;
    try {
      await deleteModule({ id: moduleId, courseId: id }).unwrap();
      showMsg("success", t("toast_module_deleted"));
    } catch {
      showMsg("error", t("toast_module_del_fail"));
    }
  };

  const handleWorkflowAction = async (
    action: "submit" | "publish" | "reject" | "hide" | "archive" | "clone"
  ) => {
    try {
      if (action === "submit")  { await submitForReview(id).unwrap(); showMsg("success", t("toast_submitted")); }
      if (action === "publish") { await publishCourse({ id, approve: true }).unwrap(); showMsg("success", t("toast_published")); }
      if (action === "reject")  { await publishCourse({ id, approve: false }).unwrap(); showMsg("success", t("toast_rejected")); }
      if (action === "hide")    { await hideCourse(id).unwrap(); showMsg("success", t("toast_hidden")); }
      if (action === "archive") { await archiveCourse(id).unwrap(); showMsg("success", t("toast_archived")); }
      if (action === "clone") {
        const res = await cloneCourse(id).unwrap();
        showMsg("success", t("toast_cloned"));
        setTimeout(() => router.push(`/admin/courses/${res.id}`), 1200);
      }
    } catch {
      showMsg("error", t("toast_op_fail"));
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">{t("loading")}</div>;
  if (!course)   return <div className="p-6 text-red-500">{t("not_found")}</div>;

  const statusCfg = STATUS_STYLES[course.status] ?? { color: "#6b7280", bg: "#f3f4f6" };
  const statusKey = (STATUS_STYLES[course.status] ? course.status : null) as null | "Draft" | "PendingReview" | "Published" | "Hidden" | "Archived";
  const statusLabel = statusKey ? t(`st_${statusKey}` as 'st_Draft') : course.status;

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",         label: t("tab_info") },
    { key: "media",        label: t("tab_media") },
    { key: "price",        label: t("tab_price") },
    { key: "settings",     label: t("tab_settings") },
    { key: "modules",      label: t("tab_modules", { n: course.modules.length }) },
    { key: "translations", label: t("tab_translations") },
  ];

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "mb-1 block text-sm font-semibold text-gray-700";

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-blue-600">{t("crumb_courses")}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-800">{course.title}</span>
      </nav>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusLabel}
          </span>
          {course.visibility === "Private" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t("badge_private")}</span>
          )}
          {course.isFree && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">{t("badge_free")}</span>
          )}
          {course.certificateEnabled && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{t("badge_certificate")}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.status === "Draft" && (
            <>
              <button onClick={() => handleWorkflowAction("submit")}
                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600">
                {t("btn_submit_review")}
              </button>
              <button onClick={() => handleWorkflowAction("publish")}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                {t("btn_publish_now")}
              </button>
            </>
          )}
          {course.status === "PendingReview" && (
            <>
              <button onClick={() => handleWorkflowAction("publish")}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                {t("btn_approve")}
              </button>
              <button onClick={() => handleWorkflowAction("reject")}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600">
                {t("btn_reject")}
              </button>
            </>
          )}
          {course.status === "Published" && (
            <button onClick={() => handleWorkflowAction("hide")}
              className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100">
              {t("btn_hide")}
            </button>
          )}
          {(course.status === "Hidden" || course.status === "Published") && (
            <button onClick={() => handleWorkflowAction("archive")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              {t("btn_archive")}
            </button>
          )}
          <button onClick={() => handleWorkflowAction("clone")}
            className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100">
            {t("btn_clone")}
          </button>
          {!editMode && (
            <button onClick={startEdit}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {t("btn_edit")}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: Thông tin chung ══════════════════════════════════════════════ */}
      {activeTab === "info" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-6">

              {/* Tên + Mã */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>{t("f_title")} <span className="text-red-500">*</span></label>
                  <input required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls}
                    placeholder={t("f_title_ph")} />
                </div>
                <div>
                  <label className={labelCls}>{t("f_code")}</label>
                  <input value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className={inputCls}
                    placeholder={t("f_code_ph")} />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className={labelCls}>
                  {t("f_short_desc")}
                  <span className="ml-1 font-normal text-gray-400 text-xs">{t("f_short_desc_hint")}</span>
                </label>
                <input value={form.shortDescription} maxLength={200}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className={inputCls}
                  placeholder={t("f_short_desc_ph")} />
                <p className="mt-1 text-right text-xs text-gray-400">{form.shortDescription.length}/200</p>
              </div>

              {/* Mô tả chi tiết – CKEditor */}
              <div>
                <label className={labelCls}>
                  {t("f_desc")}
                  <span className="ml-1 font-normal text-gray-400 text-xs">{t("f_desc_hint")}</span>
                </label>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder={t("f_desc_ph")}
                  height={350}
                />
              </div>

              {/* Cấp độ + Ngôn ngữ + Thời lượng */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{t("f_level")}</label>
                  <select value={form.level}
                    onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
                    className={inputCls}>
                    {learningLevels.length === 0 && <option value={form.level}>{t("level_short", { n: form.level })}</option>}
                    {learningLevels.map((l, i) => <option key={l.id} value={i + 1}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t("f_language")}</label>
                  <select value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className={inputCls}>
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t("f_duration")}</label>
                  <input type="number" min={0} value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className={inputCls} placeholder={t("f_duration_ph")} />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}>
                  {t("f_tags")}
                  <span className="ml-1 font-normal text-gray-400 text-xs">{t("f_tags_hint")}</span>
                </label>
                <input value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className={inputCls}
                  placeholder={t("f_tags_ph")} />
              </div>

              {/* Những gì bạn sẽ học */}
              <ArrayItemEditor
                label={t("f_outcomes")}
                hint={t("f_outcomes_hint")}
                placeholder={t("f_outcomes_ph")}
                items={form.outcomes}
                onChange={(v) => setForm({ ...form, outcomes: v })}
              />

              {/* Yêu cầu */}
              <ArrayItemEditor
                label={t("f_requirements")}
                hint={t("f_requirements_hint")}
                placeholder={t("f_requirements_ph")}
                items={form.requirements}
                onChange={(v) => setForm({ ...form, requirements: v })}
              />

              {/* Đối tượng học viên */}
              <ArrayItemEditor
                label={t("f_target")}
                hint={t("f_target_hint")}
                placeholder={t("f_target_ph")}
                items={form.targetAudience}
                onChange={(v) => setForm({ ...form, targetAudience: v })}
              />

              {/* Giảng viên */}
              <div className="relative">
                <label className={labelCls}>{t("f_teacher")}</label>
                <input
                  type="text"
                  value={teacherInputValue}
                  onChange={(e) => {
                    setTeacherInputValue(e.target.value);
                    setTeacherSearch(e.target.value);
                    setShowTeacherDropdown(true);
                    if (!e.target.value) setForm({ ...form, teacherId: "" });
                  }}
                  onFocus={() => setShowTeacherDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                  className={inputCls}
                  placeholder={t("f_teacher_ph")}
                />
                {form.teacherId && (
                  <p className="mt-1 text-xs text-gray-400">{t("teacher_id_label", { id: form.teacherId })}</p>
                )}
                {showTeacherDropdown && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg" style={{ maxHeight: 200, overflowY: "auto" }}>
                    {filteredTeachers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">{t("no_teacher_found")}</div>
                    ) : (
                      filteredTeachers.map((tch) => (
                        <button
                          key={tch.id}
                          type="button"
                          onMouseDown={() => {
                            setForm({ ...form, teacherId: tch.id });
                            setTeacherInputValue(tch.fullName);
                            setTeacherSearch("");
                            setShowTeacherDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                            form.teacherId === tch.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
                          }`}
                        >
                          <span className="font-medium">{tch.fullName}</span>
                          <span className="text-xs text-gray-400">{tch.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Slug (read-only) */}
              {course.slug && (
                <div>
                  <label className={labelCls}>{t("f_slug")} <span className="font-normal text-gray-400 text-xs">{t("f_slug_hint")}</span></label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-400">/courses/</span>
                    <span className="text-sm font-medium text-blue-600">{course.slug}</span>
                  </div>
                </div>
              )}

              <SaveCancelButtons updating={updating} onCancel={() => setEditMode(false)} />
            </form>
          ) : (
            /* View mode */
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                  {course.code && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-500">{course.code}</span>
                  )}
                </div>
                {course.shortDescription && (
                  <p className="mt-1 text-sm italic text-gray-500">{course.shortDescription}</p>
                )}
              </div>

              {course.description && (
                <div
                  className="prose prose-sm max-w-none border-t border-gray-100 pt-4 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              )}

              <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-sm">
                <InfoItem label={t("lbl_level")} value={learningLevels[course.level - 1]?.name ?? t("level_short", { n: course.level })} />
                <InfoItem label={t("lbl_language")} value={LANGUAGES.find(l => l.value === course.language)?.label ?? course.language ?? t("placeholder_dash")} />
                {course.duration != null && <InfoItem label={t("lbl_duration")} value={t("duration_value", { n: course.duration })} />}
                {course.teacherId && <InfoItem label={t("lbl_teacher")} value={allTeachers.find(tch => tch.id === course.teacherId)?.fullName ?? t("placeholder_dash")} />}
                {course.slug && <InfoItem label={t("lbl_slug")} value={`/${course.slug}`} highlight />}
                {course.publishedAt && <InfoItem label={t("lbl_published")} value={formatDate(course.publishedAt)} />}
                <InfoItem label={t("lbl_created")} value={formatDate(course.createdAt)} />
              </div>

              {course.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.split(",").map((tg) => tg.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* View: Những gì bạn sẽ học */}
              {tryParseJsonArray(course.outcomes).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">{t("outcomes_title")}</h3>
                  <ul className="space-y-1">
                    {tryParseJsonArray(course.outcomes).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View: Yêu cầu */}
              {tryParseJsonArray(course.requirements).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">{t("requirements_title")}</h3>
                  <ul className="space-y-1">
                    {tryParseJsonArray(course.requirements).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-400 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View: Đối tượng */}
              {tryParseJsonArray(course.targetAudience).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">{t("target_title")}</h3>
                  <ul className="space-y-1">
                    {tryParseJsonArray(course.targetAudience).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-purple-400 mt-0.5">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Hình ảnh & Media ═════════════════════════════════════════════ */}
      {activeTab === "media" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-8">

            {/* ── Thumbnail ── */}
            <div>
              <label className={labelCls}>{t("thumb_label")}</label>
              <p className="mb-3 text-xs text-gray-400">{t("thumb_hint")}</p>

              {/* Preview area */}
              <div
                onClick={() => editMode && thumbInputRef.current?.click()}
                className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  editMode ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/30" : ""
                } ${
                  (thumbPreview || form.thumbnailUrl) ? "border-gray-200" : "border-gray-300 bg-gray-50"
                }`}
                style={{ width: 320, height: 180 }}
              >
                {(thumbPreview || form.thumbnailUrl) ? (
                  <>
                    <img
                      src={thumbPreview || form.thumbnailUrl}
                      alt="thumbnail"
                      className="h-full w-full object-cover"
                    />
                    {editMode && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 rounded-xl">
                        <span className="text-2xl">📷</span>
                        <span className="mt-1 text-xs font-medium text-white">{t("thumb_change")}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-4xl">🖼️</span>
                    {editMode ? (
                      <>
                        <span className="text-sm font-medium">{t("thumb_pick")}</span>
                        <span className="text-xs">{t("thumb_drop")}</span>
                      </>
                    ) : (
                      <span className="text-sm">{t("thumb_empty")}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "thumbnailUrl", setThumbPreview, setThumbUploading)}
              />

              {editMode && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={thumbUploading}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {thumbUploading ? t("btn_uploading") : t("btn_pick_file")}
                  </button>
                  {(thumbPreview || form.thumbnailUrl) && !thumbUploading && (
                    <button
                      type="button"
                      onClick={() => { setThumbPreview(""); setForm({ ...form, thumbnailUrl: "" }); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      {t("btn_remove_image")}
                    </button>
                  )}
                </div>
              )}

              {editMode && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-gray-400">{t("or_url")}</p>
                  <input
                    type="text"
                    value={thumbPreview ? "" : form.thumbnailUrl}
                    onChange={(e) => { setThumbPreview(""); setForm({ ...form, thumbnailUrl: e.target.value }); }}
                    placeholder={t("thumb_url_ph")}
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {/* ── Banner ── */}
            <div className="border-t border-gray-100 pt-6">
              <label className={labelCls}>{t("banner_label")}</label>
              <p className="mb-3 text-xs text-gray-400">{t("banner_hint")}</p>

              <div
                onClick={() => editMode && bannerInputRef.current?.click()}
                className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  editMode ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/30" : ""
                } ${
                  (bannerPreview || form.bannerUrl) ? "border-gray-200" : "border-gray-300 bg-gray-50"
                }`}
                style={{ height: 140, maxWidth: 800 }}
              >
                {(bannerPreview || form.bannerUrl) ? (
                  <>
                    <img
                      src={bannerPreview || form.bannerUrl}
                      alt="banner"
                      className="h-full w-full object-cover"
                    />
                    {editMode && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 rounded-xl">
                        <span className="text-2xl">📷</span>
                        <span className="mt-1 text-xs font-medium text-white">{t("banner_change")}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-4xl">🏞️</span>
                    {editMode ? (
                      <>
                        <span className="text-sm font-medium">{t("banner_pick")}</span>
                        <span className="text-xs">{t("thumb_drop")}</span>
                      </>
                    ) : (
                      <span className="text-sm">{t("banner_empty")}</span>
                    )}
                  </div>
                )}
              </div>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "bannerUrl", setBannerPreview, setBannerUploading)}
              />

              {editMode && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    {t("btn_pick_file")}
                  </button>
                  {(bannerPreview || form.bannerUrl) && (
                    <button
                      type="button"
                      onClick={() => { setBannerPreview(""); setForm({ ...form, bannerUrl: "" }); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      {t("btn_remove_banner")}
                    </button>
                  )}
                </div>
              )}

              {editMode && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-gray-400">{t("or_url")}</p>
                  <input
                    type="text"
                    value={bannerPreview ? "" : form.bannerUrl}
                    onChange={(e) => { setBannerPreview(""); setForm({ ...form, bannerUrl: e.target.value }); }}
                    placeholder={t("banner_url_ph")}
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {editMode && <SaveCancelButtons updating={updating} onCancel={() => { setEditMode(false); setThumbPreview(""); setBannerPreview(""); }} />}
          </form>
        </div>
      )}

      {/* ══ TAB: Giá & Thương mại ════════════════════════════════════════════ */}
      {activeTab === "price" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <AdminPackageManager
            courseId={id}
            isFree={course.isFree ?? false}
            onSaveIsFree={handleSaveIsFree}
          />
        </div>
      )}

      {/* ══ TAB: Cài đặt ═════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Publish timeline – always visible */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t("settings_status_title")}</p>
            <div className="flex items-center">
              {(["Draft","PendingReview","Published","Hidden","Archived"] as const).map((s, i) => {
                const cfg = STATUS_STYLES[s];
                const isCurrent = course.status === s;
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-3 w-3 rounded-full"
                        style={{ background: isCurrent ? cfg.color : "#e5e7eb" }} />
                      <span className="text-xs whitespace-nowrap"
                        style={{ color: isCurrent ? cfg.color : "#9ca3af", fontWeight: isCurrent ? 700 : 400 }}>
                        {t(`st_${s}` as 'st_Draft')}
                      </span>
                    </div>
                    {i < 4 && <div className="mx-1 mb-4 h-0.5 w-10 bg-gray-200" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings form – always interactive, no editMode required */}
          <form onSubmit={handleUpdate} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("settings_config_title")}</p>

            {/* Visibility */}
            <div>
              <label className={labelCls}>{t("vis_label")}</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { value: "Public",  icon: "🌐", title: t("vis_public_title"),  desc: t("vis_public_desc") },
                  { value: "Private", icon: "🔒", title: t("vis_private_title"),   desc: t("vis_private_desc") },
                ].map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { if (!editMode) startEdit(); setForm((prev) => ({ ...prev, visibility: opt.value })); }}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      (editMode ? form.visibility : course.visibility) === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}>
                    <div className="text-2xl">{opt.icon}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">{opt.title}</div>
                    <div className="mt-0.5 text-xs text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              label={t("cert_label")}
              desc={t("cert_desc")}
              checked={editMode ? form.certificateEnabled : (course.certificateEnabled ?? false)}
              onToggle={() => {
                if (!editMode) startEdit();
                setForm((prev) => ({ ...prev, certificateEnabled: !prev.certificateEnabled }));
              }}
              color="blue"
            />

            <ToggleRow
              label={t("completion_label")}
              desc={t("completion_desc")}
              checked={editMode ? form.completionRequired : (course.completionRequired ?? false)}
              onToggle={() => {
                if (!editMode) startEdit();
                setForm((prev) => ({ ...prev, completionRequired: !prev.completionRequired }));
              }}
              color="orange"
            />

            {editMode && <SaveCancelButtons updating={updating} onCancel={() => setEditMode(false)} />}
          </form>
        </div>
      )}

      {/* ══ TAB: Modules ═════════════════════════════════════════════════════ */}
      {activeTab === "modules" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {t("mods_title", { n: course.modules.length })}
            </h2>
            <button onClick={() => setShowAddModule(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {t("btn_add_module")}
            </button>
          </div>

          {course.modules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <div className="mb-3 text-5xl">📦</div>
              <p className="font-semibold text-gray-600">{t("mods_empty_title")}</p>
              <p className="mt-1 text-sm text-gray-400">{t("mods_empty_hint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(localModules ?? [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex)).map((module, idx) => (
                <div key={module.id}
                  draggable
                  onDragStart={() => setDragModuleId(module.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverModuleId(module.id); }}
                  onDragLeave={() => setDragOverModuleId(null)}
                  onDrop={() => handleModuleDrop(module.id)}
                  onDragEnd={() => { setDragModuleId(null); setDragOverModuleId(null); }}
                  className={[
                    "flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm transition-all cursor-grab active:cursor-grabbing",
                    dragOverModuleId === module.id && dragModuleId !== module.id ? "border-blue-400 bg-blue-50 scale-[1.01]" : "border-gray-200",
                    dragModuleId === module.id ? "opacity-50" : "",
                  ].join(" ")}>
                  <div className="flex items-center gap-4">
                    {/* Drag handle */}
                    <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {idx + 1}
                    </span>
                    <div>
                      <Link href={`/admin/modules/${module.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600">
                        {module.title}
                      </Link>
                      {module.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{t("session_count", { n: module.sessionCount })}</span>
                    <Link href={`/admin/modules/${module.id}`}
                      className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                      {t("btn_manage")}
                    </Link>
                    <button onClick={() => handleDeleteModule(module.id, module.title)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
                      {t("btn_delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Module Modal ─────────────────────────────────────────────── */}
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
                  placeholder={t("f_mod_title_ph")} />
              </div>
              <div>
                <label className={labelCls}>{t("f_mod_desc")}</label>
                <textarea value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={2} className={inputCls}
                  placeholder={t("f_mod_desc_ph")} />
              </div>
              <div>
                <label className={labelCls}>{t("f_mod_thumb")}</label>
                <input ref={moduleThumbInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setModuleThumbPreview(URL.createObjectURL(file));
                    setModuleThumbUploading(true);
                    uploadImage(file).then((url) => {
                      setModuleThumbUploading(false);
                      if (url) setModuleForm(f => ({ ...f, thumbnailUrl: url }));
                      else { setModuleThumbPreview(""); showMsg("error", t("toast_upload_image_fail")); }
                    });
                  }}
                />
                <div
                  onClick={() => moduleThumbInputRef.current?.click()}
                  className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  style={{ height: 80, maxWidth: 144 }}
                >
                  {(moduleThumbPreview || moduleForm.thumbnailUrl) ? (
                    <img src={moduleThumbPreview || moduleForm.thumbnailUrl} alt="module thumb" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                      <span className="text-xl">🖼️</span>
                      <span className="text-xs">{t("mod_thumb_pick_hint")}</span>
                    </div>
                  )}
                </div>
                {moduleThumbUploading && <p className="mt-1 text-xs text-blue-500">{t("mod_thumb_uploading")}</p>}
              </div>
              <div>
                <label className={labelCls}>{t("f_mod_duration")}</label>
                <input type="number" min={0} value={moduleForm.estimatedDuration}
                  onChange={(e) => setModuleForm({ ...moduleForm, estimatedDuration: e.target.value })}
                  className={inputCls}
                  placeholder={t("f_mod_duration_ph")} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModule(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  {t("btn_cancel")}
                </button>
                <button type="submit" disabled={creatingModule}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {creatingModule ? t("btn_adding") : t("btn_add_mod")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB: Translations ════════════════════════════════════════════════ */}
      {activeTab === "translations" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t("trans_title")}</h2>

          {/* Locale selector */}
          <div className="mb-6 flex gap-2">
            {(["en", "ko"] as const).map((l) => (
              <button key={l} type="button"
                onClick={() => setTransLocale(l)}
                className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                  transLocale === l
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                {l === "en" ? t("trans_btn_en") : t("trans_btn_ko")}
              </button>
            ))}
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await upsertCourseTranslation({
                id: course.id,
                locale: transLocale,
                title: transForm.title || undefined,
                shortDescription: transForm.shortDescription || undefined,
                description: transForm.description || undefined,
                outcomes: transForm.outcomes || undefined,
                requirements: transForm.requirements || undefined,
                targetAudience: transForm.targetAudience || undefined,
              }).unwrap();
              showMsg("success", t("trans_save_ok", { locale: transLocale }));
            } catch {
              showMsg("error", t("trans_save_fail"));
            }
          }} className="space-y-4">
            <div>
              <label className={labelCls}>{t("trans_f_title", { locale: transLocale })}</label>
              <input className={inputCls} value={transForm.title}
                onChange={(e) => setTransForm({ ...transForm, title: e.target.value })}
                placeholder={t("trans_f_title_ph", { lang: transLocale === "en" ? t("trans_locale_en") : t("trans_locale_ko") })} />
            </div>
            <div>
              <label className={labelCls}>{t("trans_f_short", { locale: transLocale })}</label>
              <textarea rows={2} className={inputCls} value={transForm.shortDescription}
                onChange={(e) => setTransForm({ ...transForm, shortDescription: e.target.value })}
                placeholder={t("trans_f_short_ph")} />
            </div>
            <div>
              <label className={labelCls}>{t("trans_f_desc", { locale: transLocale })}</label>
              <textarea rows={4} className={inputCls} value={transForm.description}
                onChange={(e) => setTransForm({ ...transForm, description: e.target.value })}
                placeholder={t("trans_f_desc_ph")} />
            </div>
            <div>
              <label className={labelCls}>{t("trans_f_outcomes", { locale: transLocale })}</label>
              <textarea rows={3} className={inputCls} value={transForm.outcomes}
                onChange={(e) => setTransForm({ ...transForm, outcomes: e.target.value })}
                placeholder={t("trans_f_outcomes_ph")} />
            </div>
            <div>
              <label className={labelCls}>{t("trans_f_requirements", { locale: transLocale })}</label>
              <textarea rows={2} className={inputCls} value={transForm.requirements}
                onChange={(e) => setTransForm({ ...transForm, requirements: e.target.value })}
                placeholder={t("trans_f_requirements_ph")} />
            </div>
            <div>
              <label className={labelCls}>{t("trans_f_target", { locale: transLocale })}</label>
              <textarea rows={2} className={inputCls} value={transForm.targetAudience}
                onChange={(e) => setTransForm({ ...transForm, targetAudience: e.target.value })}
                placeholder={t("trans_f_target_ph")} />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <button type="submit" disabled={savingTranslation}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {savingTranslation ? t("trans_btn_saving") : t("trans_btn_save", { locale: transLocale })}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Shared helper components ──────────────────────────────────────────────────

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-0.5 font-medium ${highlight ? "text-blue-600" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function ToggleRow({
  label, desc, checked, onToggle, color = "blue",
}: {
  label: string; desc: string; checked: boolean;
  onToggle: () => void; color?: "blue" | "orange" | "green";
}) {
  const trackColor = checked
    ? color === "blue" ? "#3b82f6" : color === "orange" ? "#f97316" : "#22c55e"
    : "#d1d5db";
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
      </div>
      <button type="button" onClick={onToggle}
        style={{
          position: "relative", display: "inline-flex", alignItems: "center",
          width: 44, height: 24, borderRadius: 9999,
          backgroundColor: trackColor, border: "none",
          cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0,
        }}>
        <span style={{
          display: "inline-block", width: 16, height: 16, borderRadius: 9999,
          backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(22px)" : "translateX(4px)",
          transition: "transform 0.2s",
        }} />
      </button>
    </div>
  );
}

function SaveCancelButtons({ updating, onCancel }: { updating: boolean; onCancel: () => void }) {
  const t = useTranslations("admin_course_detail");
  return (
    <div className="flex gap-3 border-t border-gray-100 pt-4">
      <button type="submit" disabled={updating}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {updating ? t("btn_saving") : t("btn_save")}
      </button>
      <button type="button" onClick={onCancel}
        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm hover:bg-gray-50">
        {t("btn_cancel")}
      </button>
    </div>
  );
}
