"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle } from "lucide-react";
import {
  useGetCoursePackagesQuery,
  useGetMyPackagesQuery,
  usePurchasePackageMutation,
  type PackageDto,
} from "@/lib/features/packages/packagesApi";
import { useGetPublicCourseQuery } from "@/lib/features/courses/coursesApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}

function formatDuration(days: number) {
  if (days === 0) return "Trọn đời";
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}

interface Props {
  courseId: string;
  onEnrolled?: () => void;
}

export default function PricingCards({ courseId, onEnrolled }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const isAuthenticated = useAppSelector((s) => !!s.auth.accessToken);
  const { data: packages, isLoading } = useGetCoursePackagesQuery(courseId);
  const { data: course } = useGetPublicCourseQuery(courseId);
  const { data: myPackages } = useGetMyPackagesQuery(courseId, {
    skip: !isAuthenticated,
  });
  const [purchasePackage] = usePurchasePackageMutation();

  const owned = new Set(myPackages?.map((sp) => sp.packageId) ?? []);

  async function handleFreePurchase(pkg: PackageDto) {
    if (!isAuthenticated) {
      window.location.href = `/auth/login?redirect=/courses/${courseId}`;
      return;
    }
    setPurchasing(pkg.id);
    try {
      await purchasePackage({ courseId, packageId: pkg.id }).unwrap();
      onEnrolled?.();
    } catch {
      alert("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setPurchasing(null);
    }
  }

  function handleBuyPaid(pkg: PackageDto) {
    if (!isAuthenticated) {
      window.location.href = `/auth/login?redirect=/courses/${courseId}`;
      return;
    }
    const price = pkg.salePrice > 0 && pkg.salePrice < pkg.originalPrice ? pkg.salePrice : pkg.originalPrice;
    dispatch(addToCart({
      id:           `pkg-${pkg.id}`,
      title:        `${pkg.title}${course?.title ? ` — ${course.title}` : ""}`,
      slug:         pkg.id,
      coverColor:   "#4f46e5",
      coverEmoji:   "📦",
      coverUrl:     course?.thumbnailUrl ?? null,
      type:         "Course" as never,
      price,
      discountPrice: null,
      itemType:     "Course",
      courseId,
    }));
    router.push("/thanh-toan");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-gray-400 text-sm">Đang tải gói học...</div>
      </div>
    );
  }

  if (!packages || packages.length === 0) return null;

  // Pull packages by tier (sorted by PackageType in API; defensively re-locate)
  const basic    = packages.find((p) => p.packageType === "Basic");
  const standard = packages.find((p) => p.packageType === "Standard");
  const advance  = packages.find((p) => p.packageType === "Advance");

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="rounded-xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <h3 className="font-bold text-white text-sm tracking-wide">Gói khóa học</h3>
          <span className="ml-auto text-white/60 text-xs">{packages.length} gói</span>
        </div>
      </div>

      {/* BASIC */}
      {basic && <BasicCard pkg={basic} owned={owned.has(basic.id)} busy={purchasing === basic.id} onClick={() => handleFreePurchase(basic)} />}

      {/* STANDARD */}
      {standard && <PaidCard pkg={standard} tier="standard" owned={owned.has(standard.id)} onClick={() => handleBuyPaid(standard)} />}

      {/* ADVANCE */}
      {advance && <PaidCard pkg={advance} tier="advance" owned={owned.has(advance.id)} onClick={() => handleBuyPaid(advance)} />}
    </div>
  );
}

// ─── Sub-cards ─────────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  video_learning: "Video bài học",
  basic_quiz: "Quiz kiểm tra",
  vocabulary_package: "Bộ từ vựng",
  grammar_practice: "Luyện ngữ pháp",
  realtime_comments: "Bình luận realtime",
  speaking_ai: "AI Speaking",
  writing_ai: "AI Writing",
  teacher_support: "Hỗ trợ giáo viên 1-1",
};

function pickFeatures(pkg: PackageDto, max = 3): string[] {
  const enabled = pkg.entitlements.filter((e) => e.enabled);
  return enabled.slice(0, max).map((e) => FEATURE_LABELS[e.featureCode] ?? e.featureCode);
}

function BasicCard({ pkg, owned, busy, onClick }: { pkg: PackageDto; owned: boolean; busy: boolean; onClick: () => void }) {
  const features = pickFeatures(pkg);
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">BASIC</div>
          <h4 className="font-bold">{pkg.title}</h4>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">Miễn phí</div>
        </div>
      </div>
      <ul className="space-y-2 mb-3 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle className="text-green-500 flex-shrink-0" size={14} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        disabled={owned || busy}
        onClick={onClick}
        className={`w-full font-medium py-2.5 rounded-lg transition-colors text-sm ${
          owned
            ? "bg-emerald-50 text-emerald-600 border border-emerald-300 cursor-default"
            : "bg-gray-900 hover:bg-gray-800 text-white"
        } disabled:opacity-70`}
      >
        {busy ? "Đang xử lý..." : owned ? "✓ Đã đăng ký" : "Đăng ký miễn phí"}
      </button>
    </div>
  );
}

function PaidCard({
  pkg,
  tier,
  owned,
  onClick,
}: {
  pkg: PackageDto;
  tier: "standard" | "advance";
  owned: boolean;
  onClick: () => void;
}) {
  const isStandard = tier === "standard";
  const hasDiscount = pkg.salePrice > 0 && pkg.salePrice < pkg.originalPrice;
  const effectivePrice = hasDiscount ? pkg.salePrice : pkg.originalPrice;
  const features = pickFeatures(pkg);

  const bg = isStandard
    ? "bg-gradient-to-br from-blue-500 to-blue-600"
    : "bg-gradient-to-br from-orange-500 to-orange-600";
  const badgeBg = isStandard ? "bg-blue-700" : "bg-orange-700";
  const lineThroughText = isStandard ? "text-blue-200" : "text-orange-200";
  const subText = isStandard ? "text-blue-100" : "text-orange-100";
  const btnText = isStandard ? "text-blue-600 hover:bg-blue-50" : "text-orange-600 hover:bg-orange-50";
  const tierLabel = isStandard ? "STANDARD" : "ADVANCE";
  const badgeLabel = isStandard ? "PHỔ BIẾN" : "CAO CẤP";

  return (
    <div className={`${bg} rounded-lg shadow-lg p-4 text-white relative`}>
      <div className={`absolute top-2 right-2 ${badgeBg} px-2 py-0.5 rounded-full text-[10px] font-bold`}>
        {badgeLabel}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={`text-xs uppercase tracking-wide ${subText}`}>{tierLabel}</div>
          <h4 className="font-bold">{pkg.title}</h4>
        </div>
        <div className="text-right">
          {hasDiscount && (
            <div className={`text-xs line-through ${lineThroughText}`}>{formatPrice(pkg.originalPrice)}</div>
          )}
          <div className="text-2xl font-bold">{formatPrice(effectivePrice)}</div>
          <div className={`text-xs ${subText}`}>/ {formatDuration(pkg.durationDay)}</div>
        </div>
      </div>
      <ul className="space-y-2 mb-3 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle className="flex-shrink-0" size={14} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        disabled={owned}
        onClick={onClick}
        className={`w-full bg-white font-bold py-2.5 rounded-lg transition-colors text-sm ${btnText} disabled:opacity-70 disabled:cursor-default`}
      >
        {owned ? "✓ Đã sở hữu" : `Mua ngay – ${formatPrice(effectivePrice)}`}
      </button>
    </div>
  );
}
