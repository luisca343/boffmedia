import { useTranslations } from "next-intl";
import { Button, Icon, Skeleton } from "./ui";

export function SkeletonSidebar() {
  return (
    <aside className="flex w-[22.5rem] flex-none flex-col border-r border-ca-800 bg-ca-panel">
      <div className="flex h-[3.75rem] items-center gap-2.5 bg-ca-header px-4">
        <Skeleton className="h-[2.375rem] w-[2.375rem] rounded-full" />
        <Skeleton className="h-4 w-[45%]" />
      </div>
      <div className="p-3"><Skeleton className="h-10 w-full" /></div>
      <div className="flex flex-1 flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-[0.6875rem]">
            <Skeleton className="h-[3.0625rem] w-[3.0625rem] flex-none rounded-full" />
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
      <div className="relative z-[2] flex h-[3.75rem] items-center gap-3.5 border-b border-ca-800 bg-ca-header px-4">
        <Skeleton className="h-[2.625rem] w-[2.625rem] rounded-full" />
        <div>
          <Skeleton className="mb-2 h-3 w-[7.5rem]" />
          <Skeleton className="h-2.5 w-[4.375rem]" />
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
    <aside className="flex w-[22.5rem] flex-none flex-col border-r border-ca-800 bg-ca-panel">
      <div className="flex h-[3.75rem] items-center gap-2.5 bg-ca-header px-4">
        <div className="grid h-[2.375rem] w-[2.375rem] place-items-center rounded-full bg-ca-accent"><Icon name="message" size={18} className="text-ca-on-accent" /></div>
        <div className="text-[1.0625rem] font-bold text-ca-50">{t("sidebar.title")}<small className="block text-[0.6875rem] font-medium text-ca-400">{t("sidebar.subtitle")}</small></div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="grid h-[5.75rem] w-[5.75rem] place-items-center rounded-full bg-ca-accent/[.14] text-ca-accent-soft"><Icon name="inbox" size={40} /></div>
        <h3 className="text-[1.0625rem] font-semibold text-ca-50">{t("empty.title")}</h3>
        <p className="max-w-[22.5rem] text-[0.90625rem] leading-[1.6] text-ca-400">{t("empty.body")}</p>
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
        <div className="grid h-[5.75rem] w-[5.75rem] place-items-center rounded-full bg-ca-error/[.15] text-ca-error"><Icon name="zap" size={40} /></div>
        <h3 className="text-[1.375rem] font-semibold text-ca-50">{t("error.title")}</h3>
        <p className="max-w-[22.5rem] text-[0.90625rem] leading-[1.6] text-ca-400">{t("error.body")}</p>
        <Button onClick={onRetry}><Icon name="zap" size={16} /> {t("common.retry")}</Button>
      </div>
    </section>
  );
}
