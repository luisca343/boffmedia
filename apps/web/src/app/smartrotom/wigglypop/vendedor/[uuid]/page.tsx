"use client"

import { useRouter } from "next/navigation"
import { use } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import { fmt, timeAgo } from "../../_utils/format"
import { useListings, useSeller, useToggleWatch, useWatchlist } from "../../_hooks/queries"
import { ListingCard } from "../../_components/ListingCard"
import {
  Avatar,
  Button,
  DividerLabel,
  EmptyState,
  Icon,
  Panel,
  Skeleton,
  Stars,
} from "../../_components/ui"

/**
 * A seller's shopfront.
 *
 * Every number here is DERIVED from real completed orders and real reviews — there
 * is no seeded reputation. A brand-new seller therefore shows "Vendedor nuevo" and
 * no stars, rather than a flattering 4.9 nobody earned (§9). That honesty is the
 * whole point of the page: it is what makes a good rating mean something.
 */
export default function SellerPage({ params }: { params: Promise<{ uuid: string }> }) {
  const t = useTranslations("wigglypop")
  const { uuid } = use(params)
  const router = useRouter()

  const { data, isLoading, error } = useSeller(uuid)
  const { data: listingData } = useListings({ limit: 100 })
  const { data: watched } = useWatchlist()
  const toggleWatch = useToggleWatch()

  const seller = data?.seller
  const reviews = data?.reviews ?? []
  const listings = (listingData?.items ?? []).filter(
    (L) => L.seller.uuid === uuid && L.status === "activo",
  )
  const watchedIds = new Set((watched ?? []).map((l) => l.id))

  if (error)
    return (
      <EmptyState
        icon="alert"
        title={t("vendedor.notFoundTitle")}
        body={userMessageFrom(error, t("common.retryFallback"))}
      />
    )

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none px-[30px] pt-3.5">
        <Button variant="ghost" onClick={() => router.back()}>
          <Icon name="arrowL" size={16} />
          {t("common.back")}
        </Button>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] pb-10 pt-3.5">
        {isLoading || !seller ? (
          <Skeleton className="h-32 rounded-wp-lg" />
        ) : (
          <>
            <Panel className="flex flex-wrap items-center gap-5 rounded-wp-lg p-6">
              <Avatar seller={seller} size={76} />
              <div className="min-w-[200px] flex-1">
                <h1 className="font-wp-display text-[26px] font-semibold text-wp-fg">
                  {seller.username}
                </h1>
                <div className="mt-1.5 flex items-center gap-2">
                  <Stars value={seller.rating} size={15} />
                  {seller.rating === null ? (
                    <span className="font-wp text-[13px] font-semibold text-wp-fg-subtle">
                      {t("vendedor.newSellerNoRatings")}
                    </span>
                  ) : (
                    <>
                      <span className="wp-num font-wp text-wp-fg">{seller.rating.toFixed(2)}</span>
                      <span className="font-wp text-[13px] font-semibold text-wp-fg-subtle">
                        · <span className="wp-num">{fmt(seller.reviews)}</span> {t("vendedor.reviewsSuffix")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Panel>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat k={t("vendedor.statRating")} v={seller.rating === null ? "—" : seller.rating.toFixed(2)} icon="star" />
              <Stat k={t("vendedor.statSales")} v={fmt(seller.sales)} icon="cart" />
              <Stat k={t("vendedor.statReviews")} v={fmt(seller.reviews)} icon="users" />
            </div>

            <DividerLabel className="my-6">
              {t("vendedor.activeListingsCount", { count: listings.length })}
            </DividerLabel>

            {listings.length === 0 ? (
              <EmptyState icon="tag" title={t("vendedor.noActiveListings")} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
                {listings.map((L) => (
                  <ListingCard
                    key={L.id}
                    listing={L}
                    variant="compact"
                    watched={watchedIds.has(L.id)}
                    onWatch={() => toggleWatch.mutate(L.id)}
                    watchBusy={toggleWatch.isPending}
                    onOpen={() => router.push(`/smartrotom/wigglypop/anuncio/${L.id}`)}
                  />
                ))}
              </div>
            )}

            <DividerLabel className="my-6">{t("vendedor.reviewsHeading")}</DividerLabel>

            {reviews.length === 0 ? (
              <EmptyState
                icon="users"
                title={t("vendedor.noReviewsTitle")}
                body={t("vendedor.noReviewsBody")}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {reviews.map((r: any) => (
                  <Panel key={r.id} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-wp text-[13px] font-bold text-wp-fg">
                        {r.reviewer?.username ?? t("common.defaultUsername")}
                      </span>
                      <span className="ml-auto">
                        <Stars value={r.rating} size={12} />
                      </span>
                    </div>
                    {r.body && (
                      <p className="font-wp text-[13px] font-semibold leading-relaxed text-wp-fg-muted">
                        {r.body}
                      </p>
                    )}
                    <div className="mt-2 font-wp text-[11px] font-semibold text-wp-fg-subtle">
                      {timeAgo(r.createdAt)}
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ k, v, icon }: { k: string; v: string; icon: "star" | "cart" | "users" }) {
  return (
    <Panel className="px-4 py-3.5">
      <div className="flex items-center gap-[7px] font-wp text-[11.5px] font-bold uppercase tracking-[.05em] text-wp-fg-subtle">
        <Icon name={icon} size={14} />
        {k}
      </div>
      <div className="wp-num mt-1 font-wp-display text-[22px] font-semibold text-wp-fg">{v}</div>
    </Panel>
  )
}
