"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, Search } from "lucide-react";
import AppShell from "@/app/_components/AppShell";
import { useGetTeacherListQuery, type TeacherProfileDto } from "@/lib/features/teachers/teachersApi";
import { safeImgUrl } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-orange-400 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-rose-400 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-amber-400 to-yellow-500",
  "from-indigo-500 to-indigo-700",
];

const ACCENT_COLORS = [
  "#1565C0", "#7C3AED", "#EA580C", "#059669", "#E11D48", "#0891B2", "#D97706", "#4F46E5",
];

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function TeacherCard({ teacher, index }: { teacher: TeacherProfileDto; index: number }) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const initials = getInitials(teacher.displayName);
  const imgUrl = safeImgUrl(teacher.avatarUrl);
  const specs = teacher.specialization?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <Link href={`/giao-vien/${teacher.slug}`} className="block no-underline text-inherit group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">

        {/* Thin accent top bar */}
        <div className="h-[3px] w-full flex-shrink-0" style={{ background: accentColor }} />

        <div className="p-5 flex flex-col flex-1">

          {/* Avatar + Name */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="relative flex-shrink-0">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={teacher.displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
                  <span className="text-white text-lg font-extrabold tracking-wide">{initials}</span>
                </div>
              )}
              {teacher.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <CheckCircle size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900 leading-tight">{teacher.displayName}</span>
              </div>
              {teacher.headline && (
                <p className="text-xs text-slate-500 leading-snug line-clamp-2">{teacher.headline}</p>
              )}
            </div>
          </div>

          {/* Specialization chips */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {specs.slice(0, 3).map((spec) => (
                <span key={spec} className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats row */}
          <div className="flex items-center pt-3.5 border-t border-gray-50">
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-slate-800 leading-tight">{fmtNumber(teacher.followerCount)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi</p>
            </div>
            <div className="w-px h-7 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-slate-800 leading-tight">{teacher.courseCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Khoá học</p>
            </div>
            {teacher.ratingAverage > 0 && (
              <>
                <div className="w-px h-7 bg-gray-100" />
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-slate-800 leading-tight">{teacher.ratingAverage.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Đánh giá</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-[3px] w-full bg-gray-200" />
      <div className="p-5">
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-full animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
          </div>
        </div>
        <div className="flex gap-1.5 mb-3.5">
          <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="pt-3.5 border-t border-gray-50 flex items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 text-center">
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1.5" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GiaoVienPage() {
  const [search, setSearch] = useState("");
  const { data: teachers, isLoading } = useGetTeacherListQuery({ pageSize: 50 });

  const filtered =
    teachers?.filter(
      (t) =>
        !search ||
        t.displayName.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization ?? "").toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <AppShell>
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 pt-8 pb-6 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Đội ngũ giảng dạy</p>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Giáo viên MLS</h1>
          <p className="text-sm text-slate-500 mb-5">Khám phá các giáo viên tận tâm của chúng tôi</p>

          {/* Search */}
          <div className="relative max-w-[440px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc chuyên môn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="px-6 py-6 pb-20">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="text-5xl">👨‍🏫</span>
              <p className="text-base font-semibold text-slate-700">
                {search ? "Không tìm thấy giáo viên" : "Chưa có giáo viên nào"}
              </p>
              <p className="text-sm text-slate-400">
                {search ? "Thử tìm kiếm với từ khoá khác" : "Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                <span className="font-semibold text-slate-700">{filtered.length}</span> giáo viên
                {search ? ` cho "${search}"` : ""}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((t, i) => (
                  <TeacherCard key={t.id} teacher={t} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
