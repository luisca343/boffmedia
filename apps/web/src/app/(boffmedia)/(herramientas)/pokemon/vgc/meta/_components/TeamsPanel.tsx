"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Copy, Check, Loader2 } from "lucide-react";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { SpeciesTeamEntry, SpeciesTeamSlot } from "@/services/api/boffmedia/vgcService";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { ToolSectionHeader } from "@/components/boffmedia/tools/ToolSectionHeader";

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("vgc.meta");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-surface-300 hover:text-surface-100 border border-surface-600 hover:border-surface-500 bg-surface-800 hover:bg-surface-700 transition-all"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? t("detail.copied") : t("detail.copyPaste")}
    </button>
  );
}

// ─── Tera type colour map ─────────────────────────────────────────────────────

const TERA_COLOURS: Record<string, string> = {
  Normal:   "#A8A878", Fire:     "#F08030", Water:    "#6890F0",
  Electric: "#F8D030", Grass:    "#78C850", Ice:      "#98D8D8",
  Fighting: "#C03028", Poison:   "#A040A0", Ground:   "#E0C068",
  Flying:   "#A890F0", Psychic:  "#F85888", Bug:      "#A8B820",
  Rock:     "#B8A038", Ghost:    "#705898", Dragon:   "#7038F8",
  Dark:     "#705848", Steel:    "#B8B8D0", Fairy:    "#EE99AC",
};

// ─── Slot detail row ──────────────────────────────────────────────────────────

function SlotDetail({ slot }: { slot: SpeciesTeamSlot }) {
  return (
    <div className="flex gap-2 items-start min-w-0">
      { }
      <img
        src={spriteUrl(slot.speciesName)}
        alt={slot.speciesName}
        width={48}
        height={48}
        className="object-contain shrink-0"
        onError={handleSpriteError}
      />
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-semibold text-surface-100 leading-tight">
          {slot.speciesName}
          {slot.tera && (
            <span
              className="ml-1.5 text-[10px] font-normal px-1 rounded bg-surface-900"
              style={{ color: TERA_COLOURS[slot.tera] ?? "#fff" }}
            >
              Tera {slot.tera}
            </span>
          )}
        </p>
        {slot.item && (
          <p className="text-[11px] text-surface-400 leading-tight">{slot.item}</p>
        )}
        {slot.moves.filter(Boolean).length > 0 && (
          <ul className="mt-0.5 space-y-px">
            {slot.moves.filter(Boolean).map((move, i) => (
              <li key={i} className="text-[11px] text-surface-300 leading-tight">
                — {move}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Replica code badge ───────────────────────────────────────────────────────

function ReplicaCodeBadge({ code }: { code: string }) {
  const t = useTranslations("vgc.meta");
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-surface-500">{t("detail.rentalCode")}</span>
      <code className="text-[11px] font-mono tracking-widest text-surface-100 bg-surface-700 border border-surface-600 px-1.5 py-0.5 rounded">
        {code}
      </code>
    </div>
  );
}

// ─── Team row ─────────────────────────────────────────────────────────────────

function TeamRow({ entry }: { entry: SpeciesTeamEntry }) {
  const [expanded, setExpanded] = useState(false);

  const placing = entry.rank   ? `#${entry.rank}`  : null;
  const record  = entry.record ?? null;

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-700/40 transition-colors text-left"
      >
        {/* Player info */}
        <div className="min-w-0 w-28 shrink-0">
          <p className="text-xs font-medium text-surface-100 truncate leading-tight">
            {entry.playerName ?? entry.playerId}
          </p>
          {(placing || record) && (
            <p className="text-[11px] text-surface-400 leading-tight">
              {placing}{placing && record && " · "}{record}
            </p>
          )}
          <p className="text-[10px] text-surface-600 leading-tight capitalize">
            {entry.source}
          </p>
        </div>

        {/* 6 sprites */}
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          {entry.slots.map((slot, i) => (
             
            <img
              key={i}
              src={spriteUrl(slot.speciesName)}
              alt={slot.speciesName}
              width={32}
              height={32}
              className="object-contain shrink-0"
              onError={handleSpriteError}
            />
          ))}
        </div>

        {/* Expand chevron */}
        <span className="shrink-0 text-surface-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-surface-700 bg-surface-900/80 px-3 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {entry.slots.map((slot, i) => (
              <SlotDetail key={i} slot={slot} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            {entry.replicaCode ? (
              <ReplicaCodeBadge code={entry.replicaCode} />
            ) : (
              <span />
            )}
            <CopyButton text={entry.rawText} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  teams:   SpeciesTeamEntry[];
  loading: boolean;
  title?:  string;
}

export function TeamsPanel({ teams, loading, title = "Teams" }: Props) {
  const t = useTranslations("vgc.meta");

  if (loading) {
    return (
      <Card className="hover:shadow-sm">
        <CardContent className="p-4">
          <ToolSectionHeader label={title} color="neutral" compact />
          <div className="flex items-center justify-center gap-2 py-4 text-surface-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("detail.teamsLoading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) return null;

  return (
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <ToolSectionHeader
          label={`${title} (${teams.length})`}
          color="neutral"
          compact
        />
        <div className="space-y-1.5">
          {teams.map((entry, i) => (
            <TeamRow key={`${entry.source}-${entry.playerId}-${i}`} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
