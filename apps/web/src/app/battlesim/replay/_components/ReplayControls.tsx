'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Icon, Input } from '@boffmedia/ui';
import { DkSeg } from '@/components/boffmedia/ui/tools/datakit';
import ReplayControlsButton from './ReplayControlsButton';
import { REPLAY_SPEEDS } from '../../_utils/replaySpeed';

export interface TimelineMarker {
  turn: number;
  kind: 'ko' | 'switch';
}

export type ReplayControlsProps = {
    battle: any;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTurn: (turn?: number) => void;
    pov: number;
    setPov: React.Dispatch<React.SetStateAction<0 | 1>>;
    simulateAttack: () => void;
    simulatedAttack: string;
    setSimulatedAttack: (simulatedAttack: string) => void;
    turnInput: number;
    setTurnInput: (turnInput: number) => void;
    lastTurn: number;
    logVisible: boolean;
    setLogVisible: (logVisible: boolean) => void;
    countActions: () => number;
    setCurrentAction: (action: number) => void;
    speed: number;
    setSpeed: (speed: number) => void;
    markers?: TimelineMarker[];
}

export function ReplayControls({
    battle, isPlaying, setIsPlaying, setCurrentTurn, pov, setPov,
    simulateAttack, simulatedAttack, setSimulatedAttack, turnInput,
    setTurnInput, lastTurn, logVisible, setLogVisible, speed, setSpeed, markers = []}: ReplayControlsProps) {
    const t = useTranslations('battlesim');

    function previousTurn() {
        setCurrentTurn(Math.max(0, battle.turn - 1));
    }

    function nextTurn() {
        const newTurn = Math.min(lastTurn + 1, battle.turn + 1);
        if (newTurn === lastTurn + 1) {
            setIsPlaying(false);
            setCurrentTurn(newTurn);
            return;
        }
        setCurrentTurn(newTurn);
    }

    // Keyboard-first review: Space play/pause, arrows step turns, P swaps POV.
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(!isPlaying);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                previousTurn();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextTurn();
            } else if (e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setPov(pov === 0 ? 1 : 0);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, pov, battle.turn, lastTurn]);

    return (
        <div className="flex w-full min-w-0 flex-col gap-2">
            {/* Timeline scrubber */}
            <div className="relative px-1" aria-label={t('replays.ctl.timeline')}>
                <input
                    type="range"
                    min={0}
                    max={Math.max(1, lastTurn)}
                    value={Math.min(battle.turn, lastTurn)}
                    onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer accent-accent"
                    aria-valuetext={t('replays.ctl.turnOf', { turn: battle.turn, total: lastTurn })}
                    title={`T${battle.turn} / ${lastTurn}`}
                />
                <div className="relative -mt-1 h-2 pointer-events-none">
                    {markers.map((m, i) => (
                        <span
                            key={`${m.kind}-${m.turn}-${i}`}
                            className="absolute h-[5px] w-[5px] rounded-full"
                            title={`${m.kind === 'ko' ? 'KO' : t('log.filterSwitches')} — T${m.turn}`}
                            style={{
                                left: `${(m.turn / Math.max(1, lastTurn)) * 100}%`,
                                background: m.kind === 'ko' ? 'var(--bad)' : 'var(--accent)',
                                transform: 'translateX(-50%)',
                            }}
                        />
                    ))}
                </div>
            </div>

            <div
                aria-label={t('replays.ctl.controls')}
                className="flex flex-wrap items-center gap-2 border border-solid border-line bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-2 backdrop-blur-[4px]"
            >
                <div className="flex items-center gap-1.5">
                    <ReplayControlsButton onClick={() => setIsPlaying(!isPlaying)} label={isPlaying ? t('replays.ctl.pause') : t('replays.ctl.play')} hint="Space" active={isPlaying}>
                        <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
                    </ReplayControlsButton>
                    <ReplayControlsButton onClick={() => setCurrentTurn(0)} label={t('replays.ctl.restart')}>
                        <Icon name="refresh" size={16} />
                    </ReplayControlsButton>
                    <ReplayControlsButton onClick={previousTurn} label={t('replays.ctl.prevTurn')} hint="←">
                        <Icon name="chevron" size={16} style={{ transform: 'rotate(90deg)' }} />
                    </ReplayControlsButton>
                    <ReplayControlsButton onClick={nextTurn} label={t('replays.ctl.nextTurn')} hint="→">
                        <Icon name="chevron" size={16} style={{ transform: 'rotate(-90deg)' }} />
                    </ReplayControlsButton>
                </div>

                <div className="mx-auto flex items-center gap-2">
                    <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-txt-muted">T{battle.turn} / {lastTurn}</span>
                    <DkSeg
                        size="sm"
                        value={String(speed)}
                        options={REPLAY_SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))}
                        onChange={(v) => setSpeed(parseFloat(v))}
                        ariaLabel={t('replays.ctl.speed')}
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <ReplayControlsButton onClick={() => setPov(pov === 0 ? 1 : 0)} label={t('replays.ctl.pov', { side: pov === 0 ? t('replays.ctl.player1') : t('replays.ctl.player2') })} hint="P">
                        <Icon name="swap" size={16} />
                    </ReplayControlsButton>
                    <ReplayControlsButton onClick={() => setLogVisible(!logVisible)} label={t('replays.ctl.toggleLog')} active={logVisible}>
                        <Icon name="eye" size={16} />
                    </ReplayControlsButton>
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <ReplayControlsButton onClick={() => simulateAttack()} label={t('replays.ctl.simulate')}>
                                <Icon name="bolt" size={16} />
                            </ReplayControlsButton>
                            <Input className="w-32" type="text" value={simulatedAttack} onChange={(e) => setSimulatedAttack(e.target.value)} />
                        </>
                    )}
                    <Input
                        className="w-20"
                        type="number"
                        value={turnInput}
                        onChange={(e) => setTurnInput(parseInt(e.target.value))}
                        min={1}
                        max={lastTurn}
                        aria-label={t('replays.ctl.goToTurnAria')}
                    />
                    <ReplayControlsButton onClick={() => setCurrentTurn()} label={t('replays.ctl.goToTurn')}>
                        <Icon name="arrow" size={16} />
                    </ReplayControlsButton>
                </div>
            </div>
        </div>
    );
}
