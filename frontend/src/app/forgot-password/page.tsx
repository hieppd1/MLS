"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/lib/features/auth/authApi";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const t = useTranslations();

  const schema = z.object({ email: z.string().email(t("errors.email_invalid")) });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await forgotPassword(data).unwrap();
    } catch {
      // Always show success to prevent email enumeration
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md fade-up">
        {/* Back link */}
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
          {sent ? (
            <div className="text-center py-4">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "rgba(21,101,192,0.1)" }}
              >
                <svg className="h-8 w-8" style={{ color: "var(--brand-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t("auth.check_inbox_title")}</h2>
              <p className="mt-2 text-sm text-gray-500">
                {t("auth.check_inbox_desc")} <strong>{t("auth.check_inbox_spam")}</strong>.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--brand-blue)" }}
              >
                {t("auth.back_to_login_btn")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(21,101,192,0.1)" }}
                >
                  <svg className="h-8 w-8" style={{ color: "var(--brand-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{t("auth.forgot_title")}</h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t("auth.forgot_desc")}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.email")}</label>
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: "var(--brand-blue)" }}
                >
                  {isLoading ? t("auth.forgot_sending") : t("auth.forgot_submit")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

