"use client";

import type { FtArticle } from "../../_utils/article";
import { Button, CardFlat, Chip, FurretMascot, Input, Meta } from "../../_components/ui";
import { NewsRow } from "./NewsRow";

export type StatusFilter = "all" | "featured" | "published" | "draft";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "featured", label: "Destacada" },
  { id: "published", label: "Publicadas" },
  { id: "draft", label: "Borradores" },
];

/** The sticky list rail. `articles` is already filtered/sorted by the caller. */
export function NewsSidebar({
  total,
  articles,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedId,
  onSelect,
  onNew,
  onTogglePublished,
  onToggleFeatured,
  onRequestDelete,
}: {
  total: number;
  articles: FtArticle[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onTogglePublished: (article: FtArticle) => void;
  onToggleFeatured: (article: FtArticle) => void;
  onRequestDelete: (id: number) => void;
}) {
  return (
    <CardFlat className="sticky top-[110px] flex max-h-[calc(100vh-140px)] flex-col overflow-hidden">
      <div className="border-ft border-x-0 border-t-0 border-b-ft-ink bg-ft-pink p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-ft-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-ft-yellow">
            LISTA DE NOTICIAS
          </span>
          <Meta className="text-white/85">
            {articles.length}/{total}
          </Meta>
        </div>
        <Button variant="ink" size="lg" className="w-full justify-center" onClick={onNew}>
          + Nueva noticia
        </Button>
      </div>

      <div className="border-t-ft-hair border-dashed border-ft-ink p-3.5">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título o entradilla…"
          aria-label="Buscar noticias"
          className="w-full"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              active={statusFilter === f.id}
              onClick={() => onStatusFilterChange(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="ft-scroll flex-grow overflow-y-auto">
        {articles.length === 0 ? (
          <div className="p-6 text-center">
            <FurretMascot size={80} className="mx-auto" />
            <div className="font-ft-display mt-1.5 text-xl">NADA POR AQUÍ</div>
            <p className="text-sm">Prueba a cambiar el filtro o la búsqueda.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 p-2">
            {articles.map((a) => (
              <NewsRow
                key={a.id}
                article={a}
                active={a.id === selectedId}
                onSelect={() => onSelect(a.id)}
                onTogglePublished={() => onTogglePublished(a)}
                onToggleFeatured={() => onToggleFeatured(a)}
                onRequestDelete={() => onRequestDelete(a.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </CardFlat>
  );
}
