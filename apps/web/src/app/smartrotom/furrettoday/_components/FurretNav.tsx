"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useNewsroom } from "../_hooks/queries";
import { categoriesOf } from "../_utils/article";
import { Button, Chip, FurretMascot, Input } from "./ui";

const BASE = "/smartrotom/furrettoday";

const SECTIONS = [
  { href: BASE, label: "Portada" },
  { href: `${BASE}/secciones`, label: "Secciones" },
  { href: `${BASE}/secciones#archivo`, label: "Archivo" },
  { href: `${BASE}/editar`, label: "Editar" },
];

/**
 * The masthead. The category rail underneath is DERIVED from the categories
 * actually in use (the API has no sections table), so an empty section never
 * appears; picking one deep-links into the browse screen.
 */
export function FurretNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { articles } = useNewsroom();

  const categories = categoriesOf(articles.filter((a) => a.published));

  function search() {
    const q = query.trim();
    router.push(q ? `${BASE}/secciones?q=${encodeURIComponent(q)}` : `${BASE}/secciones`);
  }

  return (
    <header className="border-ft sticky top-0 z-40 border-x-0 border-t-0 border-b-ft-ink bg-ft-paper">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3.5">
        <Link
          href={BASE}
          className="font-ft-display flex shrink-0 items-center gap-2.5 whitespace-nowrap"
          aria-label="Portada de Furret Today"
        >
          <FurretMascot size={48} />
          <span className="text-3xl leading-[0.9] tracking-[0.04em]">
            FURRET<span className="text-ft-pink">·</span>TODAY
          </span>
        </Link>

        <nav
          className="ml-auto flex flex-wrap items-center gap-1"
          aria-label="Secciones"
        >
          {SECTIONS.map((item) => {
            // The hash variant ("Archivo") points at the browse screen too, so
            // compare on the path only.
            const path = item.href.split("#")[0];
            const active =
              path === BASE ? pathname === BASE : pathname.startsWith(path);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "font-ft-ui rounded-ft-pill px-3.5 py-2.5",
                  "text-[11px] font-extrabold uppercase tracking-[0.18em]",
                  active
                    ? "bg-ft-ink text-ft-yellow"
                    : "text-ft-ink hover:bg-ft-ink/5",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="ml-2 flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search();
              }}
              placeholder="Buscar en el número…"
              aria-label="Buscar artículos"
              className="w-[220px]"
            />
            <Button variant="primary" size="sm" onClick={search}>
              Buscar
            </Button>
          </div>
        </nav>
      </div>

      {categories.length > 0 ? (
        <div className="border-t-ft-hair border-dashed border-ft-ink bg-ft-paper-2">
          <div className="ft-scroll mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-6 py-3">
            {categories.map((c) => (
              <Chip
                key={c.id}
                onClick={() =>
                  router.push(
                    `${BASE}/secciones?cat=${encodeURIComponent(c.label)}`,
                  )
                }
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
