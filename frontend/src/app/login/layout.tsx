import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("login") };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
