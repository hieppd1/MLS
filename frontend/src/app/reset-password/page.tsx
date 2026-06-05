"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useResetPasswordMutation } from "@/lib/features/auth/authApi";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const t = useTranslations();

  const schema = z
    .object({
      newPassword: z.string().min(8, t("errors.password_min", { min: 8 })),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t("errors.password_mismatch"),
      path: ["confirmPassword"],
    });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, setError, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!token) {
      setError("root", { message: t("auth.invalid_token") });
      return;
    }
    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap();
      router.push("/login?reset=1");
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string } };
      setError("root", { message: apiError?.data?.error ?? t("auth.invalid_token") });
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md fade-up">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--brand-blue)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("auth.back_to_login")}
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(21,101,192,0.1)" }}
            >
              <svg className="h-8 w-8" style={{ color: "var(--brand-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("auth.reset_title")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("auth.reset_desc")}</p>
          </div>

          {!token && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {t("auth.invalid_token")}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.new_password")}</label>
              <input
                {...register("newPassword")}
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.password_placeholder")}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.confirm_new_password")}</label>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {errors.root && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--brand-blue)" }}
            >
              {isLoading ? t("auth.reset_updating") : t("auth.reset_submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

