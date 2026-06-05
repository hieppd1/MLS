import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("register") };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
