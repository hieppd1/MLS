"use client";

import { useTranslations } from "next-intl";

export default function AdminSettingsPage() {
  const t = useTranslations("admin_settings");
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_org_name")}</label>
          <input
            type="text"
            placeholder={t("org_name_ph")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_contact_email")}</label>
          <input
            type="email"
            placeholder="admin@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("field_domain")}</label>
          <input
            type="text"
            placeholder={t("domain_ph")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <p className="mt-1 text-xs text-gray-400">{t("coming_soon")}</p>
        </div>

        <div className="pt-2">
          <button
            disabled
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
          >
            {t("btn_save")}
          </button>
        </div>
      </div>
    </div>
  );
}
