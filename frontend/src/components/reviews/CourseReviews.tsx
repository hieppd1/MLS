"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThumbsUp, MessageSquare, Star as StarIcon } from "lucide-react";
import {
  useGetCourseReviewsQuery,
  useGetReviewStatsQuery,
  useGetMyReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  type ReviewDto,
} from "@/lib/features/reviews/reviewsApi";
import { useAppSelector } from "@/lib/hooks";

interface Props {
  courseId: string;
  isEnrolled?: boolean;
}

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";

  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-colors leading-none ${
            onChange ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
          } ${s <= active ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}



function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const fallback = (
    <div
      className="rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 text-white font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-purple-100"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
  if (!url || imgError) return fallback;
  return (
    <img
      src={url}
      alt={name}
      className="rounded-full object-cover ring-2 ring-purple-100 flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const t = useTranslations("reviews");
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return <span>{t("today")}</span>;
  if (days < 7) return <span>{t("days_ago", { count: days })}</span>;
  if (days < 30) return <span>{t("weeks_ago", { count: Math.floor(days / 7) })}</span>;
  return <span>{t("months_ago", { count: Math.floor(days / 30) })}</span>;
}

function ReviewCard({ review, courseId, isMine }: { review: ReviewDto; courseId: string; isMine?: boolean }) {
  const t = useTranslations("reviews");
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content);
  const [title, setTitle] = useState(review.title ?? "");
  const [updateReview, { isLoading: updating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();

  async function handleSave() {
    await updateReview({ courseId, reviewId: review.id, rating, title: title || undefined, content });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(t("confirm_delete"))) return;
    await deleteReview({ courseId, reviewId: review.id });
  }

  return (
    <div className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      {isMine && (
        <div className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block mb-2">
          {t("my_review_badge")}
        </div>
      )}
      <div className="flex items-start gap-4">
        <Avatar name={review.user.name} url={review.user.avatarUrl} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{review.user.name}</span>
              {review.isVerifiedPurchase && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">{t("verified_purchase")}</span>
              )}
            </div>
            <span className="text-sm text-gray-500"><RelativeTime iso={review.createdAt} /></span>
          </div>

          {editing ? (
            <div className="space-y-2 mt-2">
              <StarRating value={rating} onChange={setRating} size="md" />
              <input
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder={t("title_placeholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={updating || !content.trim()} className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 disabled:opacity-50">
                  {updating ? t("saving") : t("save")}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} size={14} className={i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 fill-gray-300"} />
                ))}
              </div>
              {review.title && <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>}
              <p className="text-gray-700 leading-relaxed text-sm">{review.content}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <button className="flex items-center gap-1 hover:text-purple-600 transition-colors cursor-pointer">
                  <ThumbsUp size={14} /><span>{t("helpful")}</span>
                </button>
                {isMine && (
                  <>
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1 hover:text-purple-600 transition-colors cursor-pointer">
                      <MessageSquare size={14} /><span>{t("edit")}</span>
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="text-red-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50">
                      {deleting ? t("deleting") : t("delete")}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ courseId }: { courseId: string }) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [createReview, { isLoading }] = useCreateReviewMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(t("please_rate")); return; }
    if (!content.trim()) { setError(t("please_content")); return; }
    setError("");
    try {
      await createReview({ courseId, rating, title: title || undefined, content }).unwrap();
      setRating(0); setTitle(""); setContent("");
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? t("send_failed"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-purple-50 rounded-xl border border-purple-100 p-5">
      <h3 className="font-bold text-gray-900 mb-3">{t("write_title")}</h3>
      <div className="mb-3">
        <p className="text-sm text-gray-500 mb-1">{t("overall_rating")}</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <input
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder={t("title_placeholder_form")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        rows={4}
        placeholder={t("content_placeholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-3 px-6 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isLoading ? t("sending") : t("send")}
      </button>
    </form>
  );
}

export default function CourseReviews({ courseId, isEnrolled }: Props) {
  const t = useTranslations("reviews");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const isAuthenticated = useAppSelector((s) => !!s.auth.accessToken);
  const { data: stats } = useGetReviewStatsQuery(courseId);
  const { data: reviews, isLoading } = useGetCourseReviewsQuery({ courseId, page, pageSize });
  const { data: myReview } = useGetMyReviewQuery(courseId, { skip: !isAuthenticated });

  const totalPages = reviews ? Math.ceil(reviews.total / pageSize) : 1;

  const avgRating = stats?.averageRating ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
            <StarIcon className="text-white" size={22} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <StarIcon className="text-yellow-500 fill-yellow-500" size={14} />
              <span className="font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
              <span>• {t("count_label", { n: totalReviews })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      {totalReviews > 0 && (
        <div className="flex gap-8 mb-8 pb-8 border-b border-gray-100">
          <div className="text-center">
            <p className="text-5xl font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {[1,2,3,4,5].map((i) => (
                <StarIcon key={i} size={14} className={i <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-200 fill-gray-200"} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{t("count_label", { n: totalReviews })}</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5,4,3,2,1].map((s) => {
              const count = stats?.distribution?.[s] ?? 0;
              const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-3 text-right">{s}</span>
                  <StarIcon size={11} className="text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-7 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review form / prompts */}
      {isAuthenticated && isEnrolled && (
        <div className="mb-8">
          {myReview
            ? <ReviewCard review={myReview} courseId={courseId} isMine />
            : <ReviewForm courseId={courseId} />}
        </div>
      )}
      {isAuthenticated && !isEnrolled && (
        <p className="text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6">
          {t("enroll_to_review")}
        </p>
      )}
      {!isAuthenticated && (
        <p className="text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6">
          <a href="/auth/login" className="text-purple-600 font-medium hover:underline">{t("login_link")}</a>{t("login_suffix")}
        </p>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-6">
          {[1,2,3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews && reviews.items.length > 0 ? (
        <div className="space-y-6">
          {reviews.items
            .filter((r) => !myReview || r.id !== myReview.id)
            .map((r) => (
              <ReviewCard key={r.id} review={r} courseId={courseId} />
            ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                {t("prev")}
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                {t("next")}
              </button>
            </div>
          )}
        </div>
      ) : (
        !isLoading && totalReviews === 0 && (
          <p className="text-sm text-center text-gray-400 py-8">{t("no_reviews")}</p>
        )
      )}
    </div>
  );
}
