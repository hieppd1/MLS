"use client";

import { useRef, useState } from "react";
import { safeImgUrl } from "@/lib/utils";

export interface ImageUploadProps {
  /** Current image URL (shown as preview) */
  value: string | null;
  /** Called with new URL after successful upload */
  onChange: (url: string) => void;
  /** Function that uploads a File and returns the public URL */
  uploadFn: (file: File) => Promise<string>;
  /** "circle" for avatars, "rect" for covers / thumbnails */
  shape?: "circle" | "rect";
  /** Extra class names applied to the outer wrapper */
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  uploadFn,
  shape = "rect",
  className = "",
  placeholder = "Tải ảnh lên",
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadFn(file);
      onChange(url);
    } catch {
      setError("Tải ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    }
  }

  const isCircle = shape === "circle";
  const containerCls = isCircle
    ? "relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-indigo-400 hover:bg-indigo-50"
    : "relative h-32 w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-indigo-400 hover:bg-indigo-50";

  return (
    <div className={`${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label={placeholder}
        onClick={() => !disabled && fileRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) fileRef.current?.click();
        }}
        className={`${containerCls} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {/* Preview */}
        {safeImgUrl(value) ? (
          <>
            <img
              src={safeImgUrl(value)!}
              alt="preview"
              className={`h-full w-full object-cover ${isCircle ? "rounded-full" : "rounded-lg"}`}
            />
            {/* Hover overlay */}
            {!disabled && (
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100 ${isCircle ? "rounded-full" : "rounded-lg"}`}
              >
                <div className="flex flex-col items-center gap-0.5 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">Đổi ảnh</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center text-gray-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs leading-tight">{placeholder}</span>
          </div>
        )}

        {/* Upload spinner overlay */}
        {isUploading && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-white/80 ${isCircle ? "rounded-full" : "rounded-lg"}`}
          >
            <svg
              className="h-6 w-6 animate-spin text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
