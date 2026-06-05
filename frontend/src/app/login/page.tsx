"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Cookies from "js-cookie";
import { useLoginMutation } from "@/lib/features/auth/authApi";
import { setCredentials } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useTranslations } from "next-intl";

function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const schema = z.object({
    email: z.string().email(t("errors.email_invalid")),
    password: z.string().min(1, t("errors.required")),
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const result = await login(data).unwrap();
      Cookies.set("refreshToken", result.refreshToken, { expires: 30, sameSite: "strict" });
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));

      // II-8: If user has a saved preferred locale in their profile, apply it to the cookie
      if (result.user?.preferredLocale) {
        Cookies.set("NEXT_LOCALE", result.user.preferredLocale, {
          expires: 365,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      } else {
        // Sync current cookie locale to user's profile on the backend (fire-and-forget)
        const currentLocale = Cookies.get("NEXT_LOCALE");
        if (currentLocale && result.accessToken) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009"}/api/v1/users/me/locale`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${result.accessToken}`,
              "X-Tenant-Slug": "demo",
            },
            body: JSON.stringify({ locale: currentLocale }),
          }).catch(() => {/* non-critical */});
        }
      }

      const next = searchParams.get("next");
      if (next) {
        router.push(next);
      } else {
        const role = result.user?.role ?? "";
        const isUserFacing = role === "Student" || role === "Teacher";
        router.push(isUserFacing ? "/" : "/admin");
      }
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string }; status?: number };
      const message =
        apiError?.data?.error ??
        (apiError?.status === 401 ? t("auth.wrong_credentials") : t("errors.server_error"));
      setError("root", { message });
    }
  }

  const resetSuccess = searchParams.get("reset") === "1";

  const features = [
    t("features.cefr"),
    t("features.ai_scoring"),
    t("features.anywhere"),
    t("features.certificate"),
  ];

  return (
    <div className="w-full max-w-md fade-up">
      {/* Mobile logo */}
      <div className="mb-8 lg:hidden text-center">
        <span className="text-3xl font-bold" style={{ color: "var(--brand-blue)" }}>MLS</span>
        <p className="mt-1 text-sm text-gray-500">{t("auth.platform_desc")}</p>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-gray-900">{t("auth.login_title")}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {t("auth.no_account")}{" "}
        <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--brand-blue)" }}>
          {t("auth.register_free")}
        </Link>
      </p>

      {resetSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {t("auth.reset_success")}
        </div>
      )}

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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">{t("auth.password")}</label>
            <Link href="/forgot-password" className="text-xs font-medium" style={{ color: "var(--brand-blue)" }}>
              {t("auth.forgot_password")}
            </Link>
          </div>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--brand-blue)" }}
        >
          {isLoading ? t("common.loading") : t("auth.login")}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">{t("auth.or_continue_with")}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLoginButton onError={(msg) => setError("root", { message: msg })} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();

  const features = [
    t("features.cefr"),
    t("features.ai_scoring"),
    t("features.anywhere"),
    t("features.certificate"),
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Left panel — brand hero */}
      <div
        className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col items-center justify-center p-12 text-white"
        style={{ background: "linear-gradient(135deg, var(--brand-blue-dark) 0%, var(--brand-blue) 60%, var(--brand-blue-light) 100%)" }}
      >
        <div className="max-w-sm w-full">
          <div className="mb-8">
            <span className="text-4xl font-bold">MLS</span>
            <p className="mt-2 text-lg text-blue-100">{t("auth.platform_desc")}</p>
          </div>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-blue-50">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-xl bg-white/10 p-4 text-sm text-blue-100">
            "Nền tảng giúp tôi học tiếng Việt hiệu quả hơn bất kỳ app nào tôi từng dùng!"
            <div className="mt-2 font-semibold text-white">— Nguyễn Minh, học viên Level 4</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

