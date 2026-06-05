"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  type NotificationDto,
} from "../../lib/features/notifications/notificationsApi";
import { formatDateTime } from "@/lib/i18nFormat";

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetNotificationsQuery({ limit: 20 });
  const [markRead] = useMarkReadMutation();

  async function handleMarkAllRead() {
    await markRead({ all: true });
  }

  async function handleItemClick(n: NotificationDto) {
    if (!n.isRead) {
      await markRead({ ids: [n.id] });
    }
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
    onClose();
  }

  const items = data?.items ?? [];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
          Thông báo
        </h3>
        {items.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            Đọc tất cả
          </button>
        )}
      </div>

      {/* List */}
      <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {isLoading && (
          <li className="px-4 py-8 text-center text-sm text-gray-500">
            Đang tải…
          </li>
        )}
        {!isLoading && items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">
            Không có thông báo nào
          </li>
        )}
        {items.map((n: NotificationDto) => (
          <li key={n.id}>
            <button
              onClick={() => handleItemClick(n)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                !n.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  !n.isRead
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {n.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {n.body}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDateTime(n.createdAt)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
