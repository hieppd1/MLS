"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
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
void VIDEO_STATUS;

export default function ModuleDetailPage() {
  const t = useTranslations("admin_module_detail");
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
      showMsg("success", t("toast_update_ok"));
    } catch {
      showMsg("error", t("toast_update_fail"));
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
      showMsg("success", t("toast_add_ok"));
    } catch {
      showMsg("error", t("toast_add_fail"));
    }
  };

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!confirm(t("confirm_delete_session", { title }))) return;
    try {
      await deleteSession({ id: sessionId, moduleId: id }).unwrap();
      showMsg("success", t("toast_del_ok"));
    } catch {
      showMsg("error", t("toast_del_fail"));
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">{t("loading")}</div>;
  if (!module) return <div className="p-6 text-red-500">{t("not_found")}</div>;

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-blue-600">{t("crumb_courses")}</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/courses/${module.courseId}`} className="hover:text-blue-600">{t("crumb_course")}</Link>
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
          <span className="text-sm text-gray-500">{t("order_label", { n: module.orderIndex + 1 })}</span>
          {!editMode && (
            <button onClick={startEdit} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              {t("btn_edit")}
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Tên module */}
            <div>
              <label className={labelCls}>{t("f_title")}</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </div>

            {/* Mô tả (rich text) */}
            <div>
              <label className={labelCls}>{t("f_desc")}</label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
                placeholder={t("f_desc_ph")}
                height={200}
              />
            </div>

            {/* Thumbnail + Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{t("f_thumb")}</label>
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
                        <span className="mt-1 text-xs font-medium text-white">{t("thumb_change")}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                      <span className="text-3xl">🖼️</span>
                      <span className="text-xs font-medium">{t("thumb_pick")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>{t("f_duration")}</label>
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
              <label className={labelCls}>{t("f_order")}</label>
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
              <span className="font-medium text-gray-700">{t("locked_label")}</span>
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={updating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {updating ? t("btn_saving") : t("btn_save")}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">{t("btn_cancel")}</button>
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
                <span className="inline-block rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">{t("locked_badge")}</span>
              )}
              {module.estimatedDuration > 0 && (
                <p className="text-sm text-gray-500">{t("duration_view", { n: module.estimatedDuration })}</p>
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
        <h2 className="text-lg font-semibold text-gray-900">{t("sessions_title", { n: sessions?.length ?? 0 })}</h2>
        <button
          onClick={() => setShowAddSession(true)}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          {t("btn_add_session")}
        </button>
      </div>

      {/* Sessions / content list */}
      <div>

        {(!sessions || sessions.length === 0) ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
            {t("empty_sessions")}
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
                      <Link href={`/admin/sessions/${session.id}`} className="font-medium text-gray-900 hover:text-purple-600">
                        {session.title}
                      </Link>
                      {session.isFreeTrial && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">{t("free_badge")}</span>
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
                      <span>{t("seg_count", { n: session.segmentCount })}</span>
                      {session.durationSeconds > 0 && (
                        <span>{t("mins", { n: Math.round(session.durationSeconds / 60) })}</span>
                      )}
                      {session.videoStatus && (
                        <span className={session.videoStatus === "Ready" ? "text-green-600" : "text-orange-500"}>
                          {session.videoStatus === "Ready" ? t("video_ready") : t("video_processing", { status: session.videoStatus })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/sessions/${session.id}`} className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200">
                    {t("btn_edit_short")}
                  </Link>
                  <button
                    onClick={() => handleDeleteSession(session.id, session.title)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                  >
                    {t("btn_delete_short")}
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
            <h2 className="mb-4 text-lg font-semibold">{t("modal_add_title")}</h2>
            <form onSubmit={handleAddSession} className="space-y-4">
              {/* Session type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_type")}</label>
                <select
                  value={sessionForm.sessionType}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Interactive">{t("type_interactive")}</option>
                  <option value="Video">{t("type_video")}</option>
                  <option value="Reading">{t("type_reading")}</option>
                  <option value="Audio">{t("type_audio")}</option>
                  <option value="Pdf">{t("type_pdf")}</option>
                  <option value="Quiz">{t("type_quiz")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_session_title")}</label>
                <input
                  required
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t("f_session_title_ph")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_short_desc")}</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_html")}</label>
                  <RichTextEditor
                    value={sessionForm.content}
                    onChange={(val) => setSessionForm({ ...sessionForm, content: val })}
                    placeholder={t("f_html_ph")}
                    height={200}
                  />
                </div>
              )}

              {/* Conditional: Audio URL */}
              {sessionForm.sessionType === "Audio" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_audio_url")}</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_pdf_url")}</label>
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
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_dur_min")}</label>
                    <input
                      type="number" min={0}
                      value={sessionForm.durationMinutes}
                      onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {sessionForm.sessionType === "Quiz" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{t("f_pass_score")}</label>
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
                <span className="font-medium text-gray-700">{t("free_trial_label")}</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSession(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">{t("btn_cancel")}</button>
                <button type="submit" disabled={creatingSession} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
                  {creatingSession ? t("btn_adding") : t("btn_add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}