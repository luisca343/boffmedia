import { getTranslations } from "next-intl/server";

export default async function Guias() {
  const t = await getTranslations("guias.page");

  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
    </div>
  );
}
