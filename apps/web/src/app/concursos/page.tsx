import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RoomEntry } from "./_components/RoomEntry";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("concursos");
  return { title: `${t("title")} · Boffmedia`, description: t("intro") };
}
export default function ConcursosPage() {
  return <RoomEntry />;
}
