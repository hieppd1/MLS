"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/i18nFormat";
import {
  useGetAdminBookDetailQuery,
  useGetBookTranslationsQuery,
  useUpsertBookTranslationMutation,
  type BookTranslationDto,
} from "@/lib/features/admin/adminBooksApi";

type Tab = "overview" | "translations";

const LOCALES = ["vi", "en", "ko"] as const;
type Locale = (typeof LOCALES)[number];

export default function AdminBookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const t = useTranslations("admin_book_detail");

  const [tab, setTab] = useState<Tab>("overview");

  const { data: book, isLoading, isError } = useGetAdminBookDetailQuery(id ?? "", {
    skip: !id,
  });

  if (!id) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button
        onClick={() => router.push("/admin/sach")}
        className="mb-3 text-sm text-blue-600 hover:underline"
      >
        {t("back")}
      </button>

      {isLoading && <div className="text-sm text-gray-500">{t("loading")}</div>}
      {isError || !book ? (
        !isLoading && <div className="text-sm text-red-600">{t("not_found")}</div>
      ) : (
        <>
          <header className="mb-6 flex items-start gap-4">
            <div
              className="flex h-20 w-16 flex-none items-center justify-center rounded text-3xl"
              style={{ backgroundColor: book.coverColor }}
            >
              {book.coverEmoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
              <div className="mt-1 text-sm text-gray-500">
                {book.author ?? "—"} · {book.type} · {book.status}
              </div>
            </div>
          </header>

          <div className="mb-4 flex gap-2 border-b border-gray-200">
            {(["overview", "translations"] as Tab[]).map((tk) => (
              <button
                key={tk}
                onClick={() => setTab(tk)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  tab === tk
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tk === "overview" ? t("tab_overview") : t("tab_translations")}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <section className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-5 text-sm md:grid-cols-2">
              <Field label={t("author")} value={book.author ?? "—"} />
              <Field label={t("publisher")} value={book.publisher ?? "—"} />
              <Field label={t("isbn")} value={book.isbn ?? "—"} />
              <Field label={t("category")} value={book.categoryName ?? "—"} />
              <Field label={t("type")} value={book.type} />
              <Field label={t("status")} value={book.status} />
              <Field label={t("price")} value={formatCurrency(book.price)} />
              <Field
                label={t("short_description")}
                value={book.shortDescription ?? "—"}
                full
              />
              <Field label={t("description")} value={book.description ?? "—"} full />
            </section>
          )}

          {tab === "translations" && <TranslationsTab bookId={book.id} />}
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap text-gray-900">{value}</div>
    </div>
  );
}

function TranslationsTab({ bookId }: { bookId: string }) {
  const t = useTranslations("admin_book_detail");
  const { data } = useGetBookTranslationsQuery(bookId);

  return (
    <div className="space-y-4">
      {LOCALES.map((loc) => (
        <LocaleCard
          key={loc}
          bookId={bookId}
          locale={loc}
          existing={data?.find((x) => x.locale === loc) ?? null}
          label={t(`locale_${loc}` as "locale_vi")}
        />
      ))}
    </div>
  );
}

function LocaleCard({
  bookId,
  locale,
  existing,
  label,
}: {
  bookId: string;
  locale: Locale;
  existing: BookTranslationDto | null;
  label: string;
}) {
  const t = useTranslations("admin_book_detail");
  const [upsert, { isLoading }] = useUpsertBookTranslationMutation();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setTitle(existing?.title ?? "");
    setShortDescription(existing?.shortDescription ?? "");
    setDescription(existing?.description ?? "");
  }, [existing?.title, existing?.shortDescription, existing?.description]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await upsert({
        id: bookId,
        locale,
        title: title.trim() || null,
        shortDescription: shortDescription.trim() || null,
        description: description.trim() || null,
      }).unwrap();
      setMsg({ kind: "ok", text: t("toast_save_ok") });
    } catch {
      setMsg({ kind: "err", text: t("toast_save_fail") });
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{label}</h3>
        <span className="text-xs text-gray-500">
          {existing?.updatedAt
            ? t("updated_at", { at: new Date(existing.updatedAt).toLocaleString() })
            : t("never_translated")}
        </span>
      </div>
      <p className="mb-3 text-xs text-gray-500">{t("translation_hint")}</p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("f_title")}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("f_short_desc")}
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("f_desc")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? t("btn_saving") : t("btn_save")}
        </button>
        {msg && (
          <span
            className={`text-sm ${
              msg.kind === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
