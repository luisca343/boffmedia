"use client";

import { useState } from "react";
import { Icon } from "@boffmedia/ui";
import { cn } from "@boffmedia/ui/cn";
import {
  DkCopy,
  DkEmpty,
  DkSkel,
  DkSprite,
  DkTeam,
} from "@boffmedia/ui/datakit";
import { useVgcT } from "../../i18n";
import { spriteUrl, handleSpriteError } from "../../tracker-core/types";
import {
  fmtCount,
  type OverviewCore,
  type OverviewTeam,
  type PokeData,
  type UsageEntry,
} from "../_lib/meta-types";
import { MvCard } from "./MvBits";
import { MvTeamGrid } from "./MvTeams";

interface MvOverviewProps {
  entries: UsageEntry[];
  pokeMap: Record<string, PokeData>;
  onSelect: (id: string) => void;
  cores: OverviewCore[];
  recentTeams: OverviewTeam[];
  totalTeams: number;
  loading?: boolean;
  overviewLoading?: boolean;
  overviewError?: string | null;
}

export function MvOverview({
  entries,
  pokeMap,
  onSelect,
  cores,
  recentTeams,
  totalTeams,
  loading,
  overviewLoading,
  overviewError,
}: MvOverviewProps) {
  const t = useVgcT("meta");
  const topTwenty = entries.slice(0, 20);

  return (
    <section className="min-w-0" aria-label={t("overview.title")}>
      <div className="px-[var(--dk-pad)] pb-12 pt-[1.125rem]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-solid border-line pb-4">
          <div>
            <p className="mb-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em] text-accent">
              {t("overview.kicker")}
            </p>
            <h2 className="m-0 font-display text-[2rem] font-extrabold uppercase italic leading-none tracking-[0.01em] max-[720px]:text-[1.625rem]">
              {t("overview.title")}
            </h2>
            <p className="mb-0 mt-2 max-w-[46rem] font-body text-[0.8125rem] leading-[1.5] text-txt-muted">
              {t("overview.lead")}
            </p>
          </div>
          <span className="border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-txt-dim">
            {totalTeams > 0
              ? t("overview.teamCount", { count: fmtCount(totalTeams) })
              : t("overview.noTournamentData")}
          </span>
        </header>

        <MvCard
          title={t("overview.topPokemon")}
          aside={t("overview.topN", { n: 20 })}
        >
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <DkSkel key={i} h={92} />
              ))}
            </div>
          ) : topTwenty.length === 0 ? (
            <DkEmpty icon="database" title={t("table.empty")} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
              {topTwenty.map((entry, index) => {
                const pokemon = pokeMap[entry.id];
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelect(entry.id)}
                    className="group flex min-w-0 items-center gap-3 border border-solid border-line bg-base px-3 py-[0.625rem] text-left transition-[background,border-color] hover:border-line-2 hover:bg-panel focus-visible:outline-2 focus-visible:outline-accent-line"
                  >
                    <span className="w-6 flex-none text-right font-mono text-[0.625rem] font-bold text-accent-bright">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <DkSprite
                      src={spriteUrl(pokemon?.name ?? entry.id)}
                      alt={pokemon?.name ?? entry.id}
                      size={48}
                      onError={handleSpriteError}
                    />
                    <span className="grid min-w-0 flex-1 gap-1">
                      <b className="truncate font-display text-[0.75rem] font-bold uppercase leading-[1.1] tracking-[0.025em] group-hover:text-accent-bright">
                        {pokemon?.name ?? entry.id}
                      </b>
                      <span className="font-mono text-[0.625rem] font-semibold leading-none text-txt-muted">
                        {entry.usage.toFixed(1)}%
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </MvCard>

        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] items-start gap-3">
          {[2, 3, 4].map((size) => (
            <CoreCard
              key={size}
              size={size}
              cores={cores.filter((core) => core.size === size)}
              pokeMap={pokeMap}
              onSelect={onSelect}
              loading={overviewLoading}
              error={overviewError}
              totalTeams={totalTeams}
            />
          ))}
        </div>

        <MvCard
          title={t("overview.recentTeams")}
          aside={t("overview.recentTeamsAside")}
          wide
        >
          {overviewLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <DkSkel key={i} h={58} />
              ))}
            </div>
          ) : overviewError ? (
            <DkEmpty icon="alert" title={t("table.error")} />
          ) : recentTeams.length === 0 ? (
            <DkEmpty icon="database" title={t("overview.noTeams")} />
          ) : (
            <div className="grid gap-2">
              {recentTeams.map((team) => (
                <OverviewTeamRow key={team.slug} team={team} />
              ))}
            </div>
          )}
        </MvCard>
      </div>
    </section>
  );
}

function CoreCard({
  size,
  cores,
  pokeMap,
  onSelect,
  loading,
  error,
  totalTeams,
}: {
  size: number;
  cores: OverviewCore[];
  pokeMap: Record<string, PokeData>;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  totalTeams: number;
}) {
  const t = useVgcT("meta");

  return (
    <MvCard title={t(`overview.cores${size}`)} aside={t("overview.coreAside")}>
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <DkSkel key={i} h={58} />
          ))}
        </div>
      ) : error ? (
        <DkEmpty icon="alert" title={t("table.error")} />
      ) : cores.length === 0 ? (
        <DkEmpty icon="database" title={t("overview.noCores")} />
      ) : (
        <div className="grid gap-2">
          {cores.map((core, index) => (
            <div
              key={core.pokemon.map((pokemon) => pokemon.speciesId).join("-")}
              className="border border-solid border-line bg-base px-2 py-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[0.625rem] font-bold text-accent-bright">
                  #{index + 1}
                </span>
                <span className="font-mono text-[0.59375rem] font-semibold text-txt-muted">
                  {core.usagePercent.toFixed(1)}% · {fmtCount(core.teamCount)}{" "}
                  {t("overview.teams")}
                </span>
              </div>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-[0.75rem] text-left hover:text-accent-bright"
                onClick={() => onCoreClick(core, onSelect, pokeMap)}
              >
                <DkTeam
                  className="flex-none"
                  size={32}
                  slots={core.pokemon.map((pokemon) => ({
                    name:
                      pokeMap[pokemon.speciesId]?.name ?? pokemon.speciesName,
                    src: spriteUrl(
                      pokeMap[pokemon.speciesId]?.name ?? pokemon.speciesName,
                    ),
                    onError: handleSpriteError,
                  }))}
                />
                <span className="min-w-0 truncate font-display text-[0.6875rem] font-bold uppercase tracking-[0.025em]">
                  {core.pokemon
                    .map(
                      (pokemon) =>
                        pokeMap[pokemon.speciesId]?.name ?? pokemon.speciesName,
                    )
                    .join(" / ")}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
      {totalTeams === 0 && !loading && !error && (
        <p className="mb-0 mt-2 font-mono text-[0.59375rem] leading-[1.4] text-txt-dim">
          {t("overview.coresNeedTeams")}
        </p>
      )}
    </MvCard>
  );
}

function onCoreClick(
  core: OverviewCore,
  onSelect: (id: string) => void,
  pokeMap: Record<string, PokeData>,
) {
  const first = core.pokemon.find((pokemon) => pokeMap[pokemon.speciesId]);
  if (first) onSelect(first.speciesId);
}

function OverviewTeamRow({ team }: { team: OverviewTeam }) {
  const t = useVgcT("meta");
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "border border-solid bg-base",
        open ? "border-line-2" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-0 bg-transparent px-3 py-[0.5625rem] text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent-line"
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <b className="font-display text-[0.75rem] font-bold uppercase leading-none tracking-[0.05em]">
            {team.name}
          </b>
          {team.placing > 0 && (
            <span className="font-mono text-[0.625rem] font-semibold text-accent-bright">
              #{team.placing}
            </span>
          )}
          {team.record && (
            <span className="bg-ok-soft px-[0.375rem] py-[3px] font-mono text-[0.625rem] font-semibold leading-none text-ok">
              {team.record}
            </span>
          )}
          {team.tournamentName && (
            <span className="basis-full truncate font-mono text-[0.59375rem] leading-none text-txt-dim">
              {team.tournamentName}
            </span>
          )}
        </span>
        <DkTeam
          className="flex-none"
          size={32}
          slots={team.team
            .slice(0, 6)
            .map((slot) => ({
              name: slot.name,
              src: spriteUrl(slot.name),
              onError: handleSpriteError,
            }))}
        />
        <Icon
          name="chevron"
          size={14}
          className="flex-none text-txt-dim transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="border-t border-solid border-line p-3">
          <MvTeamGrid team={team.team} />
          {team.rawText && (
            <div className="mt-[0.625rem] flex justify-end">
              <DkCopy
                text={team.rawText}
                label={t("detail.copyPaste")}
                copiedLabel={t("detail.copied")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
