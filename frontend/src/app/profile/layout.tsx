import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("profile") };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
