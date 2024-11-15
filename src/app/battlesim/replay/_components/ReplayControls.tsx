import { Input } from "@/components/ui/input";
import { PlayIcon, PauseIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsRightLeftIcon, BoltIcon, ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getCanvasWidth } from "../../_utils/viewUtils";
import ReplayControlsButton from './ReplayControlsButton';
import useViewportWidth from "@/services/useViewPortWidth";

export type ReplayControlsProps = {
    battle: any;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTurn: (turn?: number) => void;
    pov: number;
    setPov: (pov: number) => void;
    simulateAttack: () => void;
    simulatedAttack: string;
    setSimulatedAttack: (simulatedAttack: string) => void;
    turnInput: number;
    setTurnInput: (turnInput: number) => void;
    lastTurn: number;
    logVisible: boolean;
    setLogVisible: (logVisible: boolean) => void;
}

export function ReplayControls({
    battle, isPlaying, setIsPlaying, setCurrentTurn, pov, setPov, 
    simulateAttack, simulatedAttack, setSimulatedAttack, turnInput, 
    setTurnInput, lastTurn, logVisible, setLogVisible}: ReplayControlsProps) {
    const [, canvasWidth] = useViewportWidth()

    if(canvasWidth === 0) return null;

    return(
        <div className="flex justify-between p-2 bg-surface-800 space-x-2" style={{ width: `${canvasWidth + (logVisible ? 400 : 0)}px` }}>
            <div className="flex space-x-2">
                <ReplayControlsButton onClick={() => setIsPlaying(!isPlaying)} label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                </ReplayControlsButton>
                <ReplayControlsButton onClick={() => setCurrentTurn(0)} label="Restart">
                    <ArrowPathIcon className="h-5 w-5" />
                </ReplayControlsButton>
            </div>
            <div className="flex space-x-2">
                <ReplayControlsButton onClick={() => setCurrentTurn(battle.turn - 1)} label="Previous Turn">
                    <ChevronLeftIcon className="h-5 w-5" />
                </ReplayControlsButton>
                <ReplayControlsButton onClick={() => setCurrentTurn(battle.turn + 1)} label="Next Turn">
                    <ChevronRightIcon className="h-5 w-5" />
                </ReplayControlsButton>
            </div>
            <div className="flex space-x-2">
                <ReplayControlsButton onClick={() => setPov(pov === 0 ? 1 : 0)} label="Switch POV">
                    <ArrowsRightLeftIcon className="h-5 w-5" />
                </ReplayControlsButton>
                <ReplayControlsButton onClick={() => setLogVisible(!logVisible)} label="Toggle Log">
                    <PlusIcon className="h-5 w-5" />
                </ReplayControlsButton>
                <ReplayControlsButton onClick={() => simulateAttack()} label="Simulate Attack">
                    <BoltIcon className="h-5 w-5" />
                </ReplayControlsButton>
                <Input
                    className="w-32 border border-surface-900"
                    type="string"
                    value={simulatedAttack}
                    onChange={(e) => setSimulatedAttack(e.target.value)}
                    min={1}
                    max={lastTurn}
                />
            </div>
            <div className="flex space-x-2">
                <ReplayControlsButton onClick={() => setCurrentTurn()} label="Go to Turn">
                    <ArrowRightIcon className="h-5 w-5" />
                </ReplayControlsButton>
                <Input
                    className="w-20 border border-surface-900"
                    type="number"
                    value={turnInput}
                    onChange={(e) => setTurnInput(parseInt(e.target.value))}
                    min={1}
                    max={lastTurn}
                />
            </div>
        </div>
    );
}