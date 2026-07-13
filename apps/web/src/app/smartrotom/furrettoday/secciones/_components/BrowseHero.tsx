"use client";

import { Button, Chip, Eyebrow, Input } from "../../_components/ui";
import { FT_INK } from "../../_utils/accents";
import type { FtCategory } from "../../_utils/article";

/**
 * The pink masthead of the browse screen: search + the section rail. Both
 * write straight into the parent's URL-synced state, so a chip click and a
 * keystroke here behave exactly like landing on `?q=`/`?cat=` directly.
 */
export function BrowseHero({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
  totalCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  categories: FtCategory[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  totalCount: number;
}) {
  return (
    <section className="border-ft relative overflow-hidden border-x-0 border-t-0 border-b-ft-ink bg-ft-pink text-white">
      <div
        className="ft-halftone-light absolute inset-0 opacity-20"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-14">
        <Eyebrow className="text-ft-yellow">SECCIONES &amp; ARCHIVO</Eyebrow>
        <h1
          className="font-ft-display mt-2 mb-3 text-[clamp(56px,9vw,128px)] leading-[0.9]"
          style={{ textShadow: `6px 6px 0 ${FT_INK}` }}
        >
          Explora{" "}
          <span className="inline-block -rotate-3">el</span> Número
        </h1>
        <p className="font-ft-deck max-w-[720px] text-[22px] italic text-[#fffbe8]">
          Cinco secciones, decenas de artículos y un buscador que funciona.
          Para los que coleccionan.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-6 flex max-w-[720px] gap-2.5"
        >
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="¿Qué buscas? — escribe «furret», «meta», «torneo»…"
            aria-label="Buscar"
            className="flex-1 py-4 text-lg"
          />
          <Button type="submit" variant="ink" size="lg">
            Buscar
          </Button>
        </form>

        <div className="ft-scroll mt-6 flex gap-2 overflow-x-auto pb-1.5">
          <Chip
            active={activeCategory === "all"}
            onClick={() => onCategoryChange("all")}
          >
            Todo · {totalCount}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={activeCategory.toLowerCase() === c.label.toLowerCase()}
              onClick={() => onCategoryChange(c.label)}
            >
              {c.label} · {c.count}
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}
