"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVerifyEmailMutation, useResendVerificationMutation } from "@/lib/features/auth/authApi";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();

  function handleChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length < 6) { setError("Vui lòng nhập đầy đủ 6 chữ số."); return; }
    setError(null);
    try {
      await verifyEmail({ code: otp }).unwrap();
      router.push("/profile?verified=1");
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string } };
      setError(apiError?.data?.error ?? "Mã xác thực không đúng hoặc đã hết hạn.");
    }
  }

  async function handleResend() {
    try {
      await resendVerification().unwrap();
      setResent(true);
      setError(null);
    } catch {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md fade-up">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(21,101,192,0.1)" }}
            >
              <svg className="h-8 w-8" style={{ color: "var(--brand-blue)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Xác thực email</h1>
            <p className="mt-2 text-sm text-gray-500">
              Nhập mã <strong>6 chữ số</strong> đã được gửi đến email của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6 flex justify-center gap-2.5" onPaste={handlePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-14 w-12 rounded-xl border-2 text-center text-xl font-bold outline-none transition"
                  style={{
                    borderColor: digit ? "var(--brand-blue)" : "#D1D5DB",
                    color: "var(--brand-blue)",
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {error}
              </div>
            )}
            {resent && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
                Đã gửi lại mã xác thực!
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--brand-blue)" }}
            >
              {isLoading ? "Đang xác thực..." : "Xác thực"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-gray-500">Không nhận được mã?</span>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="font-medium hover:underline disabled:opacity-50"
              style={{ color: "var(--brand-blue)" }}
            >
              {isResending ? "Đang gửi..." : "Gửi lại"}
            </button>
          </div>

          <div className="mt-3 text-center">
            <Link href="/profile" className="text-sm text-gray-400 hover:text-gray-600">
              Bỏ qua, xác thực sau
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

