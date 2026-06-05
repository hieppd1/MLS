"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import Link from "next/link";
import dynamic from "next/dynamic";

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
} from "@/lib/features/cms/cmsApi";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
import AdminPackageManager from "@/components/pricing/AdminPackageManager";

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
  const [draft, setDraft] = useState("");
  const addItem = () => {
    const t = draft.trim();
    if (t && !items.includes(t)) { onChange([...items, t]); setDraft(""); }
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
          + Thêm
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Draft:         { label: "Nháp",        color: "#6b7280", bg: "#f3f4f6" },
  PendingReview: { label: "Chờ duyệt",   color: "#d97706", bg: "#fef3c7" },
  Published:     { label: "Đã xuất bản", color: "#059669", bg: "#d1fae5" },
  Hidden:        { label: "Đã ẩn",       color: "#ea580c", bg: "#ffedd5" },
  Archived:      { label: "Lưu trữ",     color: "#dc2626", bg: "#fee2e2" },
};

type Tab = "info" | "media" | "price" | "settings" | "modules";

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
  outcomes: string[];
  requirements: string[];
  targetAudience: string[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
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
  const { data: learningLevels = [] } = useGetLearningLevelsQuery();

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
        showMsg("error", "Upload ảnh thất bại");
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
      showMsg("success", "Đã cập nhật khóa học");
    } catch {
      showMsg("error", "Cập nhật thất bại");
    }
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
      showMsg("success", "Đã thêm module");
    } catch {
      showMsg("error", "Thêm module thất bại");
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Xóa module "${title}"? Toàn bộ bài học trong module sẽ bị xóa.`)) return;
    try {
      await deleteModule({ id: moduleId, courseId: id }).unwrap();
      showMsg("success", "Đã xóa module");
    } catch {
      showMsg("error", "Xóa module thất bại");
    }
  };

  const handleWorkflowAction = async (
    action: "submit" | "publish" | "hide" | "archive" | "clone"
  ) => {
    try {
      if (action === "submit")  { await submitForReview(id).unwrap(); showMsg("success", "Đã gửi duyệt"); }
      if (action === "publish") { await publishCourse({ id, approve: true }).unwrap(); showMsg("success", "Đã xuất bản"); }
      if (action === "hide")    { await hideCourse(id).unwrap(); showMsg("success", "Đã ẩn khóa học"); }
      if (action === "archive") { await archiveCourse(id).unwrap(); showMsg("success", "Đã lưu trữ"); }
      if (action === "clone") {
        const res = await cloneCourse(id).unwrap();
        showMsg("success", "Đã nhân bản – đang chuyển hướng…");
        setTimeout(() => router.push(`/teacher/courses/${res.id}`), 1200);
      }
    } catch {
      showMsg("error", "Thao tác thất bại");
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Đang tải...</div>;
  if (!course)   return <div className="p-6 text-red-500">Không tìm thấy khóa học</div>;

  const statusCfg = STATUS_CONFIG[course.status] ?? { label: course.status, color: "#6b7280", bg: "#f3f4f6" };

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",     label: "Thông tin chung" },
    { key: "media",    label: "Hình ảnh & Media" },
    { key: "price",    label: "Giá & Thương mại" },
    { key: "settings", label: "Cài đặt" },
    { key: "modules",  label: `Modules (${course.modules.length})` },
  ];

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "mb-1 block text-sm font-semibold text-gray-700";

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/teacher/courses" className="hover:text-blue-600">Khóa học</Link>
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
            {statusCfg.label}
          </span>
          {course.visibility === "Private" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">🔒 Riêng tư</span>
          )}
          {course.isFree && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">Miễn phí</span>
          )}
          {course.certificateEnabled && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">🎓 Chứng chỉ</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.status === "Draft" && (
            <>
              <button onClick={() => handleWorkflowAction("submit")}
                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600">
                Gửi duyệt
              </button>
              <button onClick={() => handleWorkflowAction("publish")}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                Xuất bản ngay
              </button>
            </>
          )}
          {course.status === "Published" && (
            <button onClick={() => handleWorkflowAction("hide")}
              className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100">
              Ẩn khóa học
            </button>
          )}
          {(course.status === "Hidden" || course.status === "Published") && (
            <button onClick={() => handleWorkflowAction("archive")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Lưu trữ
            </button>
          )}
          <button onClick={() => handleWorkflowAction("clone")}
            className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100">
            📋 Nhân bản
          </button>
          {!editMode && (
            <button onClick={startEdit}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              ✏️ Chỉnh sửa
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
                  <label className={labelCls}>Tên khóa học <span className="text-red-500">*</span></label>
                  <input required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls}
                    placeholder="VD: IELTS Academic – Khóa học toàn diện" />
                </div>
                <div>
                  <label className={labelCls}>Mã khóa học</label>
                  <input value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className={inputCls}
                    placeholder="VD: IELTS-AC-01" />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className={labelCls}>
                  Mô tả ngắn
                  <span className="ml-1 font-normal text-gray-400 text-xs">(hiển thị trên thẻ khóa học – tối đa 200 ký tự)</span>
                </label>
                <input value={form.shortDescription} maxLength={200}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className={inputCls}
                  placeholder="Tóm tắt nội dung khóa học trong 1–2 câu" />
                <p className="mt-1 text-right text-xs text-gray-400">{form.shortDescription.length}/200</p>
              </div>

              {/* Mô tả chi tiết – CKEditor */}
              <div>
                <label className={labelCls}>
                  Mô tả chi tiết
                  <span className="ml-1 font-normal text-gray-400 text-xs">(hỗ trợ định dạng văn bản, hình ảnh, bảng biểu)</span>
                </label>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Giới thiệu chi tiết: mục tiêu học tập, nội dung chương trình, đối tượng phù hợp..."
                  height={350}
                />
              </div>

              {/* Cấp độ + Ngôn ngữ + Thời lượng */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Cấp độ</label>
                  <select value={form.level}
                    onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
                    className={inputCls}>
                    {learningLevels.length === 0 && <option value={form.level}>Cấp {form.level}</option>}
                    {learningLevels.map((l, i) => <option key={l.id} value={i + 1}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ngôn ngữ</label>
                  <select value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className={inputCls}>
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tổng thời lượng (phút)</label>
                  <input type="number" min={0} value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className={inputCls} placeholder="VD: 1200" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}>
                  Tags
                  <span className="ml-1 font-normal text-gray-400 text-xs">(cách nhau bởi dấu phẩy)</span>
                </label>
                <input value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className={inputCls}
                  placeholder="VD: IELTS, English, Academic, Writing" />
              </div>

              {/* Những gì bạn sẽ học */}
              <ArrayItemEditor
                label="Những gì bạn sẽ học"
                hint="(mỗi dòng là một điểm nổi bật của khóa học)"
                placeholder="VD: Giao tiếp tự tin trong các tình huống thực tế"
                items={form.outcomes}
                onChange={(v) => setForm({ ...form, outcomes: v })}
              />

              {/* Yêu cầu */}
              <ArrayItemEditor
                label="Yêu cầu"
                hint="(điều kiện đầu vào hoặc cần chuẩn bị)"
                placeholder="VD: Không cần có kinh nghiệm trước"
                items={form.requirements}
                onChange={(v) => setForm({ ...form, requirements: v })}
              />

              {/* Đối tượng học viên */}
              <ArrayItemEditor
                label="Khóa học này dành cho ai?"
                hint="(mô tả đối tượng học viên phù hợp)"
                placeholder="VD: Người mới bắt đầu học từ con số 0"
                items={form.targetAudience}
                onChange={(v) => setForm({ ...form, targetAudience: v })}
              />

              {/* Slug (read-only) */}
              {course.slug && (
                <div>
                  <label className={labelCls}>Slug URL <span className="font-normal text-gray-400 text-xs">(tự động tạo từ tên)</span></label>
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
                <InfoItem label="Cấp độ" value={learningLevels[course.level - 1]?.name ?? `Cấp ${course.level}`} />
                <InfoItem label="Ngôn ngữ" value={LANGUAGES.find(l => l.value === course.language)?.label ?? course.language ?? "—"} />
                {course.duration != null && <InfoItem label="Thời lượng" value={`${course.duration} phút`} />}
                {course.slug && <InfoItem label="Slug" value={`/${course.slug}`} highlight />}
                {course.publishedAt && <InfoItem label="Xuất bản" value={new Date(course.publishedAt).toLocaleDateString("vi-VN")} />}
                <InfoItem label="Ngày tạo" value={new Date(course.createdAt).toLocaleDateString("vi-VN")} />
              </div>

              {course.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* View: Những gì bạn sẽ học */}
              {tryParseJsonArray(course.outcomes).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Những gì bạn sẽ học</h3>
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
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Yêu cầu</h3>
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
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Khóa học này dành cho ai?</h3>
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
              <label className={labelCls}>Ảnh đại diện (Thumbnail)</label>
              <p className="mb-3 text-xs text-gray-400">Tỉ lệ 16:9, tối thiểu 640×360px, định dạng JPG/PNG/WebP</p>

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
                        <span className="mt-1 text-xs font-medium text-white">Đổi ảnh</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-4xl">🖼️</span>
                    {editMode ? (
                      <>
                        <span className="text-sm font-medium">Nhấn để chọn ảnh</span>
                        <span className="text-xs">hoặc kéo thả vào đây</span>
                      </>
                    ) : (
                      <span className="text-sm">Chưa có ảnh đại diện</span>
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
                    {thumbUploading ? "⏳ Đang upload..." : "📂 Chọn file"}
                  </button>
                  {(thumbPreview || form.thumbnailUrl) && !thumbUploading && (
                    <button
                      type="button"
                      onClick={() => { setThumbPreview(""); setForm({ ...form, thumbnailUrl: "" }); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              )}

              {editMode && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-gray-400">Hoặc nhập URL trực tiếp:</p>
                  <input
                    type="text"
                    value={thumbPreview ? "" : form.thumbnailUrl}
                    onChange={(e) => { setThumbPreview(""); setForm({ ...form, thumbnailUrl: e.target.value }); }}
                    placeholder="https://cdn.example.com/thumbnail.jpg"
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {/* ── Banner ── */}
            <div className="border-t border-gray-100 pt-6">
              <label className={labelCls}>Banner trang giới thiệu (Banner)</label>
              <p className="mb-3 text-xs text-gray-400">Tỉ lệ 16:5, tối thiểu 1200×375px, định dạng JPG/PNG/WebP</p>

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
                        <span className="mt-1 text-xs font-medium text-white">Đổi banner</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-4xl">🏞️</span>
                    {editMode ? (
                      <>
                        <span className="text-sm font-medium">Nhấn để chọn banner</span>
                        <span className="text-xs">hoặc kéo thả vào đây</span>
                      </>
                    ) : (
                      <span className="text-sm">Chưa có banner</span>
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
                    📂 Chọn file
                  </button>
                  {(bannerPreview || form.bannerUrl) && (
                    <button
                      type="button"
                      onClick={() => { setBannerPreview(""); setForm({ ...form, bannerUrl: "" }); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Xóa banner
                    </button>
                  )}
                </div>
              )}

              {editMode && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-gray-400">Hoặc nhập URL trực tiếp:</p>
                  <input
                    type="text"
                    value={bannerPreview ? "" : form.bannerUrl}
                    onChange={(e) => { setBannerPreview(""); setForm({ ...form, bannerUrl: e.target.value }); }}
                    placeholder="https://cdn.example.com/banner.jpg"
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
          <form onSubmit={handleUpdate} className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Giá khóa học</p>

            {/* isFree toggle */}
            <ToggleRow
              label="Khóa học miễn phí"
              desc="Học viên có thể truy cập hoàn toàn miễn phí"
              checked={editMode ? form.isFree : (course.isFree ?? false)}
              onToggle={() => {
                if (!editMode) startEdit();
                setForm((prev) => ({ ...prev, isFree: !prev.isFree }));
              }}
              color="green"
            />

            {/* Price inputs – only shown when not free */}
            {!(editMode ? form.isFree : (course.isFree ?? false)) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Giá gốc (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={editMode ? form.price : (course.price ?? 0)}
                    onChange={(e) => {
                      if (!editMode) startEdit();
                      setForm((prev) => ({ ...prev, price: Number(e.target.value) }));
                    }}
                    className={inputCls}
                    placeholder="VD: 499000"
                  />
                </div>
                <div>
                  <label className={labelCls}>Giá khuyến mãi (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={editMode ? form.discountPrice : (course.discountPrice ?? "")}
                    onChange={(e) => {
                      if (!editMode) startEdit();
                      setForm((prev) => ({ ...prev, discountPrice: e.target.value }));
                    }}
                    className={inputCls}
                    placeholder="Để trống nếu không có"
                  />
                </div>
                <div>
                  <label className={labelCls}>Giảm giá đến ngày</label>
                  <input
                    type="date"
                    value={editMode ? form.discountEndsAt : (course.discountEndsAt ? course.discountEndsAt.slice(0, 10) : "")}
                    onChange={(e) => {
                      if (!editMode) startEdit();
                      setForm((prev) => ({ ...prev, discountEndsAt: e.target.value }));
                    }}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Enrollment dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-gray-100 pt-4">
              <div>
                <label className={labelCls}>Ngày mở ghi danh</label>
                <input
                  type="date"
                  value={editMode ? form.startDate : (course.startDate ? course.startDate.slice(0, 10) : "")}
                  onChange={(e) => {
                    if (!editMode) startEdit();
                    setForm((prev) => ({ ...prev, startDate: e.target.value }));
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Ngày đóng ghi danh</label>
                <input
                  type="date"
                  value={editMode ? form.endDate : (course.endDate ? course.endDate.slice(0, 10) : "")}
                  onChange={(e) => {
                    if (!editMode) startEdit();
                    setForm((prev) => ({ ...prev, endDate: e.target.value }));
                  }}
                  className={inputCls}
                />
              </div>
            </div>

            {editMode && <SaveCancelButtons updating={updating} onCancel={() => setEditMode(false)} />}
          </form>

          {/* 3-tier package manager */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <AdminPackageManager courseId={id} />
          </div>
        </div>
      )}

      {/* ══ TAB: Cài đặt ═════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Publish timeline – always visible */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái xuất bản</p>
            <div className="flex items-center">
              {["Draft","PendingReview","Published","Hidden","Archived"].map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const isCurrent = course.status === s;
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-3 w-3 rounded-full"
                        style={{ background: isCurrent ? cfg.color : "#e5e7eb" }} />
                      <span className="text-xs whitespace-nowrap"
                        style={{ color: isCurrent ? cfg.color : "#9ca3af", fontWeight: isCurrent ? 700 : 400 }}>
                        {cfg.label}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cấu hình</p>

            {/* Visibility */}
            <div>
              <label className={labelCls}>Phạm vi hiển thị</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { value: "Public",  icon: "🌐", title: "Công khai",  desc: "Hiển thị trong danh sách khóa học" },
                  { value: "Private", icon: "🔒", title: "Riêng tư",   desc: "Chỉ truy cập qua link hoặc ghi danh" },
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
              label="Cấp chứng chỉ hoàn thành"
              desc="Học viên nhận chứng chỉ kỹ thuật số sau khi hoàn thành khóa học"
              checked={editMode ? form.certificateEnabled : (course.certificateEnabled ?? false)}
              onToggle={() => {
                if (!editMode) startEdit();
                setForm((prev) => ({ ...prev, certificateEnabled: !prev.certificateEnabled }));
              }}
              color="blue"
            />

            <ToggleRow
              label="Bắt buộc hoàn thành theo thứ tự"
              desc="Học viên phải hoàn thành bài trước mới mở bài học tiếp theo"
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
              Danh sách modules ({course.modules.length})
            </h2>
            <button onClick={() => setShowAddModule(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              + Thêm module
            </button>
          </div>

          {course.modules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <div className="mb-3 text-5xl">📦</div>
              <p className="font-semibold text-gray-600">Chưa có module nào</p>
              <p className="mt-1 text-sm text-gray-400">Nhấn "+ Thêm module" để tổ chức nội dung khóa học</p>
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
                      <Link href={`/teacher/modules/${module.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600">
                        {module.title}
                      </Link>
                      {module.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{module.sessionCount} session</span>
                    <Link href={`/teacher/modules/${module.id}`}
                      className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                      Quản lý
                    </Link>
                    <button onClick={() => handleDeleteModule(module.id, module.title)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
                      Xóa
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
            <h2 className="mb-4 text-lg font-semibold">Thêm module mới</h2>
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className={labelCls}>Tên module <span className="text-red-500">*</span></label>
                <input required value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className={inputCls}
                  placeholder="VD: Chương 1 – Phát âm cơ bản" />
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={2} className={inputCls}
                  placeholder="Mục tiêu của chương này..." />
              </div>
              <div>
                <label className={labelCls}>Thumbnail</label>
                <input ref={moduleThumbInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setModuleThumbPreview(URL.createObjectURL(file));
                    setModuleThumbUploading(true);
                    uploadImage(file).then((url) => {
                      setModuleThumbUploading(false);
                      if (url) setModuleForm(f => ({ ...f, thumbnailUrl: url }));
                      else { setModuleThumbPreview(""); showMsg("error", "Upload ảnh thất bại"); }
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
                      <span className="text-xs">Nhấp để tải ảnh</span>
                    </div>
                  )}
                </div>
                {moduleThumbUploading && <p className="mt-1 text-xs text-blue-500">⏳ Đang upload...</p>}
              </div>
              <div>
                <label className={labelCls}>Thời lượng ước tính (phút)</label>
                <input type="number" min={0} value={moduleForm.estimatedDuration}
                  onChange={(e) => setModuleForm({ ...moduleForm, estimatedDuration: e.target.value })}
                  className={inputCls}
                  placeholder="VD: 60" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModule(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={creatingModule}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {creatingModule ? "Đang thêm..." : "Thêm module"}
                </button>
              </div>
            </form>
          </div>
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
  return (
    <div className="flex gap-3 border-t border-gray-100 pt-4">
      <button type="submit" disabled={updating}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {updating ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
      <button type="button" onClick={onCancel}
        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm hover:bg-gray-50">
        Hủy
      </button>
    </div>
  );
}
