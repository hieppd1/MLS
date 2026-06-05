"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/i18nFormat";
import {
  useGetApprovalsQuery,
  usePublishCourseMutation,
  type ApprovalQueueItem,
} from "@/lib/features/cms/cmsApi";
import { useTranslations } from "next-intl";

const LEVEL_LABELS: Record<number, string> = {
  1: "Sơ cấp 1", 2: "Sơ cấp 2",
  3: "Trung cấp 1", 4: "Trung cấp 2",
  5: "Cao cấp 1", 6: "Cao cấp 2",
};

export default function AdminApprovalsPage() {
  const t = useTranslations("admin_approvals");
  const { data: approvals, isLoading, refetch } = useGetApprovalsQuery();
  const [publishCourse] = usePublishCourseMutation();
  const [processing, setProcessing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  async function handleAction(courseId: string, approve: boolean) {
    setProcessing(courseId);
    try {
      await publishCourse({ id: courseId, approve }).unwrap();
      showMsg("success", approve ? t("toast_approve_ok") : t("toast_reject_ok"));
      refetch();
    } catch {
      showMsg("error", t("toast_action_fail"));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t("title")}</h1>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !approvals?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("col_course")}</th>
                <th className="px-4 py-3">{t("col_level")}</th>
                <th className="px-4 py-3">{t("col_sent_at")}</th>
                <th className="px-4 py-3 text-right">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {approvals.map((item: ApprovalQueueItem) => (
                <tr key={item.courseId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/admin/courses/${item.courseId}`} className="hover:text-blue-600">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {LEVEL_LABELS[item.level] ?? `Level ${item.level}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.updatedAt
                      ? formatDateTime(item.updatedAt)
                      : formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/courses/${item.courseId}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        {t("btn_view")}
                      </Link>
                      <button
                        onClick={() => handleAction(item.courseId, true)}
                        disabled={processing === item.courseId}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === item.courseId ? "..." : t("btn_approve")}
                      </button>
                      <button
                        onClick={() => handleAction(item.courseId, false)}
                        disabled={processing === item.courseId}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {t("btn_reject")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
