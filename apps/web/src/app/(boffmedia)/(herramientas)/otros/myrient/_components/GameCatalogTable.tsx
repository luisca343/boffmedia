"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, SearchInput } from "@/components/boffmedia/primitives";
import { GameFileEntry } from "@/services/api/boffmedia/scrapeService";
import { MyFileRow } from "./ui/my-kit";

const PAGE_SIZE = 50;

interface GameCatalogTableProps {
  files: GameFileEntry[];
  selected: Set<string>;
  downloadedSet: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: (names: string[]) => void;
  onClearAll: () => void;
  initialSearch?: string;
}

/** Derives the local filename from a catalog entry the same way the backend does. */
function localFilename(file: GameFileEntry): string {
  return decodeURIComponent(file.link.split("/").pop() ?? file.name);
}

export default function GameCatalogTable({
  files, selected, downloadedSet, onToggle, onSelectAll, onClearAll, initialSearch = "",
}: GameCatalogTableProps) {
  const t = useTranslations("otros.myrientApp");
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const [hideDownloaded, setHideDownloaded] = useState(false);

  const downloadedCount = useMemo(
    () => files.filter((f) => downloadedSet.has(localFilename(f))).length,
    [files, downloadedSet],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return files.filter((f) => {
      if (hideDownloaded && downloadedSet.has(localFilename(f))) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, search, hideDownloaded, downloadedSet]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageNames = paginated.map((f) => f.name);
  const allPageSelected = pageNames.length > 0 && pageNames.every((n) => selected.has(n));

  const handleSearchChange = (value: string) => { setSearch(value); setPage(0); };
  const toggleHideDownloaded = () => { setHideDownloaded((v) => !v); setPage(0); };

  const togglePage = () => {
    if (allPageSelected) {
      const next = new Set(selected);
      pageNames.forEach((n) => next.delete(n));
      onSelectAll([...next]);
    } else {
      onSelectAll([...selected, ...pageNames]);
    }
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.name));

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredNames = new Set(filtered.map((f) => f.name));
      onSelectAll([...selected].filter((n) => !filteredNames.has(n)));
    } else {
      onSelectAll([...selected, ...filtered.map((f) => f.name)]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search + bulk controls */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 self-stretch">
          <SearchInput value={search} onChange={handleSearchChange} placeholder={t("filterGames")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {downloadedCount > 0 && (
            <Button size="sm" variant={hideDownloaded ? "pri" : "default"} icon="eye" onClick={toggleHideDownloaded}>
              {hideDownloaded ? t("showingNotDownloaded") : t("hideDownloaded", { n: downloadedCount })}
            </Button>
          )}
          {filtered.length > 0 && (
            <Button size="sm" variant={allFilteredSelected ? "pri" : "default"} icon="check" onClick={handleSelectAllFiltered}>
              {allFilteredSelected ? t("deselectAllN", { n: filtered.length }) : t("selectAllN", { n: filtered.length })}
            </Button>
          )}
          {selected.size > 0 && (
            <Button size="sm" variant="ghost" icon="x" onClick={onClearAll}>{t("clearN", { n: selected.size })}</Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-txt-muted">
        <span>{t("gamesFoundN", { n: filtered.length })}</span>
        {downloadedCount > 0 && (
          <span className="flex items-center gap-1 text-ok">
            <Icon name="database" size={13} />{t("alreadyDownloadedN", { n: downloadedCount })}
          </span>
        )}
        {selected.size > 0 && (
          <span className="inline-flex items-center border border-accent-line bg-accent-soft px-[8px] py-[3px] text-accent">
            {t("selectedN", { n: selected.size })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-line bg-panel">
        <div className="flex items-center gap-3 border-b border-line bg-panel-2 px-[14px] py-2">
          <button
            type="button"
            onClick={togglePage}
            aria-label={t("selectPage")}
            className={
              "grid h-[15px] w-[15px] flex-none place-items-center border transition-colors " +
              (allPageSelected ? "border-accent bg-accent text-accent-ink" : "border-line-2 bg-base-2 text-transparent hover:border-line-2")
            }
          >
            <Icon name="check" size={11} />
          </button>
          <span className="flex-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-txt-muted">{t("colName")}</span>
          <span className="w-24 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-txt-muted">{t("colSize")}</span>
        </div>

        {paginated.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-txt-muted">
            {hideDownloaded && downloadedCount === files.length ? t("allDownloaded") : t("noGamesTerm")}
          </div>
        ) : (
          paginated.map((file) => (
            <MyFileRow
              key={file.name}
              name={file.name}
              size={file.size}
              selected={selected.has(file.name)}
              downloaded={downloadedSet.has(localFilename(file))}
              downloadedLabel={t("alreadyDownloaded")}
              onToggle={() => onToggle(file.name)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-txt-muted">
          <span>{t("pageOf", { page: page + 1, total: totalPages })}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" icon="chevron" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label={t("prevPage")} />
            <Button size="sm" variant="ghost" icon="chevronRight" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label={t("nextPage")} />
          </div>
        </div>
      )}
    </div>
  );
}
