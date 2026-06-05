"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import {
  useGetUserDetailQuery,
  useUpdateUserMutation,
  useUploadUserAvatarMutation,
} from "@/lib/features/admin/adminApi";

interface Props {
  userId: string;
  userRole: string;
  onClose: () => void;
  onSaved?: () => void;
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const STUDENT_LEVELS = [
  { value: "A1", label: "A1 — Sơ cấp (Level 1–2)" },
  { value: "A2", label: "A2 — Cơ bản (Level 2–3)" },
  { value: "B1", label: "B1 — Trung cấp (Level 4)" },
  { value: "B2", label: "B2 — Trên trung cấp (Level 5)" },
  { value: "C1", label: "C1 — Nâng cao (Level 6)" },
];

const LEVEL_BADGE: Record<string, string> = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-blue-100 text-blue-700",
  B1: "bg-purple-100 text-purple-700",
  B2: "bg-orange-100 text-orange-700",
  C1: "bg-red-100 text-red-700",
  C2: "bg-gray-800 text-white",
};

export function AdminProfileEditModal({ userId, userRole, onClose, onSaved }: Props) {
  const t = useTranslations("admin_profile_edit");
  const { data: user, isLoading } = useGetUserDetailQuery(userId);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [uploadAvatar] = useUploadUserAvatarMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTeacher = userRole === "Teacher";
  const showLevel = userRole === "Student" || userRole === "Teacher";

  useEffect(() => {
    if (user) {
      setName(user.fullName ?? "");
      setPhone(user.phone ?? "");
      setDob(user.dateOfBirth ?? "");
      setGender(user.gender ?? "");
      setAddress(user.address ?? "");
      setCurrentLevel(user.currentLevel ?? "");
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  async function handleAvatarUpload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatar({ userId, formData: fd }).unwrap();
    setAvatarUrl(res.avatarUrl);
    return res.avatarUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await updateUser({
        userId,
        fullName: name,
        phone: phone || undefined,
        dateOfBirth: dob || null,
        gender: gender || null,
        address: address || null,
        currentLevel: currentLevel || null,
      }).unwrap();
      setMsg({ type: "success", text: t("toast_ok") });
      onSaved?.();
    } catch {
      setMsg({ type: "error", text: t("toast_fail") });
    }
  }

  const initials = name
    ? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isTeacher ? t("subtitle_teacher") : t("subtitle_student")} · {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate className="space-y-5 p-6">
            {/* Avatar + name preview */}
            <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
              <ImageUpload
                value={avatarUrl}
                onChange={(url) => setAvatarUrl(url)}
                uploadFn={handleAvatarUpload}
                shape="circle"
                placeholder={initials}
                className="h-20 w-20 shrink-0"
              />
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900">{name || user?.fullName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {user?.currentLevel && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LEVEL_BADGE[user.currentLevel] ?? "bg-gray-100 text-gray-600"}`}>
                      {user.currentLevel}
                    </span>
                  )}
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {userRole}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{t("avatar_hint")}</p>
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("field_fullname")}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  type="text"
                  className={inputCls}
                />
              </Field>
              <Field label={t("field_phone")}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder={t("phone_ph")}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("field_dob")}>
                <input
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  type="date"
                  className={inputCls}
                />
              </Field>
              <Field label={t("field_gender")}>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                  <option value="">{t("gender_default")}</option>
                  <option value="Male">{t("gender_male")}</option>
                  <option value="Female">{t("gender_female")}</option>
                  <option value="Other">{t("gender_other")}</option>
                </select>
              </Field>
            </div>

            <Field label={t("field_address")}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                type="text"
                placeholder={t("address_ph")}
                className={inputCls}
              />
            </Field>

            {/* Level — only for students & teachers */}
            {showLevel && (
              <Field label={isTeacher ? t("field_vn_level_teacher") : t("field_vn_level_student")}>
                <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} className={inputCls}>
                  <option value="">{t("level_default")}</option>
                  {STUDENT_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Teacher note */}
            {isTeacher && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <p className="font-medium">{t("teacher_profile_box_title")}</p>
                <p className="mt-0.5 text-indigo-600">
                  {t("teacher_profile_box_body")}
                  {" "}<span className="font-medium">{t("teacher_profile_link")}</span> của giáo viên.
                </p>
              </div>
            )}

            {/* Message */}
            {msg && (
              <div className={`rounded-lg px-4 py-2.5 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("btn_cancel")}
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSaving ? t("btn_saving") : t("btn_save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
