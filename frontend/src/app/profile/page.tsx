"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Suspense } from "react";
import ImageUpload from "@/components/ImageUpload";
import { safeImgUrl } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useGetMyTeacherProfileQuery,
  useUpdateMyTeacherProfileMutation,
  useUploadTeacherProfileImageMutation,
  type UpdateProfileRequest,
  type UpdateMyTeacherProfileRequest,
} from "@/lib/features/users/usersApi";

// ── Tabs ───────────────────────────────────────────────────
const BASE_TABS = [
  { id: "info",     labelKey: "profile.tabs.info" },
  { id: "courses",  labelKey: "profile.tabs.courses" },
  { id: "badges",   labelKey: "profile.tabs.badges" },
  { id: "settings", labelKey: "profile.tabs.settings" },
] as const;
const TEACHER_TAB = { id: "teacher", labelKey: "profile.tabs.teacher" } as const;
type TabId = (typeof BASE_TABS)[number]["id"] | "teacher";

// ── Schema types (defined per-component using t()) ──────────
type InfoForm = {
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  currentLevel?: string;
};

type PwForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// ── Level badge color ──────────────────────────────────────
function levelBadgeClass(level: string | null): string {
  const map: Record<string, string> = {
    A1: "bg-green-100 text-green-700",
    A2: "bg-blue-100 text-blue-700",
    B1: "bg-purple-100 text-purple-700",
    B2: "bg-orange-100 text-orange-700",
    C1: "bg-red-100 text-red-700",
    C2: "bg-gray-800 text-white",
  };
  return level ? (map[level] ?? "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-500";
}

// ── Input component ────────────────────────────────────────
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

// ── Tab: Thông tin ─────────────────────────────────────────
function InfoTab({ profile }: { profile: ReturnType<typeof useGetMyProfileQuery>["data"] }) {  const t = useTranslations();  const infoSchema = z.object({
    fullName:     z.string().min(2, t("errors.name_min")),
    phone:        z.string().optional(),
    dateOfBirth:  z.string().optional(),
    gender:       z.string().optional(),
    address:      z.string().optional(),
    currentLevel: z.string().optional(),
  });  const [updateProfile, { isLoading: isSaving, isSuccess }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<InfoForm>({ resolver: zodResolver(infoSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        fullName:     profile.fullName ?? "",
        phone:        profile.phone ?? "",
        dateOfBirth:  profile.dateOfBirth ?? "",
        gender:       profile.gender ?? "",
        address:      profile.address ?? "",
        currentLevel: profile.currentLevel ?? "",
      });
    }
  }, [profile, reset]);

  async function onSubmit(data: InfoForm) {
    const payload: UpdateProfileRequest = {
      fullName:     data.fullName,
      phone:        data.phone || null,
      dateOfBirth:  data.dateOfBirth || null,
      gender:       data.gender || null,
      address:      data.address || null,
      currentLevel: data.currentLevel || null,
    };
    await updateProfile(payload).unwrap();
    reset(data);
  }

  async function handleAvatarUpload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatar(fd).unwrap();
    return (res as unknown as { avatarUrl: string }).avatarUrl ?? "";
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <ImageUpload
          value={profile?.avatarUrl ?? null}
          onChange={() => {}}
          uploadFn={handleAvatarUpload}
          shape="circle"
          placeholder={initials}
          className="h-20 w-20"
        />
        <div>
          <p className="text-base font-semibold text-gray-900">{profile?.fullName}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          {profile?.currentLevel && (
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelBadgeClass(profile.currentLevel)}`}>
              {profile.currentLevel}
            </span>
          )}
          {isUploading && <p className="mt-1 text-xs text-gray-400">{t("profile.uploading")}</p>}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={`${t("profile.full_name")} *`} error={errors.fullName?.message}>
            <input {...register("fullName")} type="text" className={inputCls} />
          </Field>
          <Field label={t("profile.phone")}>
            <input {...register("phone")} type="tel" placeholder={t("profile.phone_placeholder")} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("profile.dob")}>
            <input {...register("dateOfBirth")} type="date" className={inputCls} />
          </Field>
          <Field label={t("profile.gender")}>
            <select {...register("gender")} className={inputCls}>
              <option value="">{t("profile.gender_select")}</option>
              <option value="Male">{t("profile.gender_male")}</option>
              <option value="Female">{t("profile.gender_female")}</option>
              <option value="Other">{t("profile.gender_other")}</option>
            </select>
          </Field>
        </div>

        <Field label={t("profile.address")}>
          <input {...register("address")} type="text" placeholder={t("profile.address_placeholder")} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("auth.email")}>
            <input value={profile?.email ?? ""} type="email" readOnly
              className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
          </Field>
          <Field label={t("profile.level")}>
            <select {...register("currentLevel")} className={inputCls}>
              <option value="">{t("profile.level_select")}</option>
              <option value="A1">A1 — Sơ cấp (Level 1–2)</option>
              <option value="A2">A2 — Cơ bản (Level 2–3)</option>
              <option value="B1">B1 — Trung cấp (Level 4)</option>
              <option value="B2">B2 — Trên trung cấp (Level 5)</option>
              <option value="C1">C1 — Nâng cao (Level 6)</option>
            </select>
          </Field>
        </div>

        {isSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            {t("profile.update_success")}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand-blue)" }}
        >
          {isSaving ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

// ── Tab: Profile giáo viên ───────────────────────────────────────────
function TeacherProfileTab() {
  const t = useTranslations();
  const [update, { isLoading: isSaving, isSuccess }] = useUpdateMyTeacherProfileMutation();
  const [uploadTeacherImage] = useUploadTeacherProfileImageMutation();
  const { data: tp, isLoading } = useGetMyTeacherProfileQuery();

  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [expYears, setExpYears] = useState("0");
  const [specialization, setSpecialization] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ttUrl, setTtUrl] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (tp) {
      setDisplayName(tp.displayName ?? "");
      setSlug(tp.slug ?? "");
      setHeadline(tp.headline ?? "");
      setBio(tp.bio ?? "");
      setAvatarUrl(tp.avatarUrl ?? "");
      setCoverUrl(tp.coverUrl ?? "");
      setExpYears(String(tp.experienceYears ?? 0));
      setSpecialization(tp.specialization ?? "");
      setFbUrl(tp.facebookUrl ?? "");
      setYtUrl(tp.youtubeUrl ?? "");
      setTtUrl(tp.tiktokUrl ?? "");
      setWsUrl(tp.websiteUrl ?? "");
      setIsPublic(tp.isPublic ?? true);
    }
  }, [tp]);

  if (isLoading) return <div className="text-sm text-gray-400">{t("common.loading")}</div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpdateMyTeacherProfileRequest = {
      displayName, slug, headline: headline || null, bio: bio || null,
      avatarUrl: avatarUrl || null, coverUrl: coverUrl || null,
      experienceYears: parseInt(expYears) || 0,
      specialization: specialization || null,
      facebookUrl: fbUrl || null, youtubeUrl: ytUrl || null,
      tiktokUrl: ttUrl || null, websiteUrl: wsUrl || null,
      isPublic,
    };
    await update(payload).unwrap();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {tp?.isVerified && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t("profile.teacher.verified")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("profile.teacher.display_name")}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} placeholder="Thầy Nguyễn Văn A" />
        </Field>
        <Field label={t("profile.teacher.slug_label")}>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="nguyen-van-a" />
        </Field>
      </div>

      <Field label={t("profile.teacher.headline")}>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} placeholder="Giáo viên Tiếng Việt với 10 năm kinh nghiệm" />
      </Field>

      <Field label={t("profile.teacher.bio")}>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
          className={`${inputCls} resize-y`} placeholder="Viết vài dòng về bản thân, phương pháp giảng dạy..." />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("profile.avatar")}>
          <div className="flex items-center gap-4">
            <ImageUpload
              value={avatarUrl || null}
              onChange={(url) => setAvatarUrl(url ?? "")}
              uploadFn={async (file) => {
                const fd = new FormData();
                fd.append("file", file);
                const res = await uploadTeacherImage({ type: "avatar", formData: fd }).unwrap();
                return res.url;
              }}
              shape="circle"
              placeholder="Tải ảnh đại diện"
            />
            <p className="text-xs text-gray-400">{t("profile.teacher.avatar_hint")}</p>
          </div>
        </Field>
        <Field label={t("profile.avatar")}>
          <div className="flex flex-col gap-2">
            <ImageUpload
              value={coverUrl || null}
              onChange={(url) => setCoverUrl(url ?? "")}
              uploadFn={async (file) => {
                const fd = new FormData();
                fd.append("file", file);
                const res = await uploadTeacherImage({ type: "cover", formData: fd }).unwrap();
                return res.url;
              }}
              shape="rect"
              placeholder="Tải ảnh bìa"
              className="max-w-sm"
            />
            <p className="text-xs text-gray-400">{t("profile.teacher.cover_hint")}</p>
          </div>
        </Field>
        <Field label={t("profile.teacher.exp_years")}>
          <input type="number" value={expYears} onChange={(e) => setExpYears(e.target.value)} className={inputCls} min="0" />
        </Field>
        <Field label={t("profile.teacher.specialization")}>
          <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className={inputCls} placeholder="Tiếng Việt giao tiếp" />
        </Field>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("profile.teacher.social_networks")}</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook"><input value={fbUrl} onChange={(e) => setFbUrl(e.target.value)} className={inputCls} placeholder="https://facebook.com/..." /></Field>
          <Field label="YouTube"><input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} className={inputCls} placeholder="https://youtube.com/..." /></Field>
          <Field label="TikTok"><input value={ttUrl} onChange={(e) => setTtUrl(e.target.value)} className={inputCls} placeholder="https://tiktok.com/@..." /></Field>
          <Field label="Website"><input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} className={inputCls} placeholder="https://..." /></Field>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4" />
        {t("profile.teacher.public_profile_label")}
      </label>

      {isSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          {t("profile.teacher.save_success")}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={isSaving}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand-blue)" }}>
        {isSaving ? t("common.saving") : t("common.save")}
        </button>
        {tp?.slug && (
          <Link href={`/giao-vien/${tp.slug}`}
            className="text-sm text-blue-600 hover:underline">{t("profile.teacher.view_public")}</Link>
        )}
      </div>
    </form>
  );
}

// ── Tab: Khoá học ──────────────────────────────────────────────
function CoursesTab() {
  const t = useTranslations();
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="text-sm text-gray-500">{t("profile.no_courses")}</p>
      <Link
        href="/courses"
        className="mt-3 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ background: "var(--brand-blue)" }}
      >
        {t("profile.explore_courses")}
      </Link>
    </div>
  );
}

// ── Tab: Huy hiệu ──────────────────────────────────────────
const PLACEHOLDER_BADGES = [
  { id: "1", name: "Ngày đầu tiên", icon: "🌱", desc: "Đã đăng ký tài khoản", earned: true },
  { id: "2", name: "Học 7 ngày liên tiếp", icon: "🔥", desc: "Streak 7 ngày", earned: false },
  { id: "3", name: "Hoàn thành Level 1",    icon: "🎓", desc: "Vượt qua Exit Test Level 1", earned: false },
  { id: "4", name: "Điểm Nói 90+",          icon: "🎤", desc: "AI chấm Speaking ≥ 90", earned: false },
];

function BadgesTab() {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {PLACEHOLDER_BADGES.map((b) => (
        <div
          key={b.id}
          className={`rounded-xl border p-4 text-center transition ${
            b.earned
              ? "border-blue-200 bg-blue-50"
              : "border-gray-200 bg-gray-50 opacity-50 grayscale"
          }`}
        >
          <div className="mb-2 text-4xl">{b.icon}</div>
          <p className="text-sm font-semibold text-gray-800">{b.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">{b.desc}</p>
          {b.earned && (
            <span className="mt-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{t("profile.badges.earned")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Cài đặt ───────────────────────────────────────────
function SettingsTab() {
  const t = useTranslations();
  const pwSchema = z
    .object({
      currentPassword: z.string().min(1, t("errors.required")),
      newPassword:     z.string().min(8, t("errors.password_min", { min: 8 })),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t("errors.password_mismatch"),
      path: ["confirmPassword"],
    });
  const [changePw, { isLoading, isSuccess: pwSuccess, error: pwError }] = useChangePasswordMutation();
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  async function onPwSubmit(data: PwForm) {
    await changePw({ currentPassword: data.currentPassword, newPassword: data.newPassword }).unwrap();
    reset();
  }

  const errMsg = pwError && "data" in pwError
    ? (pwError.data as { error?: string })?.error ?? t("errors.server_error")
    : null;

  return (
    <div className="space-y-8">
      {/* Change password */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">{t("profile.settings.change_password")}</h3>
        <form onSubmit={handleSubmit(onPwSubmit)} noValidate className="space-y-4 max-w-md">
          <Field label={t("profile.settings.current_password")} error={errors.currentPassword?.message}>
            <input {...register("currentPassword")} type="password" autoComplete="current-password" className={inputCls} />
          </Field>
          <Field label={t("profile.settings.new_password")} error={errors.newPassword?.message}>
            <input {...register("newPassword")} type="password" autoComplete="new-password" className={inputCls} />
          </Field>
          <Field label={t("profile.settings.confirm_password")} error={errors.confirmPassword?.message}>
            <input {...register("confirmPassword")} type="password" autoComplete="new-password" className={inputCls} />
          </Field>

          {errMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{errMsg}</div>
          )}
          {pwSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            {t("profile.settings.change_password_success")}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand-blue)" }}
          >
            {isLoading ? t("common.saving") : t("profile.settings.change_password")}
          </button>
        </form>
      </section>

      {/* Sessions */}
      <section className="border-t border-gray-200 pt-6">
        <h3 className="mb-1 text-base font-semibold text-gray-900">{t("profile.settings.devices")}</h3>
        <p className="mb-3 text-sm text-gray-500">{t("profile.settings.devices_desc")}</p>
        <Link
          href="/settings/sessions"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t("profile.settings.manage_devices")}
        </Link>
      </section>

      {/* Email verify */}
      <section className="border-t border-gray-200 pt-6">
        <h3 className="mb-1 text-base font-semibold text-gray-900">{t("profile.settings.verify_email")}</h3>
        <p className="mb-3 text-sm text-gray-500">{t("profile.settings.verify_email_desc")}</p>
        <Link
          href="/verify-email"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t("profile.settings.verify_email_btn")}
        </Link>
      </section>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const isHydrated  = useAppSelector((s) => s.auth.isHydrated);
  const userRole    = useAppSelector((s) => s.auth.user?.role);
  const isTeacher   = userRole === "Teacher";
  const t = useTranslations();

  const TABS = isTeacher
    ? [...BASE_TABS.slice(0, 1), TEACHER_TAB, ...BASE_TABS.slice(1)]
    : [...BASE_TABS];

  const [activeTab, setActiveTab] = useState<TabId>("info");

  useEffect(() => {
    if (isHydrated && !accessToken) router.replace("/login");
  }, [isHydrated, accessToken, router]);

  const { data: profile, isLoading } = useGetMyProfileQuery(undefined, { skip: !accessToken });

  // Show "verified" toast
  const verified = searchParams.get("verified") === "1";

  if (!isHydrated) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-400">{t("common.loading")}</div>;
  }
  if (!accessToken) return null;
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
      {/* Hero banner */}
      <div
        className="h-28"
        style={{ background: "linear-gradient(135deg, var(--brand-blue-dark) 0%, var(--brand-blue) 100%)" }}
      />

      <div className="mx-auto max-w-3xl px-4">
        {/* Avatar row */}
        <div className="-mt-10 mb-4 flex items-start gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white text-2xl font-bold text-white shadow-md"
            style={{ background: "var(--brand-blue)" }}
          >
            {profile?.avatarUrl ? (
              <img src={safeImgUrl(profile.avatarUrl)!} alt="avatar" className="h-full w-full rounded-full object-cover" />
            ) : initials}
          </div>
          <div className="pt-10">
            <h1 className="text-xl font-bold text-gray-900">{profile?.fullName}</h1>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Verified toast */}
        {verified && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {t("profile.email_verified")}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              style={activeTab === tab.id ? { background: "var(--brand-blue)" } : {}}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
          {activeTab === "info"     && <InfoTab profile={profile} />}
          {activeTab === "teacher"  && isTeacher && <TeacherProfileTab />}
          {activeTab === "courses"  && <CoursesTab />}
          {activeTab === "badges"   && <BadgesTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}

