"use client";

import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useGetSessionsQuery, useRevokeSessionMutation } from "@/lib/features/users/usersApi";

function DeviceIcon({ isCurrent }: { isCurrent: boolean }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      style={isCurrent ? { background: "rgba(21,101,192,0.12)" } : { background: "#F3F4F6" }}
    >
      <svg
        className="h-5 w-5"
        style={{ color: isCurrent ? "var(--brand-blue)" : "#9CA3AF" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading, isError } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await revokeSession(id).unwrap();
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/profile?tab=settings"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--brand-blue)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại hồ sơ
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thiết bị đang đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý và thu hồi quyền truy cập từ các thiết bị khác.
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Không thể tải danh sách phiên. Vui lòng thử lại.
          </div>
        )}

        {/* Empty */}
        {sessions && sessions.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Không có phiên nào đang hoạt động.
          </div>
        )}

        {/* Session list */}
        {sessions && sessions.length > 0 && (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`flex items-center gap-4 rounded-xl border p-4 bg-white ${
                  session.isCurrentDevice
                    ? "border-blue-200 shadow-sm"
                    : "border-gray-200"
                }`}
              >
                <DeviceIcon isCurrent={session.isCurrentDevice} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {session.deviceId ?? "Thiết bị không xác định"}
                    </span>
                    {session.isCurrentDevice && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "var(--brand-blue)" }}
                      >
                        Thiết bị này
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Đăng nhập{" "}
                    {formatDistanceToNow(parseISO(session.createdAt), { addSuffix: true, locale: vi })}
                    {" · "}Hết hạn{" "}
                    {formatDistanceToNow(parseISO(session.expiresAt), { addSuffix: true, locale: vi })}
                  </p>
                </div>

                {!session.isCurrentDevice && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    {revoking === session.id ? "Đang thu hồi..." : "Thu hồi"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

