"use client";

import { useListMyGroupsQuery } from "@/lib/features/chat/chatApi";
import Image from "next/image";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export default function GroupSidebar({ selectedId, onSelect, onCreate }: Props) {
  const { data: groups = [], isLoading } = useListMyGroupsQuery();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Nhóm của tôi</h2>
        <button
          onClick={onCreate}
          className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Tạo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-gray-500">Đang tải…</p>}
        {!isLoading && groups.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Bạn chưa tham gia nhóm nào.</p>
        )}
        <ul>
          {groups.map((g) => {
            const active = g.id === selectedId;
            return (
              <li key={g.id}>
                <button
                  onClick={() => onSelect(g.id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                    active ? "bg-indigo-50 dark:bg-indigo-950" : ""
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {g.avatarUrl ? (
                      <Image src={g.avatarUrl} alt={g.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {g.name}
                      </span>
                      {g.unreadCount > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {g.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {g.lastMessagePreview ?? "(chưa có tin nhắn)"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
