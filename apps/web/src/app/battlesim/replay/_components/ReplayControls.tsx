'use client';

import { useEffect } from 'react';
import { Input } from "@/components/ui/primitives/input";
import { Icon, BoffActionBar, Segmented } from '@/components/boffmedia/primitives';
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

    function previousTurn() {
        setCurrentTurn(Math.max(0, battle.turn - 1));
    }

    function nextTurn() {
        const newTurn = Math.min(lastTurn + 1, battle.turn + 1);
        if (newTurn === lastTurn + 1) {
            // End of battle: useBattleFlow's handleTurnChange processes the win action.
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, pov, battle.turn, lastTurn]);

    return (
        <div className="flex flex-col gap-2 w-full min-w-0">
            {/* Timeline scrubber */}
            <div className="relative px-1" aria-label="Línea de tiempo del combate">
                <input
                    type="range"
                    min={0}
                    max={Math.max(1, lastTurn)}
                    value={Math.min(battle.turn, lastTurn)}
                    onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer accent-[var(--accent-bright)]"
                    aria-valuetext={`Turno ${battle.turn} de ${lastTurn}`}
                    title={`Turno ${battle.turn} / ${lastTurn}`}
                />
                <div className="relative h-2 -mt-1 pointer-events-none">
                    {markers.map((m, i) => (
                        <span
                            key={`${m.kind}-${m.turn}-${i}`}
                            className="absolute w-[5px] h-[5px] rounded-full"
                            title={`${m.kind === 'ko' ? 'KO' : 'Cambio'} — turno ${m.turn}`}
                            style={{
                                left: `${(m.turn / Math.max(1, lastTurn)) * 100}%`,
                                background: m.kind === 'ko' ? 'var(--rose-500)' : 'var(--accent)',
                                transform: 'translateX(-50%)',
                            }}
                        />
                    ))}
                </div>
            </div>

            <BoffActionBar
                aria-label="Controles de reproducción"
                start={
                    <>
                        <ReplayControlsButton onClick={() => setIsPlaying(!isPlaying)} label={isPlaying ? 'Pause' : 'Play'} hint="Space" active={isPlaying}>
                            <Icon name={isPlaying ? 'pause' : 'play'} size={18} />
                        </ReplayControlsButton>
                        <ReplayControlsButton onClick={() => setCurrentTurn(0)} label="Restart">
                            <Icon name="refresh" size={18} />
                        </ReplayControlsButton>
                        <ReplayControlsButton onClick={previousTurn} label="Previous Turn" hint="←">
                            <Icon name="chevron" size={18} style={{ transform: 'rotate(90deg)' }} />
                        </ReplayControlsButton>
                        <ReplayControlsButton onClick={nextTurn} label="Next Turn" hint="→">
                            <Icon name="chevron" size={18} style={{ transform: 'rotate(-90deg)' }} />
                        </ReplayControlsButton>
                    </>
                }
                center={
                    <>
                        <span className="font-mono text-t-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            T{battle.turn} / {lastTurn}
                        </span>
                        <Segmented
                            value={String(speed)}
                            options={REPLAY_SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))}
                            onChange={(v) => setSpeed(parseFloat(v))}
                        />
                    </>
                }
                end={
                    <>
                        <ReplayControlsButton onClick={() => setPov(pov === 0 ? 1 : 0)} label={`POV: ${pov === 0 ? 'Jugador 1' : 'Jugador 2'}`} hint="P">
                            <Icon name="swap" size={18} />
                        </ReplayControlsButton>
                        <ReplayControlsButton onClick={() => setLogVisible(!logVisible)} label="Toggle Log" active={logVisible}>
                            <Icon name="eye" size={18} />
                        </ReplayControlsButton>
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <ReplayControlsButton onClick={() => simulateAttack()} label="Simulate Attack">
                                    <Icon name="bolt" size={18} />
                                </ReplayControlsButton>
                                <Input
                                    variant={'dark'}
                                    className="w-32"
                                    type="string"
                                    value={simulatedAttack}
                                    onChange={(e) => setSimulatedAttack(e.target.value)}
                                />
                            </>
                        )}
                        <Input
                            variant={'dark'}
                            className="w-20"
                            type="number"
                            value={turnInput}
                            onChange={(e) => setTurnInput(parseInt(e.target.value))}
                            min={1}
                            max={lastTurn}
                            aria-label="Ir al turno"
                        />
                        <ReplayControlsButton onClick={() => setCurrentTurn()} label="Go to Turn">
                            <Icon name="arrow" size={18} />
                        </ReplayControlsButton>
                    </>
                }
            />
        </div>
    );
}
