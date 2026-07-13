"use client"

import { useRouter } from "next/navigation"
import { userMessageFrom } from "@/services/boffAPI"
import { FORMAT_ICON, FORMAT_LABEL, fmt } from "../_utils/format"
import { useToggleWatch, useWatchlist } from "../_hooks/queries"
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  IVMeter,
  Price,
  Skeleton,
  Sprite,
  SpriteStage,
  Table,
  TD,
  TH,
  TR,
} from "../_components/ui"

/**
 * Seguimiento. A table, not a grid — a watchlist is for *comparing* prices, and a
 * grid of cards is the wrong tool for that. The valuation column is the point: it is
 * what lets you see at a glance which of the things you are watching is actually
 * underpriced, rather than merely cheap.
 */
export default function WatchlistPage() {
  const router = useRouter()
  const { data: listings, isLoading, error } = useWatchlist()
  const toggleWatch = useToggleWatch()

  const rows = listings ?? []

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none border-b border-wp-line/24 px-[30px] py-[18px]">
        <h1 className="flex items-center gap-2.5 font-wp-display text-[21px] font-semibold text-wp-fg">
          <Icon name="bookmark" size={20} className="text-wp-gold" />
          Seguimiento
        </h1>
        <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
          <span className="wp-num">{rows.length}</span> anuncios guardados
        </p>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] pb-10 pt-[18px]">
        {error ? (
          <EmptyState icon="alert" title="No se pudo cargar tu seguimiento" body={userMessageFrom(error, "Inténtalo de nuevo en unos segundos.")} />
        ) : isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-wp-sm" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="Aún no sigues ningún anuncio"
            body="Pulsa el marcador en cualquier anuncio para guardarlo aquí."
          >
            <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop")}>
              Explorar mercado
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>Pokémon</TH>
                <TH>Formato</TH>
                <TH>Vendedor</TH>
                <TH>Valoración</TH>
                <TH className="text-right">Precio</TH>
                <TH />
              </tr>
            </thead>
            <tbody>
              {rows.map((L) => {
                const mon = L.mons[0]
                const price = L.format === "auction" ? (L.currentBid ?? L.price) : L.price
                const under = price < L.value
                return (
                  <TR
                    key={L.id}
                    onClick={() => router.push(`/smartrotom/wigglypop/anuncio/${L.id}`)}
                  >
                    <TD>
                      <div className="flex items-center gap-2.5">
                        {mon && (
                          <SpriteStage
                            mon={mon}
                            dots={false}
                            className="h-9 w-9 flex-none rounded-[9px]"
                          >
                            <Sprite mon={mon} className="relative z-[2] h-[80%] w-[80%]" />
                          </SpriteStage>
                        )}
                        <div>
                          <div className="font-bold text-wp-fg">
                            {mon?.shiny && <span className="text-wp-teal">✦ </span>}
                            {L.title}
                          </div>
                          {mon && (
                            <div className="flex items-center gap-1.5 font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                              <span className="wp-num">
                                Lv.{mon.level} · IV {mon.ivPct}%
                              </span>
                              <IVMeter ivs={mon.ivs} />
                            </div>
                          )}
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Chip className="text-[11px]">
                        <Icon name={FORMAT_ICON[L.format]} size={12} />
                        {FORMAT_LABEL[L.format]}
                      </Chip>
                    </TD>
                    <TD className="text-wp-fg-muted">{L.seller.username}</TD>
                    <TD>
                      <span className="wp-num text-wp-teal">₽{fmt(L.value)}</span>
                    </TD>
                    <TD className="text-right">
                      <Price amount={price} size={14} />
                      {under && (
                        <div className="font-wp text-[10.5px] font-bold text-wp-green">
                          −{Math.round((1 - price / L.value) * 100)}% vs valoración
                        </div>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        iconOnly
                        aria-label="Quitar de seguimiento"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWatch.mutate(L.id)
                        }}
                      >
                        <Icon name="x" size={15} />
                      </Button>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  )
}
