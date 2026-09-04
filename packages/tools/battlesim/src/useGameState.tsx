import { useEffect, useState } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { Scene } from './engine/Scene';
import { ReplayData } from './engine/types';
import { countActions } from './engine/replayUtils';
import { battlesimAssetUrl } from './asset';

/**
 * PER MOUNT, not per module.
 *
 * This was a module-level zustand store holding ONE `Battle` (M1). The tool
 * keeps several replay rooms mounted at once as layers, so every one of them
 * read and wrote the same battle: opening a second replay reset the first,
 * seeking in one moved the other, and the two `Scene`s ended up bound to the
 * same object. A `useState` initialiser gives each mount its own, which is the
 * only thing the store was ever used for — there was no cross-component
 * subscriber to justify the global.
 */
const newBattle = () => new Battle(new Generations(Dex as any) as any);

interface GameState {
    // Core state
    battle: Battle;
    setBattle: (battle: Battle) => void;
    battleLog: string | null;
    currentAction: number;
    scene: Scene | null;
    htmlLog: string[];
    isPlaying: boolean;
    messageBar: string[];
    
    // UI state
    turnInput: number;
    newTurn: number;
    settingTurn: boolean;
    lastTurn: number;
    simulatedAttack: string;
    logVisible: boolean;
    pov: 0 | 1;
    
    // State setters
    setBattleLog: (log: string | null) => void;
    setCurrentAction: (action: number) => void;
    setScene: (scene: Scene | null) => void;
    setHtmlLog: (log: string[]) => void;
    setIsPlaying: (playing: boolean) => void;
    setMessageBar: (messages: string[]) => void;
    setTurnInput: (turn: number) => void;
    setNewTurn: (turn: number) => void;
    setSettingTurn: (setting: boolean) => void;
    setLastTurn: (turn: number) => void;
    setSimulatedAttack: (attack: string) => void;
    setLogVisible: (visible: boolean) => void;
    setPov: (pov: 0 | 1) => void;
}

export function useGameState(replayData?: ReplayData) {
    // This mount's battle. See `newBattle`.
    const [battle, setBattle] = useState<Battle>(newBattle);
    
    // Core state
    const [battleLog, setBattleLog] = useState<string | null>(null);
    const [currentAction, setCurrentAction] = useState<number>(0);
    const [scene, setScene] = useState<Scene | null>(null);
    const [htmlLog, setHtmlLog] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [messageBar, setMessageBar] = useState<string[]>([]);
    const [battleComplete, setBattleComplete] = useState(false);
    
    // UI state
    const [turnInput, setTurnInput] = useState<number>(0);
    const [newTurn, setNewTurn] = useState<number>(0);
    const [settingTurn, setSettingTurn] = useState(false);
    const [lastTurn, setLastTurn] = useState<number>(0);
    const [simulatedAttack, setSimulatedAttack] = useState<string>('contactattack');
    // The log rail is OPEN by default: the replay player wears the same shell
    // as a live battle now (bar · field · dock · rail), and that shell reserves
    // the rail's column whether or not anything is in it.
    const [logVisible, setLogVisible] = useState(true);
    const [pov, setPov] = useState<0 | 1>(0);
    
    // Initialize battle data
    useEffect(() => {
        if(replayData) {
            setBattleLog(replayData.replay);
            return;
        }
        
        
        // The demo replay shown when no replay was supplied. It lives in THIS
        // tool's asset tree (copied there by build-battlesim-assets) rather than
        // under smartrotom/: it has to be in the battlesim pack, or the demo is
        // the one thing that does not work offline.
        fetch(battlesimAssetUrl('samples/demo-replay.txt'))
        .then(response => response.ok ? response.text() : Promise.reject(new Error(String(response.status))))
        .then(text => {
            setBattleLog(text);
        })
        .catch(() => {
            // No demo available (pack not installed yet, or offline on first
            // run). An empty log renders the empty state, which is correct —
            // an unhandled rejection here used to surface as a console error.
            setBattleLog('');
        })
    }, [replayData]);
    
    // Called by BattleCanvas ref callback when the #game element mounts
    const initScene = (gameElement: HTMLElement) => {
        if (!scene && gameElement) {
            const battleScene = new Scene(battle, gameElement);
            setScene(battleScene);
        }
    };
    
    // Load initial game data
    useEffect(() => {
        if (battleLog) {
            loadGameData();
        }
    }, [battleLog]);
    
    const loadGameData = () => {
        const lines = battleLog ? battleLog.split('\n') : [];
        let started = false;
        let finalTurn = 0;
        
        for (const line of lines) {
            const {args, kwArgs} = Protocol.parseBattleLine(line);
            if(line.includes('|start')) started = true;
            if(!started) battle.add(line);
            if(line.includes('|turn|')) finalTurn++;
        }
        
        setLastTurn(finalTurn);
    };
    
    const setCurrentTurn = (turn?: number) => {
        if(turn === undefined) turn = turnInput;
        setNewTurn(turn);
        setBattleComplete(false);
        if(isPlaying) {
            setSettingTurn(true);
        } else {
            setCurrentAction(-1);
        }
    };
    
    const loadScene = () => {
        const observer = new MutationObserver((mutations, obs) => {
            const gameElement = document.getElementById('game') as HTMLElement;
            if (gameElement) {
                const battleScene = new Scene(battle, gameElement);
                setScene(battleScene);
                obs.disconnect();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    return {
        // Core state
        battle,
        setBattle,
        battleLog,
        currentAction,
        scene,
        htmlLog,
        isPlaying,
        messageBar,
        battleComplete,
        
        // UI state
        turnInput,
        newTurn,
        settingTurn,
        lastTurn,
        simulatedAttack,
        logVisible,
        pov,
        
        // State setters
        setBattleLog,
        setCurrentAction,
        setScene,
        setHtmlLog,
        setIsPlaying,
        setMessageBar,
        setBattleComplete,
        setTurnInput,
        setNewTurn,
        setSettingTurn,
        setLastTurn,
        setSimulatedAttack,
        setLogVisible,
        setPov,
        setCurrentTurn,
        initScene,
    };
}