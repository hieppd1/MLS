"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import Link from "next/link";
import {
  useGetSessionQuery,
  useUpdateSessionMutation,
  usePublishSessionMutation,
  useCreateSegmentMutation,
  useUpdateSegmentMutation,
  useDeleteSegmentMutation,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  type SegmentDetail,
  type SegmentAsset,
} from "@/lib/features/cms/cmsApi";
import { AssetMetadataEditor } from "@/components/cms/AssetMetadataEditor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTime(value: string): number {
  if (!value.includes(":")) return Number(value) || 0;
  const [m, s] = value.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

const ASSET_TYPES = [
  { value: "GrammarBlock", label: "📚 Grammar Block" },
  { value: "VocabularyBlock", label: "🔤 Vocabulary Block" },
  { value: "QuizBlock", label: "❓ Quiz Block" },
  { value: "ExerciseBlock", label: "✏️ Exercise Block" },
  { value: "PPTBlock", label: "📊 Slide / PPT" },
  { value: "NoteBlock", label: "📝 Note Block" },
  { value: "FileAttachment", label: "📎 File Attachment" },
];

const ASSET_ICONS: Record<string, string> = {
  GrammarBlock: "📚",
  VocabularyBlock: "🔤",
  QuizBlock: "❓",
  ExerciseBlock: "✏️",
  PPTBlock: "📊",
  NoteBlock: "📝",
  FileAttachment: "📎",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface SegmentFormState {
  title: string;
  description: string;
  startTimeStr: string;
  endTimeStr: string;
}

interface AssetFormState {
  type: string;
  title: string;
  description: string;
  startTimeStr: string;
  endTimeStr: string;
  metadata: string;
  isPublic: boolean;
}

const defaultAssetForm = (): AssetFormState => ({
  type: "GrammarBlock",
  title: "",
  description: "",
  startTimeStr: "0:00",
  endTimeStr: "",
  metadata: "{}",
  isPublic: true,
});

// ── Main component ────────────────────────────────────────────────────────────

export default function SessionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const tenantSlug = useSelector((s: RootState) => s.auth.tenantSlug);

  const { data: session, isLoading } = useGetSessionQuery(id);
  const [updateSession] = useUpdateSessionMutation();
  const [publishSession] = usePublishSessionMutation();
  const [createSegment, { isLoading: creatingSegment }] = useCreateSegmentMutation();
  const [updateSegment] = useUpdateSegmentMutation();
  const [deleteSegment] = useDeleteSegmentMutation();
  const [createAsset, { isLoading: creatingAsset }] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Session edit ──────────────────────────────────────────────────────────
  const [editSession, setEditSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", description: "", isFreeTrial: false });

  const startEditSession = () => {
    if (!session) return;
    setSessionForm({
      title: session.title,
      description: session.description ?? "",
      isFreeTrial: session.isFreeTrial,
    });
    setEditSession(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSession({ id, ...sessionForm }).unwrap();
      setEditSession(false);
      showMsg("success", "Đã cập nhật session");
    } catch {
      showMsg("error", "Cập nhật thất bại");
    }
  };

  // ── Video upload ──────────────────────────────────────────────────────────
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const handleVideoUpload = async (file: File) => {
    setVideoUploading(true);
    setVideoProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100));
      };
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.open("POST", `${API_BASE}/api/v1/admin/cms/sessions/${id}/video`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (tenantSlug) xhr.setRequestHeader("X-Tenant-Slug", tenantSlug);
        xhr.send(fd);
      });
      showMsg("success", "Video đã được tải lên");
    } catch {
      showMsg("error", "Upload video thất bại");
    } finally {
      setVideoUploading(false);
    }
  };

  // ── Segment add/edit ──────────────────────────────────────────────────────
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [editSegmentId, setEditSegmentId] = useState<string | null>(null);
  const [segForm, setSegForm] = useState<SegmentFormState>({
    title: "", description: "", startTimeStr: "0:00", endTimeStr: "6:00",
  });

  const openAddSegment = () => {
    // Default start = end of last segment or 0
    const lastEnd = session?.segments.reduce((max, s) => Math.max(max, s.endTime), 0) ?? 0;
    setSegForm({
      title: "",
      description: "",
      startTimeStr: fmtTime(lastEnd),
      endTimeStr: fmtTime(lastEnd + 360),
    });
    setEditSegmentId(null);
    setShowAddSegment(true);
  };

  const openEditSegment = (seg: SegmentDetail) => {
    setSegForm({
      title: seg.title,
      description: seg.description ?? "",
      startTimeStr: fmtTime(seg.startTime),
      endTimeStr: fmtTime(seg.endTime),
    });
    setEditSegmentId(seg.id);
    setShowAddSegment(true);
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = parseTime(segForm.startTimeStr);
    const endTime = parseTime(segForm.endTimeStr);
    try {
      if (editSegmentId) {
        await updateSegment({
          id: editSegmentId, sessionId: id,
          title: segForm.title, description: segForm.description || undefined,
          startTime, endTime,
        }).unwrap();
        showMsg("success", "Đã cập nhật segment");
      } else {
        await createSegment({
          sessionId: id,
          title: segForm.title, description: segForm.description || undefined,
          startTime, endTime,
        }).unwrap();
        showMsg("success", "Đã thêm segment");
      }
      setShowAddSegment(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? "Thao tác thất bại";
      showMsg("error", msg);
    }
  };

  const handleDeleteSegment = async (segId: string, title: string) => {
    if (!confirm(`Xóa segment "${title}"?`)) return;
    try {
      await deleteSegment({ id: segId, sessionId: id }).unwrap();
      showMsg("success", "Đã xóa segment");
    } catch {
      showMsg("error", "Xóa thất bại");
    }
  };

  // ── Asset add/edit ────────────────────────────────────────────────────────
  const [assetPanel, setAssetPanel] = useState<{ segmentId: string; asset?: SegmentAsset } | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState>(defaultAssetForm());
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetUploading, setAssetUploading] = useState(false);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  const openAddAsset = (segmentId: string, seg: SegmentDetail) => {
    setAssetForm({
      ...defaultAssetForm(),
      startTimeStr: fmtTime(seg.startTime),
    });
    setAssetFile(null);
    setAssetPanel({ segmentId });
  };

  const openEditAsset = (segmentId: string, asset: SegmentAsset) => {
    setAssetForm({
      type: asset.type,
      title: asset.title,
      description: asset.description ?? "",
      startTimeStr: fmtTime(asset.startTime),
      endTimeStr: asset.endTime != null ? fmtTime(asset.endTime) : "",
      metadata: asset.metadata,
      isPublic: asset.isPublic,
    });
    setAssetFile(null);
    setAssetPanel({ segmentId, asset });
  };

  const uploadAssetFile = async (assetId: string, file: File) => {
    setAssetUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText)));
        xhr.onerror = reject;
        xhr.open("POST", `${API_BASE}/api/v1/admin/cms/assets/${assetId}/upload-file`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (tenantSlug) xhr.setRequestHeader("X-Tenant-Slug", tenantSlug);
        xhr.send(fd);
      });
    } finally {
      setAssetUploading(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetPanel) return;
    const startTime = parseTime(assetForm.startTimeStr);
    const endTime = assetForm.endTimeStr ? parseTime(assetForm.endTimeStr) : undefined;
    try {
      if (assetPanel.asset) {
        await updateAsset({
          id: assetPanel.asset.id, sessionId: id,
          title: assetForm.title, description: assetForm.description || undefined,
          startTime, endTime: endTime ?? null,
          metadata: assetForm.metadata, isPublic: assetForm.isPublic,
        }).unwrap();
        if (assetFile) await uploadAssetFile(assetPanel.asset.id, assetFile);
        showMsg("success", "Đã cập nhật asset");
      } else {
        const newId = await createAsset({
          segmentId: assetPanel.segmentId, sessionId: id,
          type: assetForm.type, title: assetForm.title,
          description: assetForm.description || undefined,
          startTime, endTime,
          metadata: assetForm.metadata, isPublic: assetForm.isPublic,
        }).unwrap();
        if (assetFile) await uploadAssetFile(newId as unknown as string, assetFile);
        showMsg("success", "Đã thêm asset");
      }
      setAssetPanel(null);
      setAssetFile(null);
    } catch (err: unknown) {
      const errMsg = (err as { data?: { detail?: string } })?.data?.detail ?? "Thao tác thất bại";
      showMsg("error", errMsg);
    }
  };

  const handleDeleteAsset = async (assetId: string, title: string) => {
    if (!confirm(`Xóa "${title}"?`)) return;
    try {
      await deleteAsset({ id: assetId, sessionId: id }).unwrap();
      showMsg("success", "Đã xóa asset");
    } catch {
      showMsg("error", "Xóa thất bại");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <div className="p-6 text-gray-500">Đang tải...</div>;
  if (!session) return <div className="p-6 text-red-500">Không tìm thấy session</div>;

  const sortedSegments = [...session.segments].sort((a, b) => a.startTime - b.startTime);
  const totalDuration = session.durationSeconds;
  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500 flex items-center gap-1.5">
        <Link href="/teacher/courses" className="hover:text-blue-600">Khóa học</Link>
        <span>/</span>
        <Link href={`/teacher/modules/${session.moduleId}`} className="hover:text-blue-600">Module</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{session.title}</span>
      </nav>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Session Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {editSession ? (
          <form onSubmit={handleUpdateSession} className="space-y-4">
            <div>
              <label className={labelCls}>Tên session *</label>
              <input required value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mô tả</label>
              <textarea value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} rows={2} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sessionForm.isFreeTrial} onChange={(e) => setSessionForm({ ...sessionForm, isFreeTrial: e.target.checked })} className="rounded" />
              <span className="font-medium text-gray-700">Học thử miễn phí</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Lưu</button>
              <button type="button" onClick={() => setEditSession(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
              {session.description && <p className="text-sm text-gray-500">{session.description}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  session.publishStatus === "Published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
                ].join(" ")}>
                  {session.publishStatus}
                </span>
                {session.isFreeTrial && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">Free trial</span>}
                {totalDuration > 0 && <span className="text-xs text-gray-400">⏱ {Math.round(totalDuration / 60)} phút</span>}
                <span className="text-xs text-gray-400">🎬 {sortedSegments.length} segment</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={startEditSession} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Sửa</button>
              <button
                onClick={() => publishSession({ id, publish: session.publishStatus !== "Published" })}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  session.publishStatus === "Published"
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-green-600 text-white hover:bg-green-700",
                ].join(" ")}
              >
                {session.publishStatus === "Published" ? "Hủy xuất bản" : "Xuất bản"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Section */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">🎬 Video bài giảng</h2>
        {session.videoAsset ? (
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  session.videoAsset.status === "Ready" ? "bg-green-100 text-green-700" : "bg-yellow-50 text-yellow-700",
                ].join(" ")}>
                  {session.videoAsset.status === "Ready" ? "✅ Sẵn sàng" : `⚙️ ${session.videoAsset.status}`}
                </span>
                {session.videoAsset.durationSeconds > 0 && (
                  <span className="text-sm text-gray-500">
                    {fmtTime(session.videoAsset.durationSeconds)} ({Math.round(session.videoAsset.durationSeconds / 60)} phút)
                  </span>
                )}
              </div>
              {session.videoAsset.hlsPath && (
                <p className="text-xs text-gray-400 font-mono truncate max-w-md">{session.videoAsset.hlsPath}</p>
              )}
            </div>
            <button onClick={() => videoInputRef.current?.click()} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              Thay video
            </button>
          </div>
        ) : (
          <div
            onClick={() => !videoUploading && videoInputRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 py-10 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-colors"
          >
            {videoUploading ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Đang tải lên... {videoProgress}%</p>
                <div className="mx-auto h-2 w-64 rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-purple-600 transition-all" style={{ width: `${videoProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-sm font-medium">Nhấn để tải lên video bài giảng</p>
                <p className="text-xs mt-1">MP4, MKV, MOV — tối đa 2GB</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleVideoUpload(file);
          }}
        />
      </div>

      {/* Timeline + Segments */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">📋 Timeline — Segments</h2>
          <button
            onClick={openAddSegment}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            + Thêm segment
          </button>
        </div>

        {/* Visual timeline bar */}
        {totalDuration > 0 && sortedSegments.length > 0 && (
          <div className="mb-5 relative h-8 bg-gray-100 rounded-full overflow-hidden">
            {sortedSegments.map((seg) => (
              <div
                key={seg.id}
                title={`${seg.title} (${fmtTime(seg.startTime)} – ${fmtTime(seg.endTime)})`}
                className="absolute top-0 h-full bg-purple-400 border-r border-white opacity-80 hover:opacity-100 transition-opacity rounded"
                style={{
                  left: `${(seg.startTime / totalDuration) * 100}%`,
                  width: `${(seg.duration / totalDuration) * 100}%`,
                }}
              />
            ))}
          </div>
        )}

        {sortedSegments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-400">
            Chưa có segment. Nhấn &quot;+ Thêm segment&quot; để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSegments.map((seg, idx) => (
              <div key={seg.id} className="rounded-xl border border-gray-200 bg-gray-50">
                {/* Segment header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{seg.title}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {fmtTime(seg.startTime)} – {fmtTime(seg.endTime)}
                        <span className="ml-1 text-gray-300">({Math.round(seg.duration / 60)}m{seg.duration % 60}s)</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddAsset(seg.id, seg)}
                      className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
                    >
                      + Asset
                    </button>
                    <button
                      onClick={() => openEditSegment(seg)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteSegment(seg.id, seg.title)}
                      className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Assets list */}
                {seg.assets.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-400 italic">Chưa có asset nào.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {[...seg.assets].sort((a, b) => a.orderIndex - b.orderIndex).map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{ASSET_ICONS[asset.type] ?? "📌"}</span>
                          <div>
                            <span className="text-sm font-medium text-gray-800">{asset.title}</span>
                            <span className="ml-2 text-xs text-gray-400">{asset.type}</span>
                            <span className="ml-2 text-xs text-gray-400">@{fmtTime(asset.startTime)}{asset.endTime != null ? `–${fmtTime(asset.endTime)}` : ""}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditAsset(seg.id, asset)}
                            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.title)}
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
            ))}
          </div>
        )}
      </div>

      {/* Segment Modal */}
      {showAddSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editSegmentId ? "Sửa segment" : "Thêm segment"}
            </h2>
            <form onSubmit={handleSaveSegment} className="space-y-4">
              <div>
                <label className={labelCls}>Tên segment *</label>
                <input
                  required
                  value={segForm.title}
                  onChange={(e) => setSegForm({ ...segForm, title: e.target.value })}
                  className={inputCls}
                  placeholder="VD: Grammar: Present Simple"
                />
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea
                  value={segForm.description}
                  onChange={(e) => setSegForm({ ...segForm, description: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bắt đầu (m:ss) *</label>
                  <input
                    required
                    value={segForm.startTimeStr}
                    onChange={(e) => setSegForm({ ...segForm, startTimeStr: e.target.value })}
                    className={inputCls}
                    placeholder="0:00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Kết thúc (m:ss) *</label>
                  <input
                    required
                    value={segForm.endTimeStr}
                    onChange={(e) => setSegForm({ ...segForm, endTimeStr: e.target.value })}
                    className={inputCls}
                    placeholder="6:00"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Thời lượng: {(() => {
                  const dur = parseTime(segForm.endTimeStr) - parseTime(segForm.startTimeStr);
                  return dur > 0 ? `${Math.floor(dur / 60)}m${dur % 60}s` : "—";
                })()}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSegment(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={creatingSegment} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
                  {editSegmentId ? "Cập nhật" : (creatingSegment ? "Đang thêm..." : "Thêm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {assetPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {assetPanel.asset ? "Sửa asset" : "Thêm asset"}
              </h2>
              <button
                type="button"
                onClick={() => setAssetPanel(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="Đóng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveAsset} className="space-y-4">
              {!assetPanel.asset && (
                <div>
                  <label className={labelCls}>Loại asset *</label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                    className={inputCls}
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {assetPanel.asset && (
                <div>
                  <label className={labelCls}>Loại</label>
                  <input disabled value={`${ASSET_ICONS[assetForm.type] ?? "📌"} ${assetForm.type}`} className={`${inputCls} bg-gray-50 text-gray-500`} />
                </div>
              )}
              <div>
                <label className={labelCls}>Tiêu đề *</label>
                <input
                  required
                  value={assetForm.title}
                  onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Timestamp (m:ss) *</label>
                  <input
                    required
                    value={assetForm.startTimeStr}
                    onChange={(e) => setAssetForm({ ...assetForm, startTimeStr: e.target.value })}
                    className={inputCls}
                    placeholder="0:00"
                  />
                  <p className="mt-1 text-xs text-gray-400">Video sẽ seek đến mốc này khi click</p>
                </div>
                <div>
                  <label className={labelCls}>Kết thúc highlight (m:ss)</label>
                  <input
                    value={assetForm.endTimeStr}
                    onChange={(e) => setAssetForm({ ...assetForm, endTimeStr: e.target.value })}
                    className={inputCls}
                    placeholder="Không bắt buộc"
                  />
                  <p className="mt-1 text-xs text-gray-400">Vùng highlight trên timeline (tùy chọn)</p>
                </div>
              </div>
              <div>
                {(assetForm.type === "PPTBlock" || assetForm.type === "FileAttachment") && (
                  <div>
                    <label className={labelCls}>File đính kèm</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => assetFileInputRef.current?.click()}
                        className="rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600 hover:border-purple-500 hover:text-purple-600 transition"
                      >
                        {assetFile ? `📎 ${assetFile.name}` : "Chọn file"}
                      </button>
                      {assetFile && (
                        <button type="button" onClick={() => setAssetFile(null)} className="text-xs text-red-500 hover:text-red-700">✕ Bỏ</button>
                      )}
                      <input
                        ref={assetFileInputRef}
                        type="file"
                        accept=".pdf,.ppt,.pptx,.docx,.xlsx,.mp3,.mp4"
                        className="hidden"
                        onChange={(e) => setAssetFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">PDF, PPT, PPTX, DOCX... File sẽ được upload khi lưu.</p>
                  </div>
                )}
                <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nội dung chi tiết</label>
                  <AssetMetadataEditor
                    assetType={assetForm.type}
                    value={assetForm.metadata}
                    onChange={(json) => setAssetForm({ ...assetForm, metadata: json })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={assetForm.isPublic}
                  onChange={(e) => setAssetForm({ ...assetForm, isPublic: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-gray-700">Hiện với học viên</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAssetPanel(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={creatingAsset || assetUploading} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
                  {assetUploading ? "Đang upload..." : assetPanel.asset ? "Cập nhật" : (creatingAsset ? "Đang thêm..." : "Thêm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
