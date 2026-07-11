"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/boffmedia/primitives"
import { DkSprite } from "@/components/boffmedia/ui/tools/datakit";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { SpeedTierEntry } from "@/services/api/boffmedia/vgcService";
import { applyMods, compareSpeed, DEFAULT_MODIFIERS, Modifiers } from "../../speedCalc";
import { SpdPanel, SpdInput, SpdMonSearch, SpdModifiers } from "./SpdKit";

interface TeamMember {
  id: string;
  name: string;
  speed: string;
  mods: Modifiers;
}

interface OpponentState {
  name: string;
  speed: string;
  pokemon: SpeedTierEntry | null;
  mods: Modifiers;
}

interface Props {
  speedTiers: SpeedTierEntry[];
  loading: boolean;
  prefillEntry: SpeedTierEntry | null;
  onPrefillConsumed: () => void;
}

function newMember(): TeamMember {
  return { id: crypto.randomUUID(), name: "", speed: "", mods: DEFAULT_MODIFIERS };
}

function calcEffective(speed: string, mods: Modifiers): number | null {
  const v = parseInt(speed, 10);
  if (isNaN(v) || v <= 0) return null;
  return applyMods(v, mods, true);
}

function ResultBadge({ mySpeed, opponentSpeed, t }: { mySpeed: number; opponentSpeed: number; t: ReturnType<typeof useTranslations> }) {
  const result = compareSpeed(mySpeed, opponentSpeed);
  const diff = mySpeed - opponentSpeed;
  const style =
    result === "faster"
      ? "border-ok/40 bg-ok/15 text-ok"
      : result === "slower"
        ? "border-bad/40 bg-bad/15 text-bad"
        : "border-warn/40 bg-warn/15 text-warn";
  const label = result === "faster" ? `▲ ${t("faster")} +${diff}` : result === "slower" ? `▼ ${t("slower")} ${diff}` : `= ${t("tie")}`;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap border border-solid px-2.5 py-1 font-mono text-[11px] font-bold", style)}>{label}</span>
  );
}

export function SpeedMatchupTab({ speedTiers, loading, prefillEntry, onPrefillConsumed }: Props) {
  const t = useTranslations("vgc.speedComparison");

  const [opponent, setOpponent] = useState<OpponentState>({ name: "", speed: "", pokemon: null, mods: DEFAULT_MODIFIERS });
  const [team, setTeam] = useState<TeamMember[]>([newMember(), newMember(), newMember()]);

  useEffect(() => {
    if (prefillEntry) {
      setOpponent({ name: prefillEntry.name, speed: String(prefillEntry.speedTiers.max), pokemon: prefillEntry, mods: DEFAULT_MODIFIERS });
      onPrefillConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEntry]);

  const opponentEffective = useMemo(() => calcEffective(opponent.speed, opponent.mods), [opponent.speed, opponent.mods]);

  const selectPokemon = (p: SpeedTierEntry) =>
    setOpponent((prev) => ({ ...prev, name: p.name, speed: String(p.speedTiers.max), pokemon: p }));

  const clearOpponent = () => setOpponent({ name: "", speed: "", pokemon: null, mods: DEFAULT_MODIFIERS });

  const updateMember = (id: string, update: Partial<Omit<TeamMember, "id">>) =>
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...update } : m)));
  const addMember = () => team.length < 6 && setTeam((prev) => [...prev, newMember()]);
  const removeMember = (id: string) => setTeam((prev) => prev.filter((m) => m.id !== id));

  const refSpeeds = useMemo(() => {
    const p = opponent.pokemon;
    if (!p) return [];
    const chips: { label: string; value: number }[] = [
      { label: "0/N", value: p.speedTiers.min },
      { label: "0/+", value: p.speedTiers.minPlus },
      { label: "252/N", value: p.speedTiers.max },
      { label: "252/+", value: p.speedTiers.maxPlus },
    ];
    if (p.speedTiers.scarf !== null) {
      chips.push({ label: "Scarf", value: p.speedTiers.scarf });
      if (p.speedTiers.scarfPlus !== null) chips.push({ label: "Scarf+", value: p.speedTiers.scarfPlus });
    }
    return chips;
  }, [opponent.pokemon]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
      {/* Opponent */}
      <SpdPanel icon="target" title={t("opponentTitle")} bodyClassName="grid gap-[14px]">
        <SpdMonSearch
          speedTiers={speedTiers}
          loading={loading}
          selectedName={opponent.name}
          onSelect={selectPokemon}
          onClear={clearOpponent}
          placeholder={t("opponentSearch")}
        />

        {refSpeeds.length > 0 && (
          <div className="grid gap-[6px]">
            <span className="font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("referenceSpeed")}</span>
            <div className="flex flex-wrap gap-1.5">
              {refSpeeds.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setOpponent((prev) => ({ ...prev, speed: String(chip.value) }))}
                  className={cn(
                    "border border-solid px-2 py-[3px] font-mono text-[11px] transition-[color,background,border-color]",
                    opponent.speed === String(chip.value) ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line-2 text-txt-muted hover:text-txt",
                  )}
                >
                  {chip.label}: {chip.value}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-[6px]">
          <span className="font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("opponentManual")}</span>
          <SpdInput icon="bolt" type="number" value={opponent.speed} onChange={(v) => setOpponent((prev) => ({ ...prev, speed: v }))} placeholder={t("opponentSpeedPlaceholder")} className="w-full" />
        </div>

        <div className="grid gap-[6px]">
          <span className="font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("opponentModifiers")}</span>
          <SpdModifiers modifiers={opponent.mods} onChange={(m) => setOpponent((prev) => ({ ...prev, mods: m }))} />
        </div>

        <div className="border border-solid border-line bg-base px-4 py-4 text-center">
          <div className="mb-1 font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("effectiveSpeed")}</div>
          <div className="font-display text-[46px] font-extrabold italic leading-none tabular-nums text-txt">{opponentEffective !== null ? opponentEffective : "—"}</div>
          {opponent.name && <div className="mt-1.5 font-mono text-[11px] text-txt-muted">{opponent.name}</div>}
        </div>
      </SpdPanel>

      {/* My team */}
      <SpdPanel
        icon="users"
        title={`${t("myTeamTitle")} (${team.length}/6)`}
        aside={
          <button type="button" onClick={() => setTeam(team.map((m) => ({ ...m, name: "", speed: "", mods: DEFAULT_MODIFIERS })))} className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt-dim transition-colors hover:text-bad">
            {t("clearTeam")}
          </button>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)]">
          {team.map((member, idx) => {
            const effective = calcEffective(member.speed, member.mods);
            return (
              <div key={member.id} className="grid gap-2.5 px-[14px] py-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 flex-none text-center font-mono text-[11px] text-txt-dim">{idx + 1}</span>
                  <SpdInput value={member.name} onChange={(v) => updateMember(member.id, { name: v })} placeholder={t("teamMemberName")} className="flex-1" />
                  <SpdInput type="number" value={member.speed} onChange={(v) => updateMember(member.id, { speed: v })} placeholder={t("teamMemberSpeed")} className="w-28" />
                  <button type="button" onClick={() => removeMember(member.id)} className="grid flex-none place-items-center p-1.5 text-txt-dim transition-colors hover:text-bad">
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 pl-6">
                  <span className="font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("effectiveSpeed")}</span>
                  <span className="min-w-[2.5rem] font-mono text-[17px] font-bold tabular-nums text-txt">
                    {effective !== null ? effective : <span className="text-[15px] text-txt-dim">—</span>}
                  </span>
                  {opponentEffective !== null && effective !== null && <ResultBadge mySpeed={effective} opponentSpeed={opponentEffective} t={t} />}
                  {opponentEffective === null && <span className="font-mono text-[11px] italic text-txt-dim">{t("noOpponent")}</span>}
                  {member.name && (
                    <DkSprite src={spriteUrl(member.name)} alt={member.name} size={22} onError={handleSpriteError} className="ml-auto" />
                  )}
                </div>
                <div className="pl-6">
                  <SpdModifiers modifiers={member.mods} onChange={(m) => updateMember(member.id, { mods: m })} />
                </div>
              </div>
            );
          })}
        </div>
        {team.length < 6 && (
          <div className="border-t border-solid border-line px-[14px] py-3">
            <button type="button" onClick={addMember} className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt">
              <Icon name="plus" size={14} />
              {t("addMember")}
            </button>
          </div>
        )}
      </SpdPanel>
    </div>
  );
}
