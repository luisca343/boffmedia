import { useTranslations } from "next-intl";

import { Button, Card, ComicBurst, Eyebrow } from "../ui";

export function SubscribeStrip({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("furrettoday.subscribeStrip");
  return (
    <section className="ft-wrap-wide px-6 py-6">
      <Card
        className="flex flex-wrap items-center justify-between gap-6 px-8 py-7"
        style={{ background: "rgb(var(--ft-yellow))" }}
      >
        <div className="flex items-center gap-[1.125rem]">
          <ComicBurst size={86} color="rgb(var(--ft-pink))" textColor="white" text="NEW!" />
          <div>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h3 className="font-ft-display mb-1.5 mt-0.5 text-4xl leading-none">
              {t("title")}
            </h3>
            <p className="font-ft max-w-xl text-base text-ft-body">
              {t("description")}
            </p>
          </div>
        </div>
        <Button variant="primary" size="lg" onClick={onOpen}>
          {t("cta")}
        </Button>
      </Card>
    </section>
  );
}
