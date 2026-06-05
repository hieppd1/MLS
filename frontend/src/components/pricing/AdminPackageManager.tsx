"use client";

import { useState, useEffect, useRef } from "react";
import {
  useAdminGetCoursePackagesQuery,
  useAdminCreatePackageMutation,
  useAdminUpdatePackageMutation,
  useAdminActivatePackageMutation,
  useAdminArchivePackageMutation,
  type PackageDto,
  type EntitlementInput,
} from "@/lib/features/packages/packagesApi";
import { formatCurrency } from "@/lib/i18nFormat";

// Feature catalogue
const FEATURE_LIST: { code: string; label: string }[] = [
  { code: "video_learning",     label: "Xem video bài học" },
  { code: "basic_quiz",         label: "Quiz cơ bản" },
  { code: "vocabulary_package", label: "Bộ từ vựng" },
  { code: "grammar_practice",   label: "Luyện ngữ pháp" },
  { code: "realtime_comments",  label: "Bình luận realtime" },
  { code: "speaking_ai",        label: "Đánh giá Speaking AI" },
  { code: "writing_ai",         label: "Đánh giá Writing AI" },
  { code: "teacher_support",    label: "Hỗ trợ giáo viên 1-1" },
];

type TierType = "Basic" | "Standard" | "Advance";

interface Template {
  type: TierType;
  icon: string;
  title: string;
  description: string;
  durationDay: number;
  features: Record<string, boolean>;
}

const TEMPLATES: Template[] = [
  {
    type: "Basic",
    icon: "📖",
    title: "Gói Cơ Bản",
    description: "Khóa học cơ bản, có thể phát hoặc bán free",
    durationDay: 0,
    features: {
      video_learning: true,  basic_quiz: true,
      vocabulary_package: false, grammar_practice: false,
      realtime_comments: false,  speaking_ai: false,
      writing_ai: false,         teacher_support: false,
    },
  },
  {
    type: "Standard",
    icon: "📚",
    title: "Gói Tiêu Chuẩn",
    description: "Combo 3 bộ sách (từ vựng, ngữ pháp, luyện tập)",
    durationDay: 365,
    features: {
      video_learning: true,  basic_quiz: true,
      vocabulary_package: true, grammar_practice: true, realtime_comments: true,
      speaking_ai: false, writing_ai: false, teacher_support: false,
    },
  },
  {
    type: "Advance",
    icon: "🎓",
    title: "Gói Nâng Cao",
    description: "Combo 3 bộ sách + học thực hành (AI + giáo viên 1-1)",
    durationDay: 365,
    features: {
      video_learning: true, basic_quiz: true,
      vocabulary_package: true, grammar_practice: true, realtime_comments: true,
      speaking_ai: true, writing_ai: true, teacher_support: true,
    },
  },
];

const TIER_STYLE: Record<TierType, { ring: string; badge: string; bg: string }> = {
  Basic:    { ring: "border-gray-300",   badge: "bg-gray-100 text-gray-600",     bg: "bg-gray-50/80" },
  Standard: { ring: "border-indigo-400", badge: "bg-indigo-100 text-indigo-700", bg: "bg-indigo-50/60" },
  Advance:  { ring: "border-amber-400",  badge: "bg-amber-100 text-amber-700",   bg: "bg-amber-50/60" },
};

const STATUS_STYLE: Record<string, string> = {
  Draft:    "bg-gray-100 text-gray-500",
  Active:   "bg-green-100 text-green-700",
  Archived: "bg-red-100 text-red-500",
};
const STATUS_LABEL: Record<string, string> = {
  Draft: "Nháp", Active: "Đang bán", Archived: "Lưu trữ",
};

function fmtPrice(p: number) {
  if (p === 0) return "Miễn phí";
  return formatCurrency(p);
}

function fmtDuration(d: number) {
  if (d === 0) return "Trọn đời";
  if (d < 30) return d + " ngày";
  return Math.round(d / 30) + " tháng";
}

function toEntitlements(features: Record<string, boolean>): EntitlementInput[] {
  return FEATURE_LIST.map((f) => ({ featureCode: f.code, enabled: features[f.code] ?? false }));
}

interface PackageFormState {
  id?: string;
  type: TierType;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  durationDay: number;
  features: Record<string, boolean>;
  status?: string;
  expandFeatures: boolean;
}

function pkgToForm(pkg: PackageDto): PackageFormState {
  return {
    id: pkg.id,
    type: pkg.packageType as TierType,
    title: pkg.title,
    description: pkg.description ?? "",
    originalPrice: pkg.originalPrice,
    salePrice: pkg.salePrice,
    durationDay: pkg.durationDay,
    features: Object.fromEntries(
      FEATURE_LIST.map((f) => [f.code, pkg.entitlements.find((e) => e.featureCode === f.code)?.enabled ?? false])
    ),
    status: pkg.status,
    expandFeatures: false,
  };
}

function tplToForm(tpl: Template): PackageFormState {
  return {
    id: undefined,
    type: tpl.type,
    title: tpl.title,
    description: tpl.description,
    originalPrice: 0,
    salePrice: 0,
    durationDay: tpl.durationDay,
    features: { ...tpl.features },
    status: undefined,
    expandFeatures: false,
  };
}

function buildForms(packages: PackageDto[]): PackageFormState[] {
  return (["Basic", "Standard", "Advance"] as TierType[]).map((type) => {
    const existing = packages.find((p) => p.packageType === type);
    return existing ? pkgToForm(existing) : tplToForm(TEMPLATES.find((t) => t.type === type)!);
  });
}

interface Props {
  courseId: string;
  isFree?: boolean;
  onSaveIsFree?: (val: boolean) => Promise<void>;
}

export default function AdminPackageManager({
  courseId,
  isFree: isFreeInit = false,
  onSaveIsFree,
}: Props) {
  const { data: packages, isLoading } = useAdminGetCoursePackagesQuery(courseId);
  const [create] = useAdminCreatePackageMutation();
  const [update] = useAdminUpdatePackageMutation();
  const [activate] = useAdminActivatePackageMutation();
  const [archive] = useAdminArchivePackageMutation();

  const [editMode, setEditMode]   = useState(false);
  const [isFree, setIsFree]       = useState(isFreeInit);
  const [forms, setForms]         = useState<PackageFormState[]>(() => buildForms([]));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Sync isFree from parent
  useEffect(() => { setIsFree(isFreeInit); }, [isFreeInit]);

  // Sync forms when packages loads — use ref to avoid running on every render
  const prevPackagesRef = useRef<PackageDto[] | undefined>(undefined);
  useEffect(() => {
    if (packages !== undefined && packages !== prevPackagesRef.current) {
      prevPackagesRef.current = packages;
      setForms(buildForms(packages));
    }
  }, [packages]);

  function updateForm(idx: number, patch: Partial<PackageFormState>) {
    setForms((fs) => fs.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function toggleFeature(idx: number, code: string) {
    setForms((fs) =>
      fs.map((f, i) =>
        i === idx ? { ...f, features: { ...f.features, [code]: !f.features[code] } } : f
      )
    );
  }

  function handleCancel() {
    setForms(buildForms(packages ?? []));
    setIsFree(isFreeInit);
    setError(null);
    setEditMode(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      for (const f of forms) {
        const payload = {
          title: f.title,
          description: f.description || null,
          originalPrice: f.originalPrice,
          salePrice: f.salePrice,
          durationDay: f.durationDay,
          entitlements: toEntitlements(f.features),
        };
        if (f.id) {
          await update({ packageId: f.id, courseId, ...payload }).unwrap();
        } else {
          await create({ courseId, packageType: f.type, ...payload }).unwrap();
        }
      }
      if (onSaveIsFree && isFree !== isFreeInit) {
        await onSaveIsFree(isFree);
      }
      setEditMode(false);
    } catch (err: unknown) {
      setError(
        (err as { data?: { detail?: string; title?: string } })?.data?.detail ??
        (err as { data?: { title?: string } })?.data?.title ??
        "Lưu thất bại — vui lòng thử lại"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(pkg: PackageDto) {
    setError(null);
    try { await activate({ packageId: pkg.id, courseId }).unwrap(); }
    catch { setError("Kích hoạt thất bại."); }
  }

  async function handleArchive(pkg: PackageDto) {
    if (!confirm("Lưu trữ gói " + pkg.title + "?")) return;
    setError(null);
    try { await archive({ packageId: pkg.id, courseId }).unwrap(); }
    catch { setError("Lưu trữ thất bại."); }
  }

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Đang tải gói học...</div>;
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl">💎</div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">Gói học phân tầng</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(packages?.length ?? 0) > 0
                ? packages!.length + " gói đang thiết lập — học viên mua gói để truy cập nội dung"
                : "Chưa có gói nào — thiết lập để bán theo phân tầng (Basic / Standard / Advance)"}
            </p>
          </div>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="shrink-0 rounded-lg border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            ✏ Chỉnh sửa
          </button>
        )}
      </div>

      {/* isFree banner (view mode) */}
      {!editMode && isFreeInit && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <span>✓</span>
          <span>Khóa học miễn phí — học viên truy cập Gói Cơ Bản không cần thanh toán</span>
        </div>
      )}

      {/* isFree toggle (edit mode) */}
      {editMode && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Khóa học miễn phí</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Học viên truy cập toàn bộ Gói Cơ Bản mà không cần thanh toán
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFree((v) => !v)}
            className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none " + (isFree ? "bg-green-500" : "bg-gray-300")}
            role="switch"
            aria-checked={isFree}
          >
            <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out " + (isFree ? "translate-x-5" : "translate-x-0")} />
          </button>
        </div>
      )}

      {/* Edit hint */}
      {editMode && (
        <div className="flex items-start justify-between">
          <p className="text-sm text-gray-500">
            Điều chỉnh tên, giá và tính năng cho từng gói, rồi nhấn <strong>Lưu</strong>.
          </p>
          <span className="shrink-0 ml-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            3 / 3 gói
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {forms.map((f, idx) => {
          const tpl   = TEMPLATES.find((t) => t.type === f.type)!;
          const style = TIER_STYLE[f.type];
          const pkg   = packages?.find((p) => p.packageType === f.type);

          if (editMode) {
            const enabledCount = Object.values(f.features).filter(Boolean).length;
            return (
              <div key={f.type} className={"rounded-xl border-2 transition-all " + style.ring + " " + style.bg}>
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <span className="text-2xl">{tpl.icon}</span>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + style.badge}>{f.type}</span>
                  {f.status && (
                    <span className={"ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium " + (STATUS_STYLE[f.status] ?? STATUS_STYLE.Draft)}>
                      {STATUS_LABEL[f.status] ?? f.status}
                    </span>
                  )}
                </div>
                <div className="space-y-3 px-4 pb-4">
                  <input
                    value={f.title}
                    onChange={(e) => updateForm(idx, { title: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-indigo-400 focus:outline-none"
                  />
                  <input
                    value={f.description}
                    onChange={(e) => updateForm(idx, { description: e.target.value })}
                    placeholder="Mô tả ngắn..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 focus:border-indigo-400 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Giá gốc</p>
                      <div className="relative">
                        <input type="number" min={0} step={1000} value={f.originalPrice}
                          onChange={(e) => updateForm(idx, { originalPrice: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 pr-6 text-xs focus:border-indigo-400 focus:outline-none" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₫</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Giá KM</p>
                      <div className="relative">
                        <input type="number" min={0} step={1000} value={f.salePrice}
                          onChange={(e) => updateForm(idx, { salePrice: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 pr-6 text-xs focus:border-indigo-400 focus:outline-none" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₫</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-gray-400">Thời hạn</p>
                    <select value={f.durationDay} onChange={(e) => updateForm(idx, { durationDay: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:outline-none">
                      <option value={0}>Trọn đời</option>
                      <option value={30}>1 tháng</option>
                      <option value={90}>3 tháng</option>
                      <option value={180}>6 tháng</option>
                      <option value={365}>1 năm</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => updateForm(idx, { expandFeatures: !f.expandFeatures })}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white/80 px-3 py-1.5 text-xs text-gray-600 hover:bg-white">
                    <span>{enabledCount} tính năng được bật</span>
                    <svg className={"h-3.5 w-3.5 transition-transform " + (f.expandFeatures ? "rotate-180" : "")} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {f.expandFeatures && (
                    <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-2.5">
                      {FEATURE_LIST.map((feat) => (
                        <label key={feat.code} className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={f.features[feat.code] ?? false}
                            onChange={() => toggleFeature(idx, feat.code)}
                            className="h-3.5 w-3.5 rounded accent-indigo-600" />
                          <span className={(f.features[feat.code] ? "text-xs text-gray-700" : "text-xs text-gray-400")}>{feat.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // View mode
          const hasDiscount = f.salePrice > 0 && f.salePrice < f.originalPrice;
          const effective   = hasDiscount ? f.salePrice : f.originalPrice;
          const enabled     = FEATURE_LIST.filter((feat) => f.features[feat.code]);
          return (
            <div key={f.type} className={"rounded-xl border-2 " + style.ring + " " + style.bg + " flex flex-col"}>
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tpl.icon}</span>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + style.badge}>{f.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {f.status ? (
                    <>
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (STATUS_STYLE[f.status] ?? STATUS_STYLE.Draft)}>
                        {STATUS_LABEL[f.status] ?? f.status}
                      </span>
                      {(f.status === "Draft" || f.status === "Archived") && pkg && (
                        <button onClick={() => handleActivate(pkg)}
                          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200">
                          Kích hoạt
                        </button>
                      )}
                      {f.status === "Active" && pkg && (
                        <button onClick={() => handleArchive(pkg)}
                          className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100">
                          Lưu trữ
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">Chưa lưu</span>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{f.title}</p>
                {f.description && <p className="text-xs text-gray-500">{f.description}</p>}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-extrabold text-gray-900">{fmtPrice(effective)}</span>
                  {hasDiscount && <span className="text-xs text-gray-400 line-through">{fmtPrice(f.originalPrice)}</span>}
                  <span className="ml-auto text-xs text-gray-400">{fmtDuration(f.durationDay)}</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  {enabled.slice(0, 3).map((feat) => (
                    <div key={feat.code} className="flex items-center gap-1.5 text-gray-600">
                      <span className="text-green-500">✓</span>{feat.label}
                    </div>
                  ))}
                  {enabled.length > 3 && <p className="pl-4 text-gray-400">+{enabled.length - 3} tính năng khác</p>}
                  {enabled.length === 0 && <p className="italic text-gray-400">Chưa có tính năng</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save/Cancel */}
      {editMode && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={handleCancel} disabled={saving}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Huỷ
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      )}
    </div>
  );
}
