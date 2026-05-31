import { useEffect, useState, useRef, useCallback } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { Scene } from '../_utils/Scene';
import { ReplayData } from '../types';
import { ReplayTimeline, parseReplayTimeline } from '../_utils/replayTimeline';

const createFreshBattle = () => new Battle(new Generations(Dex as any) as any);

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
    // Instance-scoped battle state (no module-level store leakage)
    const battleRef = useRef<Battle>(createFreshBattle());
    const [battle, setBattleState] = useState<Battle>(battleRef.current);
    
    const setBattle = useCallback((newBattle: Battle) => {
        battleRef.current = newBattle;
        setBattleState(newBattle);
    }, []);
    
    // Core state
    const [battleLog, setBattleLog] = useState<string | null>(null);
    const [currentAction, setCurrentAction] = useState<number>(0);
    const [scene, setScene] = useState<Scene | null>(null);
    const [htmlLog, setHtmlLog] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [messageBar, setMessageBar] = useState<string[]>([]);
    
    // UI state
    const [turnInput, setTurnInput] = useState<number>(0);
    const [newTurn, setNewTurn] = useState<number>(0);
    const [settingTurn, setSettingTurn] = useState(false);
    const [lastTurn, setLastTurn] = useState<number>(0);
    const [simulatedAttack, setSimulatedAttack] = useState<string>('contactattack');
    const [logVisible, setLogVisible] = useState(false);
    const [pov, setPov] = useState<0 | 1>(0);
    const [timeline, setTimeline] = useState<ReplayTimeline | null>(null);
    
    // Refs for cleanup
    const observerRef = useRef<MutationObserver | null>(null);
    
    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, []);
    
    // Initialize battle data
    useEffect(() => {
        if(replayData) {
            setBattleLog(replayData.replay);
            loadScene();
            return;
        }
    }, [replayData]);
    
    // Load initial game data and parse timeline
    useEffect(() => {
        if (battleLog) {
            loadGameData();
            const parsed = parseReplayTimeline(battleLog);
            setTimeline(parsed);
            setLastTurn(parsed.lastTurn);
        }
    }, [battleLog]);
    
    const loadGameData = () => {
        const lines = battleLog ? battleLog.split('\n') : [];
        let started = false;
        
        for (const line of lines) {
            if(line.includes('|start')) started = true;
            if(!started) battle.add(line);
        }
    };
    
    const setCurrentTurn = (turn?: number) => {
        if(turn === undefined) turn = turnInput;
        setNewTurn(turn);
        if(isPlaying) {
            setSettingTurn(true);
        } else {
            setCurrentAction(-1);
        }
    };
    
    const loadScene = () => {
        // Disconnect any previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const gameElement = document.getElementById('game') as HTMLElement;
            if (gameElement) {
                const battleScene = new Scene(battle, gameElement);
                setScene(battleScene);
                obs.disconnect();
                observerRef.current = null;
            }
        });
        
        observerRef.current = observer;
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    function countActions(): number {
        return timeline ? timeline.events.length : 0;
    }
    
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
        timeline,
        
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
        setTurnInput,
        setNewTurn,
        setSettingTurn,
        setLastTurn,
        setSimulatedAttack,
        setLogVisible,
        setPov,
        setCurrentTurn,
        countActions
    };
}