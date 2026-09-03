"use client"
import { Battle, Pokemon } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button, Spinner, Skeleton, DISPLAY_VOICE } from "@boffmedia/ui";
import { useToolT, BATTLESIM_NS } from '../i18n';
import { positionsP1, positionsP2, ASPECT_RATIO } from "../engine/viewUtils";
import { PokemonElement } from "./PokemonElement";
import { Avatar } from "./Avatar";
import { Hazard } from "./Hazard";
import BattleEndScreen from "./BattleEndScreen";
import { BxPlate, useBxLabels } from "./bx-kit";
import { BxMonPopover } from "./BxMonPopover";
import { toBSXMon, type BSXMon } from "../engine/toBSXMon";
import { FieldConditions, resolveCondLabel } from "./FieldConditions";
import { battlesimAssetUrl } from '../asset';
import { BattleScaleProvider, useElementSize } from "../lib/battle-layout";
import { setFxLabels } from "../engine/fxLabels";
import { getParticipantName } from "../engine/replayUtils";
import { cn } from "../lib/cn";
import type { TargetingState } from "../lib/battle-types";

export type BattleCanvasRefProps = {
  bounceAll: () => void;
  animateMove: (attacker: PokemonIdent, moveName: string, defender: PokemonIdent) => void;
};

interface BattleCanvasProps {
    battle: Battle;
    pov: 0 | 1 | any;
    messageBar?: string[];
    showPreviewOverlay?: boolean;
    setBattleStarted?: (started: boolean) => void;
    setIsPlaying?: (playing: boolean) => void;
    currentAction?: number;
    battleLog?: string | null;
    showFullInfo?: boolean;
    initScene?: (gameElement: HTMLElement) => void;
    liveMode?: boolean;
    liveStatus?: 'idle' | 'connecting' | 'active' | 'finished' | 'error';
    onPlayAgain?: () => void;
    battleComplete?: boolean;
    username?: string | null;
    aimedFoe?: boolean;
    /** Ignored — the canvas measures its own box now. Kept for old callers. */
    canvasWidth?: number;
    fullscreen?: boolean;
    /** `contain`: fit the parent's width AND height (the battle shell). `width`: fill the width (the replay player). */
    fit?: 'contain' | 'width';
    /** Doubles target mode published by the dock. */
    targeting?: TargetingState | null;
    /** Compact plates (defaults to canvas width < 640). */
    compact?: boolean;
}

/**
 * The field. It measures its own box, publishes the resulting scale to the
 * sprites and the engine, and draws the HUD plates over the corners. Live
 * overlays (preview, end) belong to the composition around it; the replay
 * player still gets its intro/end here.
 */
export const BattleCanvas = memo(forwardRef<BattleCanvasRefProps, BattleCanvasProps>(function BattleCanvas({
    battle, pov, showPreviewOverlay = false, setBattleStarted, setIsPlaying, battleLog, initScene,
    liveMode = false, liveStatus, battleComplete = false, aimedFoe = false, fit = 'width', targeting = null, compact: compactProp,
}, ref) {
    const t = useToolT(BATTLESIM_NS);
    const L = useBxLabels();
    const wrapRef = useRef<HTMLDivElement>(null);
    const box = useElementSize(wrapRef);
    const width = useMemo(() => {
        if (box.width === 0) return 0;
        if (fit === 'contain' && box.height > 0) return Math.max(160, Math.floor(Math.min(box.width, box.height / ASPECT_RATIO)));
        return Math.floor(box.width);
    }, [box, fit]);
    const height = Math.round(width * ASPECT_RATIO);
    const compact = compactProp ?? width < 640;
    const side: 0 | 1 = pov === 1 ? 1 : 0;

    useImperativeHandle(ref, () => ({ bounceAll: () => {}, animateMove: () => {} }), []);

    // The engine's popup words, from the catalog, for this locale.
    useEffect(() => {
        setFxLabels({
            crit: t('battle.fx.crit'), miss: t('battle.fx.miss'), super: t('battle.fx.super'), resisted: t('battle.fx.resisted'), immune: t('battle.fx.immune'),
            tera: (type) => t('battle.fx.tera', { type: L.type(type) }), mega: t('battle.fx.mega'), primal: t('battle.fx.primal'), burst: t('battle.fx.burst'),
            zmove: t('battle.fx.zmove'), zbroken: t('battle.fx.zbroken'), cured: t('battle.fx.cured'),
            status: (id) => L.status(id), stat: (id) => L.boost(id), cond: (id) => resolveCondLabel(t, id),
        });
    }, [t, L]);

    const gameRefCallback = useCallback((node: HTMLElement | null) => {
        if (node && initScene) initScene(node);
    }, [initScene]);

    const p1 = side === 0 ? battle.p1 : battle.p2;
    const p2 = side === 0 ? battle.p2 : battle.p1;

    const pokemon = {
        p1a: p1.active[0], p1b: p1.active[1], p1c: p1.active[2], p1d: p1.active[3], p1e: p1.active[4],
        p2a: p2.active[0], p2b: p2.active[1], p2c: p2.active[2], p2d: p2.active[3], p2e: p2.active[4],
    } as { [key: string]: Pokemon };

    // Hit flash: a plate whose HP dropped since the last render flashes for
    // half a second. Kept in a ref so the timer survives the many renders an
    // animation produces.
    const prevHp = useRef<Record<string, number>>({});
    const [hits, setHits] = useState<Record<string, true>>({});
    const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const fresh: Record<string, true> = {};
        let changed = false;
        for (const [pos, mon] of Object.entries(pokemon)) {
            if (!mon) { delete prevHp.current[pos]; continue; }
            const prev = prevHp.current[pos];
            if (prev != null && mon.hp < prev && mon.speciesForme === prevHp.current[pos + ':s'] as any) { fresh[pos] = true; changed = true; }
            prevHp.current[pos] = mon.hp;
            (prevHp.current as any)[pos + ':s'] = mon.speciesForme;
        }
        if (changed) {
            setHits((h) => ({ ...h, ...fresh }));
            if (hitTimer.current) clearTimeout(hitTimer.current);
            hitTimer.current = setTimeout(() => setHits({}), 600);
        }
    });
    useEffect(() => () => { if (hitTimer.current) clearTimeout(hitTimer.current); }, []);

    const [details, setDetails] = useState<{ mon: BSXMon; foe: boolean } | null>(null);

    const overlayFrame = (children: React.ReactNode) => (
        <div className="absolute inset-0 z-40 flex flex-col overflow-hidden">{children}</div>
    );

    const wrapClass = fit === 'contain' ? "relative flex h-full w-full items-center justify-center" : "relative w-full";

    if (liveMode && liveStatus === 'connecting') {
        return (
            <div ref={wrapRef} className={wrapClass}>
                <div className="flex flex-col items-center justify-center gap-3 bg-base-deep" style={{ width: width || '100%', height: height || 240, backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane.png')})`, backgroundSize: '100% 100%' }}>
                    <Spinner size={44} />
                    <span className="font-mono text-[12px] text-txt-muted">{t('connection.waitingBattle')}</span>
                </div>
            </div>
        );
    }
    if (!liveMode && !battle.pokemonControlled && !battleLog) {
        return (
            <div ref={wrapRef} className={wrapClass}>
                <div className="flex flex-col gap-3" style={{ width: width || '100%' }}>
                    <Skeleton h={height || 240} />
                </div>
            </div>
        );
    }

    const plateWidth = compact ? "w-[min(200px,100%)]" : "w-[min(260px,100%)]";
    const foePlates = positionsP2.map((position, i) => {
        const mon = toBSXMon(pokemon[position]);
        if (!mon) return null;
        const opt = targeting?.options.find((o) => o.side === 'foe' && o.slot === i);
        return (
            <div key={position} className={cn("pointer-events-auto min-w-0", plateWidth)}>
                <BxPlate mon={mon} foe compact={compact} slotTag={t('battle.foe')} aimed={aimedFoe && !mon.fnt && !targeting} hit={!!hits[position]}
                    targetable={!!opt} targetLabel={opt?.label} onClick={opt ? () => targeting?.onPick(opt.code) : undefined}
                    onDetails={opt ? undefined : () => setDetails({ mon, foe: true })} detailsLabel={t('battle.mon.details', { name: mon.name })} />
            </div>
        );
    });
    const allyPlates = positionsP1.map((position, i) => {
        const mon = toBSXMon(pokemon[position]);
        if (!mon) return null;
        const opt = targeting?.options.find((o) => o.side === 'ally' && o.slot === i);
        return (
            <div key={position} className={cn("pointer-events-auto min-w-0", plateWidth)}>
                <BxPlate mon={mon} compact={compact} slotTag={t('battle.you')} active={!targeting} hit={!!hits[position]}
                    targetable={!!opt} targetLabel={opt?.label} onClick={opt ? () => targeting?.onPick(opt.code) : undefined}
                    onDetails={opt ? undefined : () => setDetails({ mon, foe: false })} detailsLabel={t('battle.mon.details', { name: mon.name })} />
            </div>
        );
    });

    return (
        <div ref={wrapRef} className={wrapClass}>
            <div id="game" ref={gameRefCallback} className="relative select-none overflow-hidden bg-base-deep"
                style={{ width: width || undefined, height: height || undefined, backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane.png')})`, backgroundSize: `100% 100%` }}>
                <BattleScaleProvider width={width || 960}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-[120] flex items-start justify-between gap-2 p-1.5 sm:p-2">
                        <div className="flex min-w-0 max-w-[40%] flex-col items-start gap-1">
                            <div className="pointer-events-auto w-fit border border-solid border-line bg-base/80 px-2 py-1 font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-txt backdrop-blur-[3px]">
                                {t('battle.turn', { turn: battle.turn })}
                            </div>
                            <div className="pointer-events-auto max-w-full"><FieldConditions battle={battle} pov={side} max={compact ? 2 : 6} /></div>
                        </div>
                        <div className="flex min-w-0 max-w-[60%] flex-row-reverse flex-wrap items-start justify-start gap-1">{foePlates}</div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[120] flex items-end gap-2 p-1.5 sm:p-2">
                        <div className="flex min-w-0 max-w-[60%] flex-wrap items-end gap-1">{allyPlates}</div>
                    </div>

                    <Avatar side={p1} pov={side} />
                    <Avatar side={p2} pov={side} />

                    {positionsP1.map((position) => pokemon[position] && (
                        <PokemonElement key={position} battle={battle} pokemon={pokemon[position]} side={battle.p1} position={position} />
                    ))}
                    {Object.entries(battle.p1.sideConditions).map((entry) => <Hazard key={entry[0]} hazard={entry as any} side="p1" />)}
                    {positionsP2.map((position) => pokemon[position] && (
                        <PokemonElement key={position} battle={battle} pokemon={pokemon[position]} side={battle.p2} position={position} />
                    ))}
                    {Object.entries(battle.p2.sideConditions).map((entry) => <Hazard key={entry[0]} hazard={entry as any} side="p2" />)}

                    <div id="overlay" className="pointer-events-none absolute inset-0">
                        {battle.field.pseudoWeather['trickroom'] && (
                            <div className="absolute inset-0 z-[5] opacity-60" style={{ backgroundImage: `url(${battlesimAssetUrl('fx/trickroom.png')})`, backgroundSize: '100% 100%' }} />
                        )}
                        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane_overlay.png')})`, backgroundSize: '100% 100%' }} />
                    </div>

                    {!liveMode && showPreviewOverlay && overlayFrame(
                        <div className="flex flex-1 items-center justify-center bg-base/80 p-4">
                            <div className="flex w-full max-w-[420px] flex-col items-center gap-4 border border-solid border-line bg-panel p-5 text-center">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-txt-dim">{t('battle.intro.title')}</span>
                                <div className="flex w-full items-center justify-between gap-3">
                                    <b className="min-w-0 flex-1 truncate font-display text-[16px] font-bold uppercase leading-none tracking-[0.04em] text-txt">{getParticipantName(p1.name)}</b>
                                    <span className={cn(DISPLAY_VOICE, "flex-none text-[28px] text-accent")}>{t('battle.intro.vs')}</span>
                                    <b className="min-w-0 flex-1 truncate font-display text-[16px] font-bold uppercase leading-none tracking-[0.04em] text-txt">{getParticipantName(p2.name)}</b>
                                </div>
                                <Button variant="pri" size="lg" icon="play" onClick={() => { setBattleStarted?.(true); setIsPlaying?.(true); }}>{t('battle.intro.play')}</Button>
                            </div>
                        </div>,
                    )}
                    {!liveMode && battleComplete && overlayFrame(
                        <BattleEndScreen battle={battle} pov={side} onRestart={() => { setBattleStarted?.(false); setIsPlaying?.(false); }} />,
                    )}
                </BattleScaleProvider>
            </div>
            <span className="sr-only" aria-live="polite">{battle.turn > 0 ? t('battle.turnAnnounce', { turn: battle.turn }) : ''}</span>
            <BxMonPopover mon={details?.mon ?? null} foe={details?.foe} open={!!details} onClose={() => setDetails(null)} />
        </div>
    );
}));

BattleCanvas.displayName = "BattleCanvas";
