import { useEffect, useState } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { create } from 'zustand';
import { Protocol } from '@pkmn/protocol';
import { Scene } from '../_utils/Scene';

// Battle Store Types and Implementation
interface BattleStore {
    battle: Battle;
    setBattle: (battle: Battle) => void;
}

const useBattleStore = create<BattleStore>((set) => ({
    battle: new Battle(new Generations(Dex as any)),
    setBattle: (battle: Battle) => set({ battle }),
}));

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

export function useGameState(replayData?: any) {
    // Battle state from store
    const battle = useBattleStore((state) => state.battle);
    const setBattle = useBattleStore((state) => state.setBattle);
    
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
    
    // Initialize battle data
    useEffect(() => {
        if(replayData) {
            setBattleLog(replayData.replay);
            loadScene();
            return;
        }
        
        fetch(`https://api.boffmedia.es/smartrotom/combates/booststera.txt`)
        .then(response => response.text())
        .then(text => {
            setBattleLog(text);
            loadScene();
        })
        .catch(error => console.error("Error fetching battle log:", error));
    }, [replayData]);
    
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
        setCurrentTurn
    };
}