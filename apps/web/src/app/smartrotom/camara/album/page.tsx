import { getTranslations } from "next-intl/server";

export default async function Album() {
  const t = await getTranslations("camara");
  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">{t("album.title")}</h1>
    </div>
  );
}
