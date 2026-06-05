"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import Link from "next/link";
import { safeImgUrl } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";
import dynamic from "next/dynamic";
import {
  useGetModuleQuery,
  useUpdateModuleMutation,
  useGetSessionsByModuleQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} from "@/lib/features/cms/cmsApi";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const VIDEO_STATUS: Record<string, string> = {
  Pending: "⏳ Chờ xử lý",
  Processing: "⚙️ Đang xử lý",
  Ready: "✅ Sẵn sàng",
  Failed: "❌ Lỗi",
};

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: module, isLoading } = useGetModuleQuery(id);
  const [updateModule, { isLoading: updating }] = useUpdateModuleMutation();

  // Sessions
  const { data: sessions } = useGetSessionsByModuleQuery(id);
  const [createSession, { isLoading: creatingSession }] = useCreateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "", description: "", isFreeTrial: false,
    sessionType: "Interactive",
    content: "", audioUrl: "", documentUrl: "", transcript: "",
    passScore: 70, durationMinutes: 0,
  });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    estimatedDuration: 0,
    orderIndex: 0,
    isLocked: false,
  });
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbPreview, setThumbPreview] = useState<string>("");
  const [thumbUploading, setThumbUploading] = useState(false);

  const uploadThumbnail = async (file: File): Promise<string | null> => {
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
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const safeUrl = (url: string | null | undefined) =>
    url?.startsWith("blob:") ? "" : (url ?? "");

  const startEdit = () => {
    if (!module) return;
    setForm({
      title: module.title,
      description: module.description ?? "",
      thumbnailUrl: safeUrl(module.thumbnailUrl),
      estimatedDuration: module.estimatedDuration ?? 0,
      orderIndex: module.orderIndex,
      isLocked: module.isLocked,
    });
    setThumbPreview("");
    setEditMode(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateModule({ id, ...form }).unwrap();
      setEditMode(false);
      showMsg("success", "Đã cập nhật module");
    } catch {
      showMsg("error", "Cập nhật thất bại");
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSession({
        moduleId: id,
        title: sessionForm.title,
        description: sessionForm.description || undefined,
        isFreeTrial: sessionForm.isFreeTrial,
        sessionType: sessionForm.sessionType,
        content: sessionForm.content || undefined,
        audioUrl: sessionForm.audioUrl || undefined,
        documentUrl: sessionForm.documentUrl || undefined,
        transcript: sessionForm.transcript || undefined,
        passScore: sessionForm.passScore,
        durationMinutes: sessionForm.durationMinutes,
      }).unwrap();
      setShowAddSession(false);
      setSessionForm({ title: "", description: "", isFreeTrial: false, sessionType: "Interactive", content: "", audioUrl: "", documentUrl: "", transcript: "", passScore: 70, durationMinutes: 0 });
      showMsg("success", "Đã thêm nội dung");
    } catch {
      showMsg("error", "Thêm nội dung thất bại");
    }
  };

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!confirm(`Xóa session "${title}"?`)) return;
    try {
      await deleteSession({ id: sessionId, moduleId: id }).unwrap();
      showMsg("success", "Đã xóa session");
    } catch {
      showMsg("error", "Xóa thất bại");
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Đang tải...</div>;
  if (!module) return <div className="p-6 text-red-500">Không tìm thấy module</div>;

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/teacher/courses" className="hover:text-blue-600">Khóa học</Link>
        <span className="mx-2">/</span>
        <Link href={`/teacher/courses/${module.courseId}`} className="hover:text-blue-600">Khóa học</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{module.title}</span>
      </nav>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Module Info */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <span className="text-sm text-gray-500">Thứ tự: {module.orderIndex + 1}</span>
          {!editMode && (
            <button onClick={startEdit} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              Chỉnh sửa
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Tên module */}
            <div>
              <label className={labelCls}>Tên module *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </div>

            {/* Mô tả (rich text) */}
            <div>
              <label className={labelCls}>Mô tả</label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
                placeholder="Nhập mô tả module..."
                height={200}
              />
            </div>

            {/* Thumbnail + Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Ảnh thumbnail</label>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setThumbPreview(URL.createObjectURL(file));
                    setThumbUploading(true);
                    uploadThumbnail(file).then((serverUrl) => {
                      setThumbUploading(false);
                      if (serverUrl) {
                        setForm((prev) => ({ ...prev, thumbnailUrl: serverUrl }));
                      } else {
                        setThumbPreview("");
                      }
                    });
                  }}
                />
                <div
                  onClick={() => thumbInputRef.current?.click()}
                  className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
                  style={{ width: 200, height: 120 }}
                >
                  {(thumbPreview || form.thumbnailUrl) ? (
                    <>
                      <img src={thumbPreview || form.thumbnailUrl} alt="thumbnail" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 rounded-xl">
                        <span className="text-xl">📷</span>
                        <span className="mt-1 text-xs font-medium text-white">Đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                      <span className="text-3xl">🖼️</span>
                      <span className="text-xs font-medium">Nhấn để chọn ảnh</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Thời lượng ước tính (phút)</label>
                <input
                  type="number"
                  min={0}
                  value={form.estimatedDuration}
                  onChange={(e) => setForm({ ...form, estimatedDuration: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Thứ tự */}
            <div className="w-32">
              <label className={labelCls}>Thứ tự</label>
              <input
                type="number"
                min={0}
                value={form.orderIndex}
                onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })}
                className={inputCls}
              />
            </div>

            {/* IsLocked */}
            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={form.isLocked}
                onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium text-gray-700">🔒 Khóa module (học viên phải hoàn thành module trước mới mở khóa)</span>
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={updating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {updating ? "Đang lưu..." : "Lưu"}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        ) : (
          <div className="flex gap-6">
            {safeImgUrl(module.thumbnailUrl) && (
              <img
                src={safeImgUrl(module.thumbnailUrl)!}
                alt={module.title}
                className="h-28 w-44 flex-shrink-0 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
              {module.isLocked && (
                <span className="inline-block rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">🔒 Module đang khóa</span>
              )}
              {module.estimatedDuration > 0 && (
                <p className="text-sm text-gray-500">⏱ Thời lượng ước tính: <strong>{module.estimatedDuration} phút</strong></p>
              )}
              {module.description && (
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: module.description }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nội dung header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-lg font-semibold text-gray-900">📚 Nội dung ({sessions?.length ?? 0})</h2>
        <button
          onClick={() => setShowAddSession(true)}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          + Thêm nội dung
        </button>
      </div>

      {/* Sessions / content list */}
      <div>

        {(!sessions || sessions.length === 0) ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
            Chưa có nội dung nào.
          </div>
        ) : (
          <div className="space-y-2">
            {[...sessions].sort((a, b) => a.orderIndex - b.orderIndex).map((session, idx) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-xs font-semibold text-purple-700">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/teacher/sessions/${session.id}`} className="font-medium text-gray-900 hover:text-purple-600">
                        {session.title}
                      </Link>
                      {session.isFreeTrial && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">Free</span>
                      )}
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-600">
                        {session.sessionType ?? "Interactive"}
                      </span>
                      <span className={[
                        "rounded px-1.5 py-0.5 text-xs font-medium",
                        session.publishStatus === "Published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
                      ].join(" ")}>
                        {session.publishStatus}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                      <span>🎬 {session.segmentCount} segment</span>
                      {session.durationSeconds > 0 && (
                        <span>⏱ {Math.round(session.durationSeconds / 60)} phút</span>
                      )}
                      {session.videoStatus && (
                        <span className={session.videoStatus === "Ready" ? "text-green-600" : "text-orange-500"}>
                          {session.videoStatus === "Ready" ? "✅ Video sẵn sàng" : `⚙️ ${session.videoStatus}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/teacher/sessions/${session.id}`} className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200">
                    Chỉnh sửa
                  </Link>
                  <button
                    onClick={() => handleDeleteSession(session.id, session.title)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Content Modal */}
      {showAddSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="scroll-area w-full max-w-lg rounded-xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-4 text-lg font-semibold">Thêm nội dung</h2>
            <form onSubmit={handleAddSession} className="space-y-4">
              {/* Session type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Loại nội dung *</label>
                <select
                  value={sessionForm.sessionType}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Interactive">🎬 Interactive (video + timeline segments)</option>
                  <option value="Video">📹 Video đơn giản</option>
                  <option value="Reading">📖 Reading (văn bản HTML)</option>
                  <option value="Audio">🎧 Audio</option>
                  <option value="Pdf">📄 PDF</option>
                  <option value="Quiz">❓ Quiz</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề *</label>
                <input
                  required
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Buổi học 1: Present Simple"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả ngắn</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Conditional: Reading content */}
              {sessionForm.sessionType === "Reading" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung HTML</label>
                  <RichTextEditor
                    value={sessionForm.content}
                    onChange={(val) => setSessionForm({ ...sessionForm, content: val })}
                    placeholder="Nhập nội dung bài đọc..."
                    height={200}
                  />
                </div>
              )}

              {/* Conditional: Audio URL */}
              {sessionForm.sessionType === "Audio" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">URL Audio</label>
                  <input
                    type="url"
                    value={sessionForm.audioUrl}
                    onChange={(e) => setSessionForm({ ...sessionForm, audioUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Conditional: Document URL */}
              {sessionForm.sessionType === "Pdf" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">URL PDF</label>
                  <input
                    type="url"
                    value={sessionForm.documentUrl}
                    onChange={(e) => setSessionForm({ ...sessionForm, documentUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Duration / PassScore for non-video types */}
              {["Reading", "Audio", "Pdf", "Quiz"].includes(sessionForm.sessionType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Thời lượng (phút)</label>
                    <input
                      type="number" min={0}
                      value={sessionForm.durationMinutes}
                      onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {sessionForm.sessionType === "Quiz" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Điểm qua (%)</label>
                      <input
                        type="number" min={0} max={100}
                        value={sessionForm.passScore}
                        onChange={(e) => setSessionForm({ ...sessionForm, passScore: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sessionForm.isFreeTrial}
                  onChange={(e) => setSessionForm({ ...sessionForm, isFreeTrial: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-gray-700">Học thử miễn phí</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSession(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={creatingSession} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
                  {creatingSession ? "Đang thêm..." : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
