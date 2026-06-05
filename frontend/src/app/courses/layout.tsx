import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("courses") };
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
