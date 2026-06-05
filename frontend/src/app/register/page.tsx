"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRegisterMutation } from "@/lib/features/auth/authApi";
import { setCredentials } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const t = useTranslations();

  const schema = z
    .object({
      fullName: z.string().min(2, t("errors.name_min")),
      email: z.string().email(t("errors.email_invalid")),
      password: z
        .string()
        .min(8, t("errors.password_min", { min: 8 }))
        .regex(/[A-Z]/, t("auth.password_hint_upper"))
        .regex(/[0-9]/, t("auth.password_hint_number")),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("errors.password_mismatch"),
      path: ["confirmPassword"],
    });
  type FormData = z.infer<typeof schema>;

  const STEPS = [
    { num: 1, label: t("register_steps.step1") },
    { num: 2, label: t("register_steps.step2") },
    { num: 3, label: t("register_steps.step3") },
  ];

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const result = await register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      }).unwrap();
      Cookies.set("refreshToken", result.refreshToken, { expires: 30, sameSite: "strict" });
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      router.push("/");
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string }; status?: number };
      const message =
        apiError?.data?.error ??
        (apiError?.status === 409 ? t("auth.email_exists") : t("errors.server_error"));
      setError("root", { message });
    }
  }

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
            <p className="mt-2 text-lg text-blue-100">{t("auth.steps_subheading")}</p>
          </div>

          <p className="mb-4 text-sm font-medium text-blue-200 uppercase tracking-wide">
            {t("auth.steps_intro")}
          </p>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.num} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {s.num}
                </span>
                <span className="text-sm text-blue-50">{s.label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-xl bg-white/10 p-4">
            <p className="text-2xl font-bold">2,100+</p>
            <p className="text-sm text-blue-100">{t("auth.students_count")}</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md fade-up">
          {/* Mobile logo */}
          <div className="mb-6 lg:hidden text-center">
            <span className="text-3xl font-bold" style={{ color: "var(--brand-blue)" }}>MLS</span>
          </div>

          <h1 className="mb-1 text-2xl font-bold text-gray-900">{t("auth.create_account")}</h1>
          <p className="mb-6 text-sm text-gray-500">
            {t("auth.have_account_login")}{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--brand-blue)" }}>
              {t("auth.login")}
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.full_name")}</label>
              <input
                {...field("fullName")}
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.email")}</label>
              <input
                {...field("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.password")}</label>
                <input
                  {...field("password")}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("auth.confirm_password")}</label>
                <input
                  {...field("confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>
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
              {isLoading ? t("auth.creating_account") : t("auth.create_account_free")}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">{t("auth.or_register_with")}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLoginButton onError={(msg) => setError("root", { message: msg })} />
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            {t("auth.terms_agreement")}{" "}
            <a href="#" className="underline">{t("auth.terms_of_service")}</a>{" "}
            {t("common.and")}{" "}<a href="#" className="underline">{t("auth.privacy_policy")}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

