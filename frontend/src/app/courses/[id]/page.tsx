"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock, Users, Star, CheckCircle, PlayCircle, Lock, ChevronRight, ChevronDown,
  Award, BookOpen, Target, ArrowLeft, BarChart, Globe, GraduationCap, Calendar, ShoppingCart, Zap,
} from "lucide-react";
import { safeImgUrl } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  useGetPublicCourseQuery,
  useEnrollCourseMutation,
} from "@/lib/features/courses/coursesApi";
import CourseReviews from "@/components/reviews/CourseReviews";
import { addToCart } from "@/lib/features/cart/cartSlice";
import { useListQuizzesQuery } from "@/lib/features/quiz/quizApi";
import PricingCards from "@/components/pricing/PricingCards";
import { useGetCoursePackagesQuery } from "@/lib/features/packages/packagesApi";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

function tryParseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr : []; } catch { return []; }
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 3).join("");
}

function formatUpdateDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
}

function useFormatDuration() {
  const tx = useTranslations("course_detail_extra");
  return (seconds: number) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return tx("hours_short", { h, m });
    return tx("minutes_short", { count: m });
  };
}

/* ─── QuizSection — shows published quizzes related to this course ─── */
function QuizSection({ courseLevel }: { courseLevel: number }) {
  const { data, isLoading } = useListQuizzesQuery({ status: "Published", pageSize: 4 });
  const quizzes = data?.items ?? [];
  const t = useTranslations("course_detail");
  const tx = useTranslations("course_detail_extra");
  const tLevels = useTranslations("level_labels");
  const levelShort = tLevels.has(`${courseLevel}`) ? tLevels(`${courseLevel}`) : tLevels("fallback", { n: courseLevel });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl mb-3 animate-pulse" />)}
      </motion.div>
    );
  }

  if (quizzes.length === 0) return null;

  const QUIZ_TYPE_KEYS: Record<string, string> = {
    PlacementTest: "quiz_type_placement", CourseQuiz: "quiz_type_course", PracticeQuiz: "quiz_type_practice",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Target className="text-white" size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t("quiz_section")}</h2>
            <p className="text-gray-400 text-xs">{t("quizzes_count", {count: quizzes.length})} • {levelShort}</p>
          </div>
        </div>
        <Link href="/placement-test" className="text-sm font-semibold text-blue-600 hover:text-blue-800 no-underline">{t("placement_check")}</Link>
      </div>
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <Link key={quiz.id} href={`/quiz/${quiz.id}`} className="no-underline">
            <div className="group flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">{quiz.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(QUIZ_TYPE_KEYS[quiz.quizType] ? tx(QUIZ_TYPE_KEYS[quiz.quizType]) : quiz.quizType)} · {tx("questions_unit", { count: quiz.questionCount })} · {tx("quiz_pass", { score: quiz.passingScore })}
                  {quiz.timeLimitSeconds && ` · ${tx("minutes_short", { count: Math.round(quiz.timeLimitSeconds / 60) })}`}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const { fmtNumber } = useFormatters();
  const t = useTranslations("course_detail");
  const tx = useTranslations("course_detail_extra");
  const tLevels = useTranslations("level_labels");
  const tLangs = useTranslations("language_labels");
  const formatDuration = useFormatDuration();
  const levelLong = (lvl: number) =>
    tLevels.has(`${lvl}`) ? `${tLevels("fallback", { n: lvl })} — ${tLevels(`${lvl}`)}` : tLevels("fallback", { n: lvl });
  const languageLabel = (code: string | null | undefined) => {
    if (!code) return "—";
    const k = code.toLowerCase();
    return tLangs.has(k) ? tLangs(k) : code;
  };

  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const { data: course, isLoading } = useGetPublicCourseQuery(id, { skip: !id || !isHydrated });
  const [enroll, { isLoading: enrolling }] = useEnrollCourseMutation();

  async function handleEnroll() {
    await enroll(id);
    router.refresh();
  }

  function handleAddToCart() {
    if (!course) return;
    dispatch(addToCart({
      id:           course.id,
      title:        course.title,
      slug:         course.slug ?? course.id,
      coverColor:   "#4f46e5",
      coverEmoji:   "🎓",
      coverUrl:     course.thumbnailUrl ?? null,
      type:         "Course" as never,
      price:        course.price,
      discountPrice: course.discountPrice,
      itemType:     "Course",
      courseId:     course.id,
    }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/thanh-toan");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-64 bg-gradient-to-br from-indigo-600 to-pink-500 animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
            </div>
            <div className="h-80 bg-white rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-base">{t("not_found")}</p>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.sessions.length, 0);
  const totalDuration = course.modules.flatMap((m) => m.sessions).reduce((s, s2) => s + (s2.durationSeconds ?? 0), 0);
  const firstSession = course.modules[0]?.sessions?.[0];
  const firstContentUrl = firstSession ? `/learn/${firstSession.id}` : `/courses/${id}`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-6 pt-3 pb-8">
          {/* Back link – sát top menu */}
          <Link href="/courses" className="flex w-fit items-center gap-1.5 text-white/80 hover:text-white transition-colors mb-4 no-underline">
            <ArrowLeft size={16} />
            <span className="text-sm">{t("back_to_list")}</span>
          </Link>
          <div className="flex items-start gap-8">
            {/* Left text */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1 min-w-0">
              <div className="inline-flex items-center bg-orange-500 px-3 py-1 rounded-full mb-4">
                <span className="text-white text-xs font-bold tracking-wide">{t("popular_badge")}</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-base text-white/90 mb-5 max-w-2xl leading-relaxed">{course.shortDescription}</p>
              )}
              {/* Teacher row */}
              {course.teacherDisplayName && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white text-xs font-bold">{getInitials(course.teacherDisplayName)}</span>
                  </div>
                  <Link href={`/giao-vien/${course.teacherSlug ?? ""}`} className="text-white font-semibold text-sm hover:underline no-underline">
                    {course.teacherDisplayName}
                  </Link>
                  {course.publishedAt && (
                    <>
                      <span className="text-white/40">·</span>
                      <Calendar size={13} className="text-white/70" />
                      <span className="text-white/70 text-sm">{t("updated")} {formatUpdateDate(course.publishedAt)}</span>
                    </>
                  )}
                </div>
              )}

              {/* Stats - single row pills */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Star size={13} className="text-yellow-300 fill-yellow-300 flex-shrink-0" />
                  <span className="text-white text-sm font-semibold">4.9</span>
                  <span className="text-white/70 text-xs">{tx("review_count_short", { count: 234 })}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Users size={13} className="text-white flex-shrink-0" />
                  <span className="text-white text-sm font-semibold">{fmtNumber(course.enrollmentCount ?? 0)}</span>
                  <span className="text-white/70 text-xs">{t("studying")}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <ShoppingCart size={13} className="text-white flex-shrink-0" />
                  <span className="text-white text-sm font-semibold">{fmtNumber(course.paidEnrollmentCount ?? 0)}</span>
                  <span className="text-white/70 text-xs">{t("bought")}</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <Clock size={13} className="text-white/80 flex-shrink-0" />
                    <span className="text-white/90 text-sm">{formatDuration(totalDuration)}</span>
                  </div>
                )}
                {totalLessons > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <BookOpen size={13} className="text-white/80 flex-shrink-0" />
                    <span className="text-white/90 text-sm">{t("sessions_count", {count: totalLessons})}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <GraduationCap size={13} className="text-white/80 flex-shrink-0" />
                  <span className="text-white/90 text-sm">{levelLong(course.level)}</span>
                </div>
              </div>
            </motion.div>

            {/* Right panel: curriculum preview (unenrolled) OR progress card (enrolled) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden lg:block lg:flex-shrink-0 lg:w-72"
            >
              {course.isEnrolled ? (
                <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl overflow-hidden">
                  {safeImgUrl(course.thumbnailUrl) ? (
                    <img src={safeImgUrl(course.thumbnailUrl)!} alt={course.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-white/10 flex items-center justify-center">
                      <BookOpen className="text-white/40" size={40} />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-white/80 text-xs mb-1">{t("learning_progress")}</p>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
                      <div className="bg-white rounded-full h-1.5 w-1/4" />
                    </div>
                    <Link href={firstContentUrl} className="flex items-center justify-center gap-2 w-full bg-white text-purple-700 hover:bg-white/90 font-bold py-2.5 rounded-xl transition-colors no-underline text-sm">
                      <PlayCircle size={16} />
                      {t("continue_learning")}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-white" size={15} />
                    </div>
                    <h3 className="font-bold text-white text-base">{tx("curriculum_header")}</h3>
                  </div>
                  <div className="px-3 pb-2 space-y-1.5">
                    {course.modules.slice(0, 3).map((mod, idx) => {
                      const circleGradients = ["from-blue-500 to-indigo-600", "from-purple-500 to-violet-600", "from-pink-500 to-rose-600"];
                      return (
                        <div key={mod.id} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${circleGradients[idx] ?? "from-gray-400 to-gray-600"} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-white text-xs font-bold">{idx + 1}</span>
                          </div>
                          <p className="text-sm font-medium text-white flex-1 truncate">
                            {mod.title} · {t("chapter_lessons", {count: mod.sessions.length})}
                          </p>
                          <ChevronRight size={14} className="text-white/50 flex-shrink-0" />
                        </div>
                      );
                    })}
                    {course.modules.length > 3 && (
                      <p className="text-sm text-white/50 pl-3 py-1">{tx("more_chapters", { count: course.modules.length - 3 })}</p>
                    )}
                  </div>
                  <div className="px-3 pb-3 pt-1">
                    <button
                      onClick={() => document.getElementById("course-content")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                    >
                      {t("view_full_below")}
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Introduction */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">{t("intro_title")}</h2>
              {course.description ? (
                <div className="prose-kh" dangerouslySetInnerHTML={{ __html: course.description }} />
              ) : (
                <p className="text-gray-700 text-sm leading-relaxed">{course.shortDescription ?? t("no_description")}</p>
              )}
              <div className="mt-5 grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1"><BarChart className="text-blue-600" size={18} /><span className="font-semibold text-blue-900 text-sm">{t("level_label")}</span></div>
                  <p className="text-xs text-blue-700">{levelLong(course.level)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1"><Clock className="text-green-600" size={18} /><span className="font-semibold text-green-900 text-sm">{t("duration_label")}</span></div>
                  <p className="text-xs text-green-700">{totalDuration > 0 ? formatDuration(totalDuration) : "—"} · {t("sessions_count", { count: totalLessons })}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1"><Globe className="text-purple-600" size={18} /><span className="font-semibold text-purple-900 text-sm">{t("language_label")}</span></div>
                  <p className="text-xs text-purple-700">{languageLabel(course.language)}</p>
                </div>
              </div>
            </motion.div>

            {/* What you'll learn */}
            {tryParseJsonArray(course.outcomes).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"><Target className="text-white" size={20} /></div>
                <h2 className="text-xl font-bold">{tx("what_you_learn")}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {tryParseJsonArray(course.outcomes).map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {/* Requirements */}
            {tryParseJsonArray(course.requirements).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500"><BookOpen className="text-white" size={20} /></div>
                <h2 className="text-xl font-bold">{t("requirements_title")}</h2>
              </div>
              <ul className="space-y-2">
                {tryParseJsonArray(course.requirements).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            )}

            {/* Who is this for */}
            {tryParseJsonArray(course.targetAudience).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-orange-600" size={22} />
                <h2 className="text-xl font-bold text-orange-900">{tx("target_audience")}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {tryParseJsonArray(course.targetAudience).map((item) => (
                  <div key={item} className="flex items-start gap-2 bg-white rounded-lg p-3">
                    <Award className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {/* Course Content */}
            <motion.div id="course-content" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500"><BookOpen className="text-white" size={20} /></div>
                <div>
                  <h2 className="text-xl font-bold">{t("curriculum_title")}</h2>
                  <p className="text-gray-500 text-xs">{tx("modules_unit", { count: course.modules.length })} · {t("sessions_count", {count: totalLessons})}{totalDuration > 0 ? ` · ${formatDuration(totalDuration)}` : ""}</p>
                </div>
              </div>
              {course.modules.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">{tx("no_content")}</p>
              ) : (
                <div className="space-y-3">
                  {course.modules.map((mod, mIdx) => {
                    const isOpen = expandedModule === mod.id;
                    const modDuration = mod.sessions.reduce((s, s2) => s + (s2.durationSeconds ?? 0), 0);
                    return (
                      <div key={mod.id} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 transition-colors">
                        <button
                          onClick={() => setExpandedModule(isOpen ? null : mod.id)}
                          className="w-full p-4 bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-pink-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                                {mIdx + 1}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-sm">{mod.title}</p>
                                <p className="text-xs text-gray-500">{t("chapter_lessons", {count: mod.sessions.length})}{modDuration > 0 ? ` · ${formatDuration(modDuration)}` : ""}</p>
                              </div>
                            </div>
                            <ChevronRight className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`} size={20} />
                          </div>
                        </button>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="bg-white border-t border-gray-100">
                            <div className="p-3 space-y-1">
                              {mod.sessions.map((session) => {
                                const accessible = course.isEnrolled || session.isFreeTrial;
                                const inner = (
                                  <div className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${!accessible ? "opacity-60" : ""}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accessible ? "bg-purple-100" : "bg-gray-100"}`}>
                                        {accessible ? <PlayCircle className="text-purple-600" size={16} /> : <Lock className="text-gray-400" size={14} />}
                                      </div>
                                      <div>
                                        <p className={`text-sm font-medium ${accessible ? "text-gray-900" : "text-gray-400"}`}>{session.title}</p>
                                        {session.isFreeTrial && !course.isEnrolled && <p className="text-xs text-blue-600">{tx("free_trial_label")}</p>}
                                      </div>
                                    </div>
                                    {session.durationSeconds > 0 && <span className="text-xs text-gray-500 flex-shrink-0">{formatDuration(session.durationSeconds)}</span>}
                                  </div>
                                );
                                return (
                                  <div key={session.id}>
                                    {accessible ? <Link href={`/learn/${session.id}`} className="block no-underline">{inner}</Link> : inner}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Quiz section */}
            <QuizSection courseLevel={course.level} />

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <CourseReviews courseId={id} isEnrolled={course.isEnrolled} />
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Dynamic pricing packages from backend */}
              <PricingCards courseId={id} />

              {/* Stats card */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg p-5 text-white">
                <h3 className="font-bold mb-4">{tx("stats_title")}</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{tx("completion_rate")}</span>
                    <span className="font-bold text-sm">94%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: "94%" }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { Icon: Calendar, label: tx("stat_updated"),  value: "T5/2026" },
                    { Icon: Users,    label: tx("stat_students"),  value: "1,234"   },
                    { Icon: Award,    label: tx("stat_certificate"), value: tx("stat_certificate_yes") },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2"><Icon size={15} /><span>{label}</span></div>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA — shown only when no backend packages exist (fallback) */}
              {course.isEnrolled ? (
                <Link href={firstContentUrl} className="block text-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all no-underline">
                  {t("continue_learning")}
                </Link>
              ) : firstSession?.isFreeTrial ? (
                <Link href={firstContentUrl} className="block text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all no-underline">
                  Học thử miễn phí →
                </Link>
              ) : null}

            </div>
          </div>

        </div>
      </div>

      <style>{`
        .prose-kh { font-size: 14px; color: #374151; line-height: 1.8; }
        .prose-kh p { margin: 0 0 12px; }
        .prose-kh h2, .prose-kh h3 { font-weight: 700; color: #111827; margin: 14px 0 6px; }
        .prose-kh ul, .prose-kh ol { padding-left: 20px; margin: 0 0 12px; }
        .prose-kh li { margin-bottom: 4px; }
        .prose-kh strong { font-weight: 700; color: #111827; }
        .prose-kh a { color: #4f46e5; }
        .prose-kh img { max-width: 100%; border-radius: 8px; }
        .no-underline { text-decoration: none !important; }
      `}</style>
    </div>
  );
}
