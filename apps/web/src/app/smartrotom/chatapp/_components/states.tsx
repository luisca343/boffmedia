import { useTranslations } from "next-intl";
import { Button, Icon, Skeleton } from "./ui";

export function SkeletonSidebar() {
  return (
    <aside className="flex w-[360px] flex-none flex-col border-r border-ca-800 bg-ca-panel">
      <div className="flex h-[60px] items-center gap-2.5 bg-ca-header px-4">
        <Skeleton className="h-[38px] w-[38px] rounded-full" />
        <Skeleton className="h-4 w-[45%]" />
      </div>
      <div className="p-3"><Skeleton className="h-10 w-full" /></div>
      <div className="flex flex-1 flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-[11px]">
            <Skeleton className="h-[49px] w-[49px] flex-none rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-3 w-[55%]" />
              <Skeleton className="h-2.5 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SkeletonConv() {
  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-ca-wallpaper">
      <div className="ca-doodle pointer-events-none absolute inset-0" />
      <div className="relative z-[2] flex h-[60px] items-center gap-3.5 border-b border-ca-800 bg-ca-header px-4">
        <Skeleton className="h-[42px] w-[42px] rounded-full" />
        <div>
          <Skeleton className="mb-2 h-3 w-[120px]" />
          <Skeleton className="h-2.5 w-[70px]" />
        </div>
      </div>
      <div className="relative z-[1] flex flex-1 flex-col gap-2.5 px-[6%] py-4">
        {([["start", 200], ["start", 130], ["end", 240], ["start", 170], ["end", 110]] as const).map(([side, w], i) => (
          <div key={i} className={`flex ${side === "end" ? "justify-end" : "justify-start"}`}>
            <Skeleton className="h-9 rounded-ca-lg" style={{ width: w }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function EmptySidebar({ onNew }: { onNew: () => void }) {
  const t = useTranslations("chatapp");
  return (
    <aside className="flex w-[360px] flex-none flex-col border-r border-ca-800 bg-ca-panel">
      <div className="flex h-[60px] items-center gap-2.5 bg-ca-header px-4">
        <div className="grid h-[38px] w-[38px] place-items-center rounded-full bg-ca-accent"><Icon name="message" size={18} className="text-ca-on-accent" /></div>
        <div className="text-[17px] font-bold text-ca-50">{t("sidebar.title")}<small className="block text-[11px] font-medium text-ca-400">{t("sidebar.subtitle")}</small></div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-ca-accent/[.14] text-ca-accent-soft"><Icon name="inbox" size={40} /></div>
        <h3 className="text-[17px] font-semibold text-ca-50">{t("empty.title")}</h3>
        <p className="max-w-[360px] text-[14.5px] leading-[1.6] text-ca-400">{t("empty.body")}</p>
        <Button onClick={onNew}><Icon name="plus" size={16} /> {t("common.newChat")}</Button>
      </div>
    </aside>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("chatapp");
  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-ca-wallpaper">
      <div className="ca-doodle pointer-events-none absolute inset-0" />
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-ca-error/[.15] text-ca-error"><Icon name="zap" size={40} /></div>
        <h3 className="text-[22px] font-semibold text-ca-50">{t("error.title")}</h3>
        <p className="max-w-[360px] text-[14.5px] leading-[1.6] text-ca-400">{t("error.body")}</p>
        <Button onClick={onRetry}><Icon name="zap" size={16} /> {t("common.retry")}</Button>
      </div>
    </section>
  );
}
