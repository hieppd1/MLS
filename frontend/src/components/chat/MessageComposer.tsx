"use client";

import { useRef, useState } from "react";
import type { ChatAttachment, ChatMessageType } from "@/lib/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";
import { showToast } from "@/components/ui/Toaster";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

interface Props {
  onSend: (content: string, attachments: ChatAttachment[], type: ChatMessageType) => void | Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function MessageComposer({ onSend, onTyping, disabled, disabledReason }: Props) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  const upload = async (file: File, isImage: boolean): Promise<ChatAttachment | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const url = `${API_BASE}/api/v1/chat/uploads/${isImage ? "image" : "file"}`;
    const res = await fetch(url, {
      method: "POST",
      body: fd,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showToast(j.message ?? "Upload thất bại.", "error");
      return null;
    }
    const result = (await res.json()) as { fileUrl: string; fileName: string; mimeType: string; sizeBytes: number };
    return {
      id: crypto.randomUUID(),
      fileUrl: result.fileUrl,
      fileName: result.fileName,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      width: null,
      height: null,
    };
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const a = await upload(f, true);
        if (a) setPending((p) => [...p, a]);
      }
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const a = await upload(f, false);
        if (a) setPending((p) => [...p, a]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed && pending.length === 0) return;

    let type: ChatMessageType = "Text";
    if (pending.length > 0) {
      const allImg = pending.every((a) => a.mimeType?.startsWith("image/"));
      type = allImg ? "Image" : "File";
    }
    await onSend(trimmed, pending, type);
    setText("");
    setPending([]);
  };

  if (disabled) {
    return (
      <div className="border-t border-gray-200 bg-white p-3 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        {disabledReason ?? "Không thể gửi tin nhắn."}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      {pending.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pending.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800"
            >
              <span className="max-w-[200px] truncate">📎 {a.fileName}</span>
              <button
                onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                className="text-rose-500 hover:underline"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          title="Gửi ảnh"
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🖼️
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handlePickImage}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Gửi tệp"
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          📎
        </button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={handlePickFile} />

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
          className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />

        <button
          type="button"
          onClick={submit}
          disabled={uploading || (!text.trim() && pending.length === 0)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
