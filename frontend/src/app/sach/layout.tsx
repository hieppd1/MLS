import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("books") };
}

export default function SachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
