"use client";

import { useState, useRef } from "react";
import { useAppSelector } from "../../lib/hooks";
import { selectIsAuthenticated } from "../../lib/features/auth/authSlice";
import {
  useVerifyCodeMutation,
  useActivateCodeMutation,
} from "../../lib/features/activation/activationApi";
import BookSubNav from "../../components/books/BookSubNav";
import Link from "next/link";

const CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default function KichHoatPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verified" | "done">("input");
  const [verifyInfo, setVerifyInfo] = useState<{
    bookTitle: string;
    bookType: string;
  } | null>(null);
  const [result, setResult] = useState<{
    bookTitle: string;
    bookSlug: string;
    bookType: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [verifyCode, { isLoading: isVerifying }] = useVerifyCodeMutation();
  const [activateCode, { isLoading: isActivating }] = useActivateCodeMutation();

  // Format code as user types: XXXX-XXXX-XXXX-XXXX
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 16);
    const formatted =
      raw.match(/.{1,4}/g)?.join("-") ?? raw;
    setCode(formatted);
    setError(null);
    if (step !== "input") setStep("input");
    setVerifyInfo(null);
  };

  const handleVerify = async () => {
    setError(null);
    if (!CODE_PATTERN.test(code)) {
      setError("Vui lòng nhập đúng định dạng mã: XXXX-XXXX-XXXX-XXXX");
      return;
    }
    try {
      const res = await verifyCode({ code }).unwrap();
      if (res.valid) {
        setVerifyInfo({
          bookTitle: res.bookTitle ?? "Không xác định",
          bookType: res.bookType ?? "Unknown",
        });
        setStep("verified");
      } else {
        setError(res.message ?? "Mã kích hoạt không hợp lệ.");
      }
    } catch {
      setError("Không thể kiểm tra mã. Vui lòng thử lại.");
    }
  };

  const handleActivate = async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const res = await activateCode({ code }).unwrap();
      if (res.success) {
        setResult({
          bookTitle: res.bookTitle ?? "Không xác định",
          bookSlug: res.bookSlug ?? "",
          bookType: res.bookType ?? "Unknown",
        });
        setStep("done");
      } else {
        setError(res.message ?? "Kích hoạt thất bại.");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr?.data?.message ?? "Kích hoạt thất bại. Vui lòng thử lại.");
    }
  };

  const handleReset = () => {
    setCode("");
    setStep("input");
    setVerifyInfo(null);
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      <BookSubNav />

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: "rgba(229,23,63,0.08)" }}>
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0a2540" }}>
            Kích hoạt mã sách
          </h1>
          <p className="text-gray-500">
            Nhập mã kích hoạt 16 ký tự đi kèm sách in để mở khoá tài nguyên học tập.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === "done" && result ? (
            /* ── Success ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0a2540" }}>
                Kích hoạt thành công!
              </h2>
              <p className="text-gray-500 mb-2">
                Bạn đã mở khoá:
              </p>
              <p className="font-semibold text-lg mb-4" style={{ color: "#0a2540" }}>
                {result.bookTitle}
              </p>
              {(result.bookType === "Ebook" || result.bookType === "Combo") && (
                <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2 mb-6">
                  📚 Ebook đã được thêm vào thư viện của bạn
                </p>
              )}
              <div className="flex gap-3">
                {result.bookSlug && (
                  <Link
                    href={`/sach/${result.bookSlug}`}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-center"
                    style={{ background: "#e5173f" }}
                  >
                    Xem sách
                  </Link>
                )}
                <Link
                  href="/thu-vien-sach"
                  className="flex-1 py-3 rounded-xl border-2 font-semibold text-center"
                  style={{ borderColor: "#0a2540", color: "#0a2540" }}
                >
                  Thư viện sách
                </Link>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Kích hoạt mã khác
              </button>
            </div>
          ) : (
            <>
              {/* ── Code Input ── */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "#0a2540" }}>
                  Mã kích hoạt
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  disabled={step === "verified"}
                  className="w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-mono tracking-widest transition-colors focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  style={{
                    borderColor: error ? "#e5173f" : step === "verified" ? "#16a34a" : "#e2e8f0",
                    color: "#0a2540",
                  }}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>

              {/* ── Verified Book Info ── */}
              {step === "verified" && verifyInfo && (
                <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl mt-0.5">✓</span>
                    <div>
                      <p className="font-semibold text-green-800">{verifyInfo.bookTitle}</p>
                      <p className="text-sm text-green-600">
                        {verifyInfo.bookType === "Ebook"
                          ? "📱 Sách điện tử"
                          : verifyInfo.bookType === "Physical"
                          ? "📦 Sách in"
                          : "📦 Combo"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Buttons ── */}
              {step === "input" ? (
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || code.length < 19}
                  className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-50"
                  style={{ background: "#0a2540" }}
                >
                  {isVerifying ? "Đang kiểm tra..." : "Kiểm tra mã"}
                </button>
              ) : step === "verified" ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl border-2 font-semibold"
                    style={{ borderColor: "#cbd5e1", color: "#64748b" }}
                  >
                    Nhập lại
                  </button>
                  {isAuthenticated ? (
                    <button
                      onClick={handleActivate}
                      disabled={isActivating}
                      className="flex-1 py-3 rounded-xl text-white font-semibold transition-opacity disabled:opacity-50"
                      style={{ background: "#e5173f" }}
                    >
                      {isActivating ? "Đang kích hoạt..." : "🔓 Kích hoạt"}
                    </button>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="flex-1 py-3 rounded-xl text-white font-semibold text-center"
                      style={{ background: "#e5173f" }}
                    >
                      Đăng nhập để kích hoạt
                    </Link>
                  )}
                </div>
              ) : null}

              {/* Format hint */}
              <p className="mt-4 text-xs text-center text-gray-400">
                Định dạng: XXXX-XXXX-XXXX-XXXX (chữ hoa và số)
              </p>
            </>
          )}
        </div>

        {/* Help */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-1">💡 Mã kích hoạt ở đâu?</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Bên trong bìa sách in của bạn</li>
            <li>• Email xác nhận đơn hàng (mục Activation Code)</li>
            <li>• Trang chi tiết đơn hàng → Xem mã kích hoạt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
