"use client";

import { useState } from "react";
import { useCreateGroupMutation, type ChatGroupType } from "@/lib/features/chat/chatApi";
import { showToast } from "@/components/ui/Toaster";

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ChatGroupType>("Public");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(12);
  const [tags, setTags] = useState("");
  const [create, { isLoading }] = useCreateGroupMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await create({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        maxMembers,
        tags: tags.trim() || undefined,
      }).unwrap();
      onCreated(res.id);
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? "Tạo nhóm thất bại.";
      showToast(msg, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Tạo nhóm mới</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tên nhóm *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Loại</label>
            <div className="flex gap-2">
              {(["Public", "Private"] as ChatGroupType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                    type === t
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {t === "Public" ? "Công khai" : "Riêng tư (cần duyệt)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Số thành viên tối đa</label>
              <input
                type="number"
                min={2}
                max={500}
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 12)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tags (CSV)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="opic, vstep…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isLoading ? "Đang tạo…" : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
