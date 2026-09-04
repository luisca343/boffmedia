"use client"
import { Battle, Pokemon } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Spinner, Skeleton, DISPLAY_VOICE } from "@boffmedia/ui";
import { useToolT, BATTLESIM_NS } from '../i18n';
import { positionsP1, positionsP2, ASPECT_RATIO } from "../engine/viewUtils";
import { PokemonElement } from "./PokemonElement";
import { Avatar } from "./Avatar";
import { Hazard } from "./Hazard";
import { FieldLayer } from "./FieldLayer";
import { SideScreens } from "./SideScreens";
import BattleEndScreen from "./BattleEndScreen";
import { BxPlate, useBxLabels } from "./bx-kit";
import { BxMonPopover } from "./BxMonPopover";
import { BxMonHoverCard, type HoverAnchor } from "./BxMonHoverCard";
import { toBSXMon, type BSXMon } from "../engine/toBSXMon";
import { FieldConditions, resolveCondLabel } from "./FieldConditions";
import { battlesimAssetUrl } from '../asset';
import { BattleScaleProvider, useElementSize } from "../lib/battle-layout";
import { setFxLabels } from "../engine/fxLabels";
import { spriteIdentityKey, useSpriteSource } from "../sprites";
import type { TurnLedger } from "../engine/TurnLedger";
import { getParticipantName } from "../engine/replayUtils";
import { cn } from "../lib/cn";
import type { TargetingState } from "../lib/battle-types";

/**
 * What the canvas needs from the session, structurally rather than by class.
 *
 * `BattleSession` satisfies it as-is; stating it this way keeps the canvas
 * renderable (and testable) with nothing but a Battle, and keeps the engine out
 * of the component's type surface.
 */
export interface CanvasSession {
    /** The commit handshake. See the layout effect below. */
    onCommitted?: (revision: number) => void;
    /** What happened this turn, per Pokémon — read by the HP plates. */
    ledger?: TurnLedger;
}

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
    /**
     * Bumped by the session on every visible change.
     *
     * Load-bearing twice over. First, this component is `memo`'d and every
     * other prop keeps its identity for the whole battle (`battle` is mutated
     * in place, never replaced), so without a value that actually changes the
     * shallow compare skips every re-render and the field freezes between
     * turns. Second, it is the token of the commit handshake: the layout effect
     * below reports it back so the engine knows the state it just applied is on
     * screen. See `BattleSession.revision` / `awaitCommit`.
     */
    revision?: number;
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
    /**
     * The session driving this battle, for the two things only it can answer:
     * the commit handshake and the turn ledger. Optional — the replay player
     * renders without one, and the engine's `awaitCommit` has its own 64 ms
     * fallback for exactly that case.
     */
    session?: CanvasSession | null;
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
    session = null, revision = 0,
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

    // THE COMMIT HANDSHAKE. The engine applies a line, bumps `revision`, then
    // waits here before animating: a switch's summon addresses an `<img>` that
    // does not exist until React has mounted it, and a move animation aimed at
    // last turn's sprite writes styles onto a Pokemon that has already left.
    //
    // A layout effect rather than an effect, and on `[revision]` rather than on
    // every render: layout effects run inside the commit, before the browser
    // paints, so the engine is released at the first moment the DOM is real —
    // one frame earlier than `useEffect` would, which is the difference between
    // the ball opening on the new sprite and opening on nothing.
    useLayoutEffect(() => {
        session?.onCommitted?.(revision);
    }, [session, revision]);

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

    const spriteSource = useSpriteSource();

    /**
     * The React key of a slot's sprite element.
     *
     * Folds in everything that must produce a NEW <img> rather than a patched
     * one: the slot, the mon (`searchid` = ident + details, stable per mon and
     * forme), and the sprite's own identity (species as rendered, shiny, gender,
     * side, source). Patching an animated GIF's `src` in place leaves the old
     * frames on screen until the new file decodes, which is what made a switch
     * show the outgoing Pokemon for a beat; a remount cannot do that.
     *
     * `speciesForme` covers `-transform` too: the client has already rewritten
     * it to the target by the time this runs.
     */
    const identityOf = (position: string, mon: Pokemon): string => {
        const spriteSide: 'p1' | 'p2' = position.startsWith('p2') ? 'p2' : 'p1';
        const searchid = (mon as any).searchid || (mon as any).originalIdent || mon.ident || '';
        return position + ':' + searchid + ':' + spriteIdentityKey({
            speciesForme: mon.speciesForme, shiny: mon.shiny, gender: mon.gender as any,
            side: spriteSide, source: spriteSource, transformedInto: null,
        });
    };

    /**
     * Which slots are about to be SUMMONED, and therefore must mount invisible.
     *
     * Only an ident change qualifies. `switch` / `drag` / `replace` are the
     * three events whose `postApply` commits and then plays the summon (see
     * `eventHandlers.switchHandler`), and all three change the slot's ident —
     * including the opening leads, which arrive as `|switch|` onto an empty
     * slot and are summoned like any other, so hiding those is right too.
     * `detailschange` / `-formechange` / `-transform` also remount the node (the
     * key folds in `speciesForme`) but their handler only commits and waits, so
     * a sprite hidden for one of those would never be faded back in — a Mega
     * Evolution would simply vanish.
     *
     * Recorded in a layout effect, not during render: a render may run twice for
     * one commit, and the answer has to be the same both times.
     */
    const lastIdent = useRef<Record<string, string>>({});
    const summonPending: Record<string, boolean> = {};
    for (const position of [...positionsP1, ...positionsP2]) {
        const mon = pokemon[position];
        const ident = mon ? String((mon as any).originalIdent || mon.ident || '') : '';
        summonPending[position] = !!ident && lastIdent.current[position] !== ident;
    }
    useLayoutEffect(() => {
        for (const position of [...positionsP1, ...positionsP2]) {
            const mon = pokemon[position];
            const ident = mon ? String((mon as any).originalIdent || mon.ident || '') : '';
            if (ident) lastIdent.current[position] = ident;
            else delete lastIdent.current[position];
        }
    });

    /** What happened this turn, per Pokemon — the HP plates draw the delta. */
    const ledger = session?.ledger;

    // Hit flash: a plate whose Pokemon lost HP since the last render flashes
    // for half a second. Kept in a ref so the timer survives the many renders
    // an animation produces.
    //
    // KEYED BY POKEMON, NOT BY SLOT. Keying the previous HP by slot meant a
    // switch compared two different Pokemon: send a full-HP mon in after a
    // damaged one and the plate flashed a hit nobody took. (The old
    // `speciesForme` guard caught the common case and missed every switch
    // between two of the same species, and every Ditto.) The map is keyed by
    // `originalIdent`, which carries the side prefix and survives forme
    // changes, so a mon coming back in is compared against ITS own last HP —
    // which is also why entry hazards correctly flash the incoming plate.
    // Nothing is pruned: a battle holds at most twelve of these.
    const prevHp = useRef<Map<string, number>>(new Map());
    const [hits, setHits] = useState<Record<string, true>>({});
    const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const fresh: Record<string, true> = {};
        let changed = false;
        for (const [pos, mon] of Object.entries(pokemon)) {
            if (!mon) continue;
            const key = String((mon as any).originalIdent || mon.ident || '');
            if (!key) continue;
            const prev = prevHp.current.get(key);
            if (prev != null && mon.hp < prev) { fresh[pos] = true; changed = true; }
            prevHp.current.set(key, mon.hp);
        }
        if (changed) {
            setHits((h) => ({ ...h, ...fresh }));
            if (hitTimer.current) clearTimeout(hitTimer.current);
            hitTimer.current = setTimeout(() => setHits({}), 600);
        }
    });
    useEffect(() => () => { if (hitTimer.current) clearTimeout(hitTimer.current); }, []);

    const [details, setDetails] = useState<{ mon: BSXMon; foe: boolean } | null>(null);

    // Hover card. Keyed by POSITION, not by mon: the same slot is hovered
    // across a switch, and holding the object would show the card of a
    // Pokémon that has already left the field.
    const [hover, setHover] = useState<{ position: string; box: HoverAnchor } | null>(null);
    const onSpriteHover = useCallback((position: string, box: HoverAnchor | null) => {
        // A leave from a slot that is no longer the hovered one is stale —
        // pointer enter on the next sprite arrives before the previous one's
        // leave, and honouring it would close the card that just opened.
        setHover((cur) => (box ? { position, box } : cur?.position === position ? null : cur));
    }, []);
    // Targeting owns the field while it is on: the plates are buttons then and
    // a card over them is in the way. Same for the two full-cover overlays.
    const hoverBlocked = !!targeting || showPreviewOverlay || battleComplete;

    const wrapClass = fit === 'contain' ? "relative flex h-full w-full items-center justify-center" : "relative w-full";

    // How far the ally HP plates must rise to clear the action band.
    //
    // The band is fixed to the bottom of the STAGE and the field is centred
    // inside it, so the two edges only coincide when the field is the taller
    // of the two — which is the usual case (a box wider than 16:9 makes height
    // the binding constraint, and the field then spans the stage exactly).
    // When the box is NARROWER than 16:9 the field is width-bound and centres
    // with `slack` px of stage above and below it, and the band eats that
    // before it reaches the field at all. Subtracting it stops the plates from
    // floating that far above a band they were already clear of.
    //
    // `--bx-dock-h` is only defined by the overlay stance, so on mobile and in
    // the replay player this resolves to 0px and the plates sit where they did.
    const slack = fit === 'contain' && box.height > height ? Math.round((box.height - height) / 2) : 0;
    const allyLift = `max(0px, calc(var(--bx-dock-h, 0px) - ${slack}px))`;

    /**
     * The replay player's own overlays — the intro card and the end screen.
     *
     * They stop at the action band, exactly where the ally plates do, and for
     * the same reason: the band floats over the field's lower edge, and an
     * overlay drawn to the field's real bottom would cover it. It does not only
     * LOOK covered — the overlay outranks the band in the stage's stacking
     * order, so every button on the transport (play, scrub, speed) was eating
     * its clicks with nothing on screen to explain why.
     *
     * `allyLift` is 0 wherever there is no band (mobile, `fit="width"`), so
     * this is `inset-0` again there.
     */
    // `z-[130]`, above the HUD plates' `z-[120]`: these two cover the field, and
    // at z-40 the plates and the turn chip floated on top of the end screen.
    const overlayFrame = (children: React.ReactNode) => (
        <div className="absolute inset-x-0 top-0 z-[130] flex flex-col overflow-hidden" style={{ bottom: allyLift }}>{children}</div>
    );

    if (liveMode && liveStatus === 'connecting') {
        return (
            <div ref={wrapRef} className={wrapClass}>
                <div className="flex flex-col items-center justify-center gap-3 bg-base-deep" style={{ width: width || '100%', height: height || 240, backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane.png')})`, backgroundSize: '100% 100%' }}>
                    <Spinner size={44} />
                    <span className="font-mono text-[0.75rem] text-txt-muted">{t('connection.waitingBattle')}</span>
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

    const plateWidth = compact ? "w-[min(12.5rem,100%)]" : "w-[min(16.25rem,100%)]";
    const foePlates = positionsP2.map((position, i) => {
        const mon = toBSXMon(pokemon[position]);
        if (!mon) return null;
        const opt = targeting?.options.find((o) => o.side === 'foe' && o.slot === i);
        return (
            <div key={position} className={cn("pointer-events-auto min-w-0", plateWidth)}>
                <BxPlate mon={mon} foe compact={compact} slotTag={t('battle.foe')} aimed={aimedFoe && !mon.fnt && !targeting} hit={!!hits[position]}
                    ledger={ledger?.get(pokemon[position])}
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
                    ledger={ledger?.get(pokemon[position])}
                    targetable={!!opt} targetLabel={opt?.label} onClick={opt ? () => targeting?.onPick(opt.code) : undefined}
                    onDetails={opt ? undefined : () => setDetails({ mon, foe: false })} detailsLabel={t('battle.mon.details', { name: mon.name })} />
            </div>
        );
    });

    return (
        <div ref={wrapRef} className={wrapClass}>
            {/* Gutter dressing. The field is 16:9 and the stage rarely is, so a
                sliver of stage is always left over on one axis. Left bare it is
                `--bg-deep`, i.e. pure black, and reads as a hole punched either
                side of the board.
                A blurred, BRIGHTENED copy of the field art instead — brightened,
                not scrimmed: any darkening layer over pure black lands back on
                black, which is the thing being fixed. `scale-110` hides the
                blur's soft edge; `-z-10` puts it behind the field but still in
                front of the stage's own background. */}
            {fit === 'contain' && width > 0 && (
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 scale-110"
                        style={{ backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane.png')})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(1.15) saturate(0.85)' }} />
                </div>
            )}
            <div id="game" ref={gameRefCallback} className="relative select-none overflow-hidden bg-base-deep"
                style={{ width: width || undefined, height: height || undefined, backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane.png')})`, backgroundSize: `100% 100%` }}>
                <BattleScaleProvider width={width || 960}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-[120] flex items-start justify-between gap-2 p-1.5 sm:p-2">
                        <div className="flex min-w-0 max-w-[40%] flex-col items-start gap-1">
                            <div className="pointer-events-auto w-fit border border-solid border-line bg-base/80 px-2 py-1 font-mono text-[0.6875rem] font-bold uppercase leading-none tracking-[0.08em] text-txt backdrop-blur-[3px]">
                                {t('battle.turn', { turn: battle.turn })}
                            </div>
                            <div className="pointer-events-auto max-w-full"><FieldConditions battle={battle} pov={side} max={compact ? 2 : 6} /></div>
                        </div>
                        <div className="flex min-w-0 max-w-[60%] flex-row-reverse flex-wrap items-start justify-start gap-1">{foePlates}</div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[120] flex items-end gap-2 px-1.5 pt-1.5 sm:px-2 sm:pt-2"
                         style={{ paddingBottom: `calc(0.5rem + ${allyLift})`, transition: 'padding-bottom 180ms ease' }}>
                        <div className="flex min-w-0 max-w-[60%] flex-wrap items-end gap-1">{allyPlates}</div>
                    </div>

                    <Avatar side={p1} pov={side} />
                    <Avatar side={p2} pov={side} />

                    {/* Weather / terrain / rooms, between the background art and
                        everything standing on it. Derived from `battle.field` on
                        every revision — see `FieldLayer`. */}
                    <FieldLayer battle={battle} />

                    {positionsP1.map((position) => pokemon[position] && (
                        <PokemonElement key={identityOf(position, pokemon[position])} battle={battle} pokemon={pokemon[position]}
                            position={position} mountHidden={summonPending[position]} onHover={onSpriteHover} />
                    ))}
                    {/* POV-SWAPPED. `p1`/`p2` here are the locals from the top of
                        this component, not `battle.p1`/`battle.p2`: hazards laid
                        on the VIEWER must be drawn on the viewer's half of the
                        field, and on pov 1 the viewer is `battle.p2`. Using the
                        raw sides put every spike on the wrong side for player
                        two — while the chip row beside them, which does swap,
                        said the opposite. */}
                    {Object.entries(p1.sideConditions).map((entry) => <Hazard key={entry[0]} hazard={entry as any} side="p1" />)}
                    <SideScreens conditions={p1.sideConditions} side="ally" />
                    {positionsP2.map((position) => pokemon[position] && (
                        <PokemonElement key={identityOf(position, pokemon[position])} battle={battle} pokemon={pokemon[position]}
                            position={position} mountHidden={summonPending[position]} onHover={onSpriteHover} />
                    ))}
                    {Object.entries(p2.sideConditions).map((entry) => <Hazard key={entry[0]} hazard={entry as any} side="p2" />)}
                    <SideScreens conditions={p2.sideConditions} side="foe" />

                    {hover && !hoverBlocked && (() => {
                        const mon = toBSXMon(pokemon[hover.position]);
                        if (!mon) return null;
                        return <BxMonHoverCard mon={mon} foe={hover.position.startsWith('p2')} anchor={hover.box} field={{ width, height }} compact={compact} />;
                    })()}

                    <div id="overlay" className="pointer-events-none absolute inset-0">
                        {/* Trick Room used to be drawn here from `fx/trickroom.png`,
                            a file that is not in the pack — so the one pseudo
                            weather with art shipped as a broken image. The real
                            asset is `fx/weather-trickroom.png`, and it belongs to
                            `FieldLayer` now along with the other rooms, the
                            weather and the terrain. */}
                        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: `url(${battlesimAssetUrl('fx/bg/hagane_overlay.png')})`, backgroundSize: '100% 100%' }} />
                    </div>

                    {!liveMode && showPreviewOverlay && overlayFrame(
                        <div className="flex flex-1 items-center justify-center bg-base/80 p-4">
                            <div className="flex w-full max-w-[26.25rem] flex-col items-center gap-4 border border-solid border-line bg-panel p-5 text-center">
                                <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-txt-dim">{t('battle.intro.title')}</span>
                                <div className="flex w-full items-center justify-between gap-3">
                                    <b className="min-w-0 flex-1 truncate font-display text-[1rem] font-bold uppercase leading-none tracking-[0.04em] text-txt">{getParticipantName(p1.name)}</b>
                                    <span className={cn(DISPLAY_VOICE, "flex-none text-[1.75rem] text-accent")}>{t('battle.intro.vs')}</span>
                                    <b className="min-w-0 flex-1 truncate font-display text-[1rem] font-bold uppercase leading-none tracking-[0.04em] text-txt">{getParticipantName(p2.name)}</b>
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
