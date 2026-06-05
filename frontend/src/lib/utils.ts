const _MEDIA_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009") + "/media";

/**
 * Converts a storage path to a displayable URL:
 * - null / undefined / blob: → null
 * - already-absolute http(s):// URL → returned as-is
 * - relative path (e.g. "demo/avatars/abc.png") → prefixed with backend /media base
 */
export function safeImgUrl(url: string | null | undefined): string | null {
  if (!url || url.startsWith("blob:")) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative storage path → full backend media URL (strip leading slashes and any leading "media/" prefix)
  const normalized = url.replace(/^\/+/, "").replace(/^media\//, "");
  return `${_MEDIA_BASE}/${normalized}`;
}
