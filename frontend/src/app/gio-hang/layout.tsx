import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("cart") };
}

export default function GioHangLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
