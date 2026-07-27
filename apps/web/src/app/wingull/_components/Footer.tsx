import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("wingull.footer");

  return (
    <footer className="bg-secondary-soft bg-opacity-80 py-6 mt-auto border-t border-secondary ">
      <div className="container mx-auto px-4 text-center">
        <p className="text-secondary-hover">{t("rights")}</p>
      </div>
    </footer>
  );
}
