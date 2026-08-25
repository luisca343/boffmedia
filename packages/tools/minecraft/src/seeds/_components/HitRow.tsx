"use client";

/**
 * HitRow — one seed that passed, and how to go and check it.
 *
 * The checklist is the point of this component, not a convenience on the side
 * of it. Nothing this tool reports has ever been validated against a real
 * Minecraft world, and a ranked list of seeds with scores is the most
 * authoritative-looking thing the tool can produce — a machine saying "this one
 * is a 0.91". The honest response is to make the claim cheap to falsify: every
 * location it resolved, with a `/tp` to stand on it and the measurement that is
 * supposed to be true there. A user can disprove a hit in a couple of minutes,
 * which is the only validation the tool currently has.
 *
 * Collapsed by default because a hit list is for comparing seeds, and comparing
 * is what a wall of expanded detail prevents.
 */

import { useState } from "react";
import { Button, Icon } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import { teleportCommand } from "../_lib/urlState";
import type { SpecEvalResult } from "../_lib/worker/seeds-api";

export interface HitRowProps {
  hit: SpecEvalResult;
  /** True when this seed is the one currently on the map. */
  current: boolean;
  onPick: () => void;
  onFocusSite: (x: number, z: number) => void;
  t: Translate;
}

export function HitRow({ hit, current, onPick, onFocusSite, t }: HitRowProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const locations = Object.entries(hit.locations);

  /**
   * Optional sites that did not land, kept apart from the rest.
   *
   * A location that fails still reports coordinates — the best-scoring
   * candidate it tried, which is under no obligation to match anything. For a
   * hard location that never shows, because the seed would not be a hit. For
   * an optional one it shows constantly, and printing it like the others would
   * turn "no forest anywhere in the northern half" into a /tp command that
   * looks exactly as trustworthy as a real find.
   */
  const optional = locations.filter(([, loc]) => !loc.hard);
  const placed = optional.filter(([, loc]) => loc.pass).length;

  const copyChecklist = async () => {
    // One command per line, each with what it is for. Pasted into a chat or a
    // notes file it stays legible; pasted into the game one line at a time it
    // still works, because a leading `//` is not something the game sees.
    // Sites that did not land are still listed — they are where the search got
    // closest, and placing them by hand is the point — but they are labelled,
    // never mixed in as if they had been found.
    const text = locations
      .map(([name, loc]) =>
        `${teleportCommand(loc.x, loc.z)}   # ${name}${loc.pass ? "" : ` ${t("search.notPlacedTag")}`}`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be denied outright; saying nothing is better than
      // an error about a convenience.
    }
  };

  return (
    <div className={`border bg-base ${current ? "border-accent" : "border-line-2"}`}>
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="grid h-5 w-5 shrink-0 place-items-center text-txt-dim transition-colors hover:text-txt"
        >
          <Icon name={open ? "chevronDown" : "chevronRight"} size={13} />
        </button>

        <button
          type="button"
          onClick={onPick}
          className="min-w-0 flex-1 truncate text-left font-mono text-[12px] text-txt transition-colors hover:text-accent"
          title={t("search.showSeed")}
        >
          {hit.seed}
        </button>

        {/* How much of the spec actually landed, next to the score that says
            so numerically — the count is what decides whether a seed is worth
            opening, and "13/18" answers that faster than "0.82". */}
        {optional.length ? (
          <span className="shrink-0 font-mono text-[10px] text-txt-dim">
            {placed}/{optional.length}
          </span>
        ) : null}

        <span className="shrink-0 font-mono text-[11px] font-bold text-accent">
          {hit.score.toFixed(2)}
        </span>
      </div>

      {open ? (
        <div className="grid gap-2 border-t border-line-2 p-2">
          <p className="text-[10px] leading-snug text-txt-dim">{t("search.checklistLead")}</p>

          {optional.length ? (
            <p className="text-[10px] leading-snug text-txt-dim">
              {t("search.optionalSummary", { placed, total: optional.length })}
            </p>
          ) : null}

          {locations.map(([name, loc]) => (
            <div
              key={name}
              className={`grid gap-1 border bg-panel p-2 ${
                loc.pass ? "border-line-2" : "border-dashed border-line"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`min-w-0 flex-1 truncate font-mono text-[11px] ${
                    loc.pass ? "text-txt" : "text-txt-dim"
                  }`}
                >
                  {name}
                </span>
                {!loc.pass ? (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-txt-muted">
                    {t("search.notPlaced")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onPick();
                    onFocusSite(loc.x, loc.z);
                  }}
                  className="shrink-0 font-mono text-[10px] text-txt-dim transition-colors hover:text-accent"
                >
                  {t("spec.action.showOnMap")}
                </button>
              </div>
              <code className="block overflow-x-auto whitespace-nowrap font-mono text-[10px] text-txt-muted">
                {teleportCommand(loc.x, loc.z)}
              </code>
              {/* Said before the constraints, because it changes what they
                  mean: for a site that landed they are what should be true
                  when you arrive, and for one that did not they are why it
                  was rejected — at the closest the search could get. */}
              {!loc.pass ? (
                <p className="text-[10px] leading-snug text-txt-muted">{t("search.notPlacedLead")}</p>
              ) : null}
              <ul className="grid list-none gap-0.5 p-0">
                {loc.constraints.map((c, i) => (
                  <li
                    key={`${c.type}-${i}`}
                    className={`font-mono text-[10px] leading-snug ${
                      c.pass ? "text-txt-dim" : "text-txt-muted"
                    }`}
                  >
                    {c.pass ? "" : "× "}
                    {c.detail ?? c.type}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={copyChecklist}>
              {copied ? t("map.copied") : t("search.copyChecklist")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onPick} disabled={current}>
              {current ? t("search.onMap") : t("search.showSeed")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
