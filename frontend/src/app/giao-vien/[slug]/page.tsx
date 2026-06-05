"use client";

import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import {
  useGetTeacherBySlugQuery,
  useGetTeacherCoursesQuery,
  useFollowTeacherMutation,
  useUnfollowTeacherMutation,
  type TeacherCourseItem,
} from "@/lib/features/teachers/teachersApi";
import { safeImgUrl } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import AppShell from "@/app/_components/AppShell";
import {
  Star, Users, BookOpen, Award, CheckCircle, Globe,
  MessageCircle, Heart, TrendingUp, ExternalLink,
} from "lucide-react";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function levelLabel(level: number): { text: string; cls: string } {
  if (level <= 1) return { text: "Cơ bản",    cls: "bg-green-50 text-green-600 border border-green-100" };
  if (level <= 2) return { text: "Trung cấp", cls: "bg-blue-50 text-blue-600 border border-blue-100" };
  if (level <= 3) return { text: "Nâng cao",  cls: "bg-orange-50 text-orange-600 border border-orange-100" };
  return               { text: "Chuyên sâu", cls: "bg-red-50 text-red-600 border border-red-100" };
}

// Badge by enrollment rank: Best Seller → most enrolled, Hot → 2nd, Popular → rest
const COURSE_BADGES = [
  { label: "Best Seller", bg: "bg-pink-500"    },
  { label: "Hot",         bg: "bg-orange-500"  },
  { label: "Popular",     bg: "bg-emerald-500" },
];

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course, badge }: { course: TeacherCourseItem; badge: typeof COURSE_BADGES[0] }) {
  const thumb = safeImgUrl(course.thumbnailUrl);
  const hasDiscount = course.discountPrice != null && course.discountPrice < course.price;
  const lvl = levelLabel(course.level);
  const { fmtCurrency } = useFormatters();
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow no-underline text-inherit"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: "16/9" }}>
        {thumb ? (
          <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <BookOpen size={32} className="text-slate-300" />
          </div>
        )}
        <span className={`absolute top-2 left-2 ${badge.bg} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm`}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <div className="text-sm font-semibold text-slate-900 leading-snug mb-1.5 line-clamp-2">{course.title}</div>
        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${lvl.cls}`}>{lvl.text}</span>

        {/* Rating + enrollment row */}
        {(course.ratingAverage > 0 || course.enrollmentCount > 0) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            {course.ratingAverage > 0 && (
              <span className="flex items-center gap-0.5">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-slate-600 font-medium">{course.ratingAverage.toFixed(1)}</span>
              </span>
            )}
            {course.ratingAverage > 0 && course.enrollmentCount > 0 && <span>·</span>}
            {course.enrollmentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Users size={10} className="mr-0.5" />
                <span>{fmtNumber(course.enrollmentCount)}</span>
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {course.isFree ? (
          <span className="text-sm font-extrabold text-green-600">Miễn phí</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-red-600">
              {fmtCurrency(hasDiscount ? course.discountPrice! : course.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">{fmtCurrency(course.price)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const isLoggedIn = useSelector((s: RootState) => !!s.auth.accessToken);

  const { data: teacher, isLoading, isError } = useGetTeacherBySlugQuery(slug);
  const { data: courses = [] } = useGetTeacherCoursesQuery(teacher?.id ?? "", {
    skip: !teacher?.id,
  });

  const [follow] = useFollowTeacherMutation();
  const [unfollow] = useUnfollowTeacherMutation();
  const [followLoading, setFollowLoading] = useState(false);
  const t = useTranslations("teacher_profile");

  async function handleFollow() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!teacher) return;
    setFollowLoading(true);
    try {
      if (teacher.isFollowing) await unfollow(teacher.id);
      else await follow(teacher.id);
    } finally { setFollowLoading(false); }
  }

  const avatarUrl = safeImgUrl(teacher?.avatarUrl);
  const coverUrl  = safeImgUrl(teacher?.coverUrl);
  const initials = teacher ? getInitials(teacher.displayName) : "T";

  const achievements = teacher ? [
    teacher.experienceYears > 0 && {
      Icon: TrendingUp, value: `${teacher.experienceYears}+`, label: t("achievement_years"),
      cardBg: "bg-violet-50 border border-violet-100", iconBg: "bg-violet-100", iconColor: "text-violet-600",
    },
    teacher.totalStudents > 0 && {
      Icon: Users, value: `${fmtNumber(teacher.totalStudents)}+`, label: "Học viên đào tạo",
      cardBg: "bg-purple-50 border border-purple-100", iconBg: "bg-purple-100", iconColor: "text-purple-600",
    },
    teacher.ratingAverage > 0 && {
      Icon: Star, value: `${teacher.ratingAverage.toFixed(1)}/5`, label: "Điểm đánh giá TB",
      cardBg: "bg-amber-50 border border-amber-100", iconBg: "bg-amber-100", iconColor: "text-amber-500",
    },
    teacher.isVerified && {
      Icon: CheckCircle, value: "MLS Verified", label: "Giáo viên xác nhận",
      cardBg: "bg-emerald-50 border border-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
    },
    teacher.courseCount > 0 && {
      Icon: BookOpen, value: `${teacher.courseCount}`, label: "Khóa học đang dạy",
      cardBg: "bg-sky-50 border border-sky-100", iconBg: "bg-sky-100", iconColor: "text-sky-600",
    },
    teacher.followerCount > 0 && {
      Icon: Heart, value: `${fmtNumber(teacher.followerCount)}`, label: t("achievement_followers"),
      cardBg: "bg-rose-50 border border-rose-100", iconBg: "bg-rose-100", iconColor: "text-rose-500",
    },
  ].filter(Boolean) : [];

  return (
    <>
      <style>{`
        .mls-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .mls-scroll::-webkit-scrollbar { width: 4px; }
        .mls-scroll::-webkit-scrollbar-track { background: transparent; }
        .mls-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .mls-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .mls-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>
      <AppShell activeNavId="following">
        <div className="mls-scroll flex-1 min-w-0 overflow-y-auto bg-gray-50" style={{ height: "calc(100vh - 56px)" }}>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-violet-600 animate-spin" />
            </div>
          )}

          {/* Error */}
          {(isError || (!isLoading && !teacher)) && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <div className="text-5xl">😕</div>
              <div className="text-lg font-bold text-slate-800">{t("not_found")}</div>
              <Link href="/" className="text-blue-600 text-sm">Quay về trang chủ</Link>
            </div>
          )}

          {teacher && (
            <>
              {/* ── HERO (white card) ── */}
              <div className="bg-white px-6 pt-4 pb-5 border-b border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">

                  {/* Avatar + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={teacher.displayName}
                          className="w-[60px] h-[60px] rounded-full object-cover border-2 border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
                          <span className="text-white text-xl font-extrabold">{initials}</span>
                        </div>
                      )}
                      {teacher.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Name / headline / chips */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h1 className="text-lg font-bold text-slate-900">{teacher.displayName}</h1>
                        {teacher.isVerified && (
                          <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle size={9} strokeWidth={3} />
                            MLS Verified
                          </span>
                        )}
                      </div>
                      {teacher.headline && (
                        <p className="text-slate-500 text-sm mb-2 leading-snug">{teacher.headline}</p>
                      )}
                      {teacher.specialization && (
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.specialization.split(",").map(s => s.trim()).filter(Boolean).map(spec => (
                            <span key={spec} className="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border-0 ${
                        teacher.isFollowing
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 shadow-md"
                      }`}
                    >
                      <Heart size={13} className={teacher.isFollowing ? "fill-slate-500 text-slate-500" : "fill-white text-white"} />
                      {followLoading ? "..." : teacher.isFollowing ? t("following") : t("follow")}
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 transition-all cursor-pointer">
                      <MessageCircle size={13} />
                      {t("message")}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center mt-4 pt-3 border-t border-gray-100">
                  {[
                    teacher.totalStudents > 0  && { icon: <Users size={13} className="text-slate-400" />,                         value: `${fmtNumber(teacher.totalStudents)}+`, label: t("stat_students") },
                    teacher.courseCount > 0    && { icon: <BookOpen size={13} className="text-slate-400" />,                      value: `${teacher.courseCount}`,               label: t("stat_courses") },
                    teacher.ratingAverage > 0  && { icon: <Star size={13} className="text-yellow-400 fill-yellow-400" />,         value: `${teacher.ratingAverage.toFixed(1)}`,  label: t("stat_rating") },
                    teacher.followerCount > 0  && { icon: <Heart size={13} className="text-slate-400" />,                         value: `${fmtNumber(teacher.followerCount)}`,  label: "Theo dõi" },
                    teacher.experienceYears > 0 && { icon: <TrendingUp size={13} className="text-slate-400" />,                   value: t("stat_exp_years", { count: teacher.experienceYears }),      label: t("stat_experience") },
                  ].filter(Boolean).map((s, i, arr) => (
                    <div key={i} className="flex items-center">
                      <div className="flex items-center gap-1 px-2 first:pl-0">
                        {(s as { icon: React.ReactNode; value: string; label: string }).icon}
                        <span className="text-sm font-semibold text-slate-800">{(s as { icon: React.ReactNode; value: string; label: string }).value}</span>
                        <span className="text-sm text-slate-500 ml-0.5">{(s as { icon: React.ReactNode; value: string; label: string }).label}</span>
                      </div>
                      {i < arr.length - 1 && <span className="text-slate-300 text-xs">·</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── BODY ── */}
              <div className="px-5 py-5 space-y-5">

                {/* Giới thiệu */}
                {(teacher.bio || teacher.headline) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Globe size={16} className="text-violet-600" />
                      </span>
                      Giới thiệu về giáo viên
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {teacher.bio || teacher.headline}
                    </p>
                    {teacher.specialization && (
                      <div className="mt-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("specialization")}</div>
                        <div className="flex flex-wrap gap-2">
                          {teacher.specialization.split(",").map(s => s.trim()).filter(Boolean).map(spec => (
                            <span key={spec} className="bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium px-3 py-1 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(teacher.facebookUrl || teacher.youtubeUrl || teacher.tiktokUrl || teacher.websiteUrl) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("links")}</div>
                        <div className="flex flex-wrap gap-2">
                          {teacher.facebookUrl && (
                            <a href={teacher.facebookUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors no-underline">
                              <ExternalLink size={11} />Facebook
                            </a>
                          )}
                          {teacher.youtubeUrl && (
                            <a href={teacher.youtubeUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-3 py-1.5 rounded-full transition-colors no-underline">
                              <ExternalLink size={11} />YouTube
                            </a>
                          )}
                          {teacher.tiktokUrl && (
                            <a href={teacher.tiktokUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-700 hover:border-slate-600 hover:text-white px-3 py-1.5 rounded-full transition-colors no-underline">
                              <ExternalLink size={11} />TikTok
                            </a>
                          )}
                          {teacher.websiteUrl && (
                            <a href={teacher.websiteUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 px-3 py-1.5 rounded-full transition-colors no-underline">
                              <Globe size={11} />Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Thành tích & Chứng chỉ */}
                {achievements.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl px-4 py-3 shadow-md mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award size={16} className="text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">{t("achievements_title")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(achievements as NonNullable<typeof achievements[0]>[]).map((a, i) => (
                        <div key={i} className={`${a.cardBg} rounded-2xl p-4 text-center`}>
                          <div className={`w-10 h-10 ${a.iconBg} rounded-full flex items-center justify-center mx-auto mb-2.5`}>
                            <a.Icon size={18} className={a.iconColor} />
                          </div>
                          <div className="text-sm font-extrabold text-slate-900 leading-tight">{a.value}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                <div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl px-4 py-3 shadow-md mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">{t("courses_title")}</span>
                    </div>
                    <span className="text-white/90 text-sm font-medium">{courses.length} khóa</span>
                  </div>

                  {courses.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-gray-100">
                      Giáo viên chưa có khóa học nào được công bố.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {(() => {
                        const sorted = [...courses].sort((a, b) => b.enrollmentCount - a.enrollmentCount);
                        return courses.map(c => {
                          const rank = sorted.findIndex(x => x.id === c.id);
                          return <CourseCard key={c.id} course={c} badge={COURSE_BADGES[rank % COURSE_BADGES.length]} />;
                        });
                      })()}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </AppShell>
    </>
  );
}
