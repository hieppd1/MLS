"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Users, Clock, ChevronLeft, ChevronRight,
  Award, BookOpen, TrendingUp,
} from "lucide-react";
import { safeImgUrl } from "@/lib/utils";
import { useFormatters } from "@/lib/hooks/useFormatters";
import {
  useGetPublicCoursesQuery,
  useGetActiveBannersQuery,
  useGetPublicLearningLevelsQuery,
} from "@/lib/features/courses/coursesApi";
import { useGetTeacherListQuery } from "@/lib/features/teachers/teachersApi";

function discountPercent(price: number, discountPrice: number) {
  if (!price || !discountPrice) return 0;
  return Math.round((1 - discountPrice / price) * 100);
}

const PLATFORM_STATS_ICONS = [
  { Icon: Award,      statKey: "stat_avg_rating", value: "4.9/5" },
  { Icon: TrendingUp, statKey: "stat_satisfaction", value: "98%" },
];

const FALLBACK_BANNERS = [
  { id: "f1", title: "Khóa học tiếng Việt cho người nước ngoài", description: "Học tiếng Việt dễ dàng với các khóa học chất lượng cao từ giáo viên bản ngữ", gradFrom: "from-blue-900",   gradVia: "via-blue-800",   gradTo: "to-blue-700",   image: null as string | null },
  { id: "f2", title: "Học tiếng Việt online hiệu quả",           description: "Phương pháp học độc đáo giúp bạn tiến bộ nhanh chóng",                         gradFrom: "from-purple-900", gradVia: "via-purple-800", gradTo: "to-purple-700", image: null as string | null },
  { id: "f3", title: "Giảng viên bản ngữ chuyên nghiệp",        description: "Đội ngũ giáo viên nhiều năm kinh nghiệm, tận tâm và nhiệt huyết",               gradFrom: "from-green-900",  gradVia: "via-green-800",  gradTo: "to-green-700",  image: null as string | null },
];

export default function CoursesPage() {
  const router = useRouter();
  const t = useTranslations();
  const { fmtCurrency, fmtNumber } = useFormatters();
  const [levelFilter, setLevelFilter] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTeacherSlide, setCurrentTeacherSlide] = useState(0);
  const [levelTabOffset, setLevelTabOffset] = useState(0);
  const pageSize = 8;

  const { data, isLoading } = useGetPublicCoursesQuery({
    page, pageSize, level: levelFilter, search: debouncedSearch || undefined,
  });
  const { data: learningLevels = [] } = useGetPublicLearningLevelsQuery();
  const { data: apiBanners } = useGetActiveBannersQuery();
  const { data: teacherData } = useGetTeacherListQuery({ pageSize: 8 });

  const GRAD_COLORS = [
    "from-cyan-400 to-blue-500", "from-purple-400 to-pink-500",
    "from-red-400 to-orange-500", "from-green-400 to-teal-500",
    "from-yellow-400 to-orange-500", "from-indigo-400 to-purple-500",
  ];

  const PLATFORM_STATS = [
    { Icon: Users,    value: teacherData && teacherData.length > 0 ? `${fmtNumber(teacherData.reduce((a, t2) => a + t2.totalStudents, 0))}+` : "1,000+", label: t("courses.stat_enrolled") },
    { Icon: BookOpen, value: data?.total ? `${data.total}+` : "20+", label: t("courses.stat_courses") },
    ...PLATFORM_STATS_ICONS.map((s) => ({ ...s, label: t(`courses.${s.statKey}`) })),
  ];

  const banners = (apiBanners && apiBanners.length > 0)
    ? apiBanners.map((b, i) => ({
        id: b.id,
        title: b.title,
        description: b.subtitle ?? b.description ?? "",
        gradFrom: FALLBACK_BANNERS[i % 3].gradFrom,
        gradVia:  FALLBACK_BANNERS[i % 3].gradVia,
        gradTo:   FALLBACK_BANNERS[i % 3].gradTo,
        image: b.imageUrl,
      }))
    : FALLBACK_BANNERS;

  const levels = [
    { id: "all", label: t("courses.all_levels") },
    ...(learningLevels.length > 0
      ? learningLevels.map(ll => ({ id: String(ll.orderIndex), label: ll.name }))
      : [1,2,3,4,5,6].map(n => ({ id: String(n), label: `Cấp ${n}` }))
    ),
  ];

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout((window as Window & { __kh?: ReturnType<typeof setTimeout> }).__kh);
    (window as Window & { __kh?: ReturnType<typeof setTimeout> }).__kh = setTimeout(() => {
      setDebouncedSearch(value); setPage(1);
    }, 400);
  }

  const slide = banners[currentSlide] ?? banners[0];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER CAROUSEL ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden h-80 bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {slide.image && (
              <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradFrom} ${slide.gradVia} ${slide.gradTo} opacity-90`} />
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')" }}
            />
            <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
              <div className="max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-full mb-4">
                    <TrendingUp size={16} className="text-yellow-300" />
                    <span className="text-white font-semibold text-xs">{t("courses.quality_badge")}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{slide.title}</h1>
                  <p className="text-base text-white/90 mb-5 leading-relaxed">{slide.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => document.getElementById('course-list-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2.5 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                      <span>{t("courses.start_learning")}</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => document.getElementById('teachers-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white/20 backdrop-blur-md border-2 border-white/50 hover:bg-white/30 text-white font-semibold px-6 py-2.5 rounded-full transition-all">
                      {t("courses.learn_more")}
                    </button>
                  </div>
                </motion.div>
              </div>
              <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-48 h-48 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <BookOpen size={48} className="mx-auto mb-2 opacity-80" />
                    <p className="text-lg font-bold">{t("courses.learning_box_title")}</p>
                    <p className="text-sm opacity-80">{t("courses.learning_box_subtitle")}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => setCurrentSlide(p => (p - 1 + banners.length) % banners.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
        >
          <ChevronLeft size={22} className="text-gray-800" />
        </button>
        <button
          onClick={() => setCurrentSlide(p => (p + 1) % banners.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
        >
          <ChevronRight size={22} className="text-gray-800" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all ${i === currentSlide ? "bg-white h-2 w-8" : "bg-white/50 w-2 h-2 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>

      {/* ── LEVEL FILTER TABS ─────────────────────────────────────────────── */}
      <div className="bg-white sticky top-0 z-20" style={{ boxShadow: "0 1px 0 0 rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative py-3">
            {levelTabOffset > 0 && (
              <button
                onClick={() => setLevelTabOffset(p => Math.max(0, p - 1))}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-700" />
              </button>
            )}
            <div className="overflow-hidden mx-8">
              <div
                className="flex gap-2 transition-transform duration-300"
                style={{ transform: `translateX(-${levelTabOffset * 130}px)` }}
              >
                {levels.map((lv) => {
                  const active = lv.id === "all" ? levelFilter === undefined : levelFilter === Number(lv.id);
                  return (
                    <button
                      key={lv.id}
                      onClick={() => { setLevelFilter(lv.id === "all" ? undefined : Number(lv.id)); setPage(1); }}
                      className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex-shrink-0 text-sm ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {lv.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {levelTabOffset < levels.length - 6 && (
              <button
                onClick={() => setLevelTabOffset(p => Math.min(levels.length - 6, p + 1))}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={18} className="text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── COURSE GRID ───────────────────────────────────────────────────── */}
      <div id="course-list-section" className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("courses.popular_courses")}</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text" value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder={t("nav.search_placeholder")}
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
                <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option>{t("courses.sort_newest")}</option>
                <option>{t("courses.sort_popular")}</option>
                <option>{t("courses.sort_price_asc")}</option>
                <option>{t("courses.sort_price_desc")}</option>
              </select>
            </div>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-2/5 bg-gray-200 rounded" />
                    <div className="h-4 w-4/5 bg-gray-200 rounded" />
                    <div className="h-3 w-3/5 bg-gray-200 rounded" />
                    <div className="h-5 w-2/5 bg-red-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !data?.items.length && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-400 text-base">{t("courses.no_results")}</p>
            </div>
          )}

          {/* Cards */}
          {!isLoading && !!data?.items.length && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.items.map((course, idx) => {
                const price = course.price ?? 0;
                const hasDiscount = course.discountPrice != null && course.discountPrice < price;
                const pct = hasDiscount ? discountPercent(price, course.discountPrice!) : 0;
                const levelLabel = learningLevels.find(l => l.orderIndex === course.level)?.name ?? `Cấp ${course.level}`;
                const thumb = safeImgUrl(course.thumbnailUrl);

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link href={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
                      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer group">
                        {/* Thumbnail */}
                        <div className="relative overflow-hidden rounded-t-lg">
                          {thumb ? (
                            <img
                              src={thumb} alt={course.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                              <BookOpen className="text-white/60" size={40} />
                            </div>
                          )}
                          {/* Badge top-left */}
                          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {course.isEnrolled ? t("courses.badge_learning") : pct > 0 ? t("courses.badge_sale") : t("courses.badge_new")}
                          </div>
                          {/* Duration badge top-right */}
                          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Clock size={12} />
                            <span>{t("courses.sessions_count", { count: course.sessionCount ?? 0 })}</span>
                          </div>
                          {course.isFree && (
                            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">FREE</div>
                          )}
                          {!course.isFree && pct > 0 && (
                            <div className="absolute bottom-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">-{pct}%</div>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-4">
                          <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-gray-900">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="text-yellow-500 fill-yellow-500" size={14} />
                              <span className="font-medium text-gray-800">4.8</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users size={14} />
                              <span>1,000+</span>
                            </div>
                            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                              {levelLabel}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            {course.isFree || price === 0 ? (
                              <span className="text-xl font-bold text-green-600">{t("course.free")}</span>
                            ) : hasDiscount ? (
                              <>
                                <span className="text-xl font-bold text-red-600">{fmtCurrency(course.discountPrice ?? 0)}</span>
                                <span className="text-sm text-gray-400 line-through">{fmtCurrency(price)}</span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-red-600">{fmtCurrency(price)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {!isLoading && !!data?.items.length && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data || data.total <= page * pageSize}
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded-full transition-all"
              >
                {t("courses.load_more")}
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TEACHERS SECTION ──────────────────────────────────────────────── */}
      <div id="teachers-section" className="bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t("courses.teachers_heading")}</h2>
            <p className="text-blue-100">{t("courses.teachers_desc")}</p>
          </div>
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500"
                style={{ transform: `translateX(-${currentTeacherSlide * 25}%)` }}
              >
                {(teacherData ?? []).map((teacher, idx) => {
                  const grad = GRAD_COLORS[idx % GRAD_COLORS.length];
                  const initials = teacher.displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={teacher.id} className="flex-shrink-0 w-1/4 min-w-[200px]">
                      <Link href={`/giao-vien/${teacher.slug}`} className="block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/20 transition-all no-underline">
                        <div className={`w-24 h-24 bg-gradient-to-br ${grad} rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden`}>
                          {teacher.avatarUrl ? (
                            <img src={safeImgUrl(teacher.avatarUrl) ?? ""} alt={teacher.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-3xl font-bold">{initials}</span>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{teacher.displayName}</h3>
                        <p className="text-blue-200 text-sm mb-4">{teacher.specialization ?? teacher.headline ?? ""}</p>
                        <div className="flex items-center justify-center gap-4 text-sm">
                          <div className="text-white">
                            <div className="font-bold">{teacher.courseCount}</div>
                            <div className="text-blue-200 text-xs">{t("courses.teacher_course_label")}</div>
                          </div>
                          <div className="w-px h-8 bg-white/20" />
                          <div className="text-white">
                            <div className="font-bold">{teacher.totalStudents > 0 ? `${fmtNumber(teacher.totalStudents)}+` : "—"}</div>
                            <div className="text-blue-200 text-xs">{t("courses.teacher_student_label")}</div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
            {currentTeacherSlide > 0 && (
              <button
                onClick={() => setCurrentTeacherSlide(p => Math.max(0, p - 1))}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="text-gray-700" size={20} />
              </button>
            )}
            {currentTeacherSlide < (teacherData?.length ?? 0) - 4 && (
              <button
                onClick={() => setCurrentTeacherSlide(p => Math.min((teacherData?.length ?? 4) - 4, p + 1))}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="text-gray-700" size={20} />
              </button>
            )}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.max(1, (teacherData?.length ?? 1) - 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTeacherSlide(i)}
                className={`h-2 rounded-full transition-all ${i === currentTeacherSlide ? "bg-white w-8" : "bg-white/40 w-2"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS SECTION ─────────────────────────────────────────────────── */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {PLATFORM_STATS.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
                  <stat.Icon className="text-white" size={28} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
