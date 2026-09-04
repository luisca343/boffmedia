import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { PokemonIdent, Protocol } from "@pkmn/protocol";
import { Scene } from "./engine/Scene";
import { BattleEventProcessor, ProcessedBattleEvent } from "./engine/BattleEventProcessor";
import { BattleStateBuilder } from "./engine/BattleStateBuilder";
import { getReplaySpeed } from "./engine/replaySpeed";
import type { BattleAudioState } from "./engine/BattleAudio";
import { useBattleAudioState } from "./lib/BattleAudioProvider";

export interface UseBattleFlowOptions {
  liveMode?: boolean;
  onRequest?: (request: Protocol.Request) => void;
  onBattleEnd?: (winner: string) => void;
  isWaitingForChoice?: boolean;
  setIsWaitingForChoice?: (waiting: boolean) => void;
}

export function useBattleFlow(
  battle: Battle,
  setBattle: (battle: Battle) => void,
  battleLog: string | null,
  currentAction: number,
  scene: Scene | null,
  isPlaying: boolean,
  newTurn: number,
  lastTurn: number,
  settingTurn: boolean,
  pov: 0 | 1,
  setCurrentAction: (action: number) => void,
  setHtmlLog: React.Dispatch<React.SetStateAction<string[]>>,
  setIsPlaying: (playing: boolean) => void,
  setMessageBar: React.Dispatch<React.SetStateAction<string[]>>,
  setSettingTurn: (setting: boolean) => void,
  setBattleComplete?: (complete: boolean) => void,
  options?: UseBattleFlowOptions
) {
  const liveMode = options?.liveMode ?? false;
  const onRequest = options?.onRequest;
  const onBattleEnd = options?.onBattleEnd;
  const isWaitingForChoice = options?.isWaitingForChoice ?? false;
  const setIsWaitingForChoice = options?.setIsWaitingForChoice;

  // `useBattleAudioState` reads a context WITH a default, so it cannot throw —
  // the try/catch that used to wrap it was dead, and wrapping a hook in one is
  // a conditional-hook trap waiting for the day the context loses its default.
  const audioState: BattleAudioState | undefined = useBattleAudioState();

  const processorRef = useRef<BattleEventProcessor | null>(null);
  if (scene && (!processorRef.current || processorRef.current.context.scene !== scene || processorRef.current.context.battle !== battle)) {
    processorRef.current = new BattleEventProcessor({ scene, battle, pov, audioState });
  } else if (processorRef.current && audioState !== processorRef.current.context.audioState) {
    // Update audio state if it changes
    processorRef.current.context.audioState = audioState;
  }

  /**
   * Which playback run an in-flight `playAction` belongs to.
   *
   * The LIVE path had a `cancelled` flag and the replay path had nothing (H7):
   * a seek left the previous line's animation mid-`await`, and when it landed
   * it wrote its html into the log and advanced `currentAction` past the turn
   * the user had just jumped to — so scrubbing produced a battle that played
   * two places at once. Every seek and every reset bumps this; an awaited step
   * that comes back to a different generation drops what it was carrying.
   */
  const generationRef = useRef(0);
  const bumpGeneration = useCallback(() => { generationRef.current += 1; }, []);

  const battleLines = useMemo(() => battleLog ? battleLog.split('\n').filter(l => l.trim()) : [], [battleLog]);

  // ─── LIVE MODE STATE ───
  const liveBufferRef = useRef<string[]>([]);
  const liveIndexRef = useRef(0);
  const liveProcessingRef = useRef(false);
  const [liveTrigger, setLiveTrigger] = useState(0);
  const liveWaitingRef = useRef(false);
  const pendingBufferRef = useRef<string[]>([]);
  const sceneRef = useRef(scene);
  const liveCallbacksRef = useRef<{ onRequest?: (req: Protocol.Request) => void; onBattleEnd?: (winner: string) => void }>({});

  // Keep refs in sync
  sceneRef.current = scene;
  liveCallbacksRef.current = {
    onRequest: options?.onRequest,
    onBattleEnd: options?.onBattleEnd,
  };

  // When scene becomes available, re-trigger processing for any buffered lines
  // that arrived before the processor was ready (e.g. turn 0 setup lines)
  useEffect(() => {
    if (liveMode && scene && liveBufferRef.current.length > liveIndexRef.current && !liveProcessingRef.current) {
      setLiveTrigger((t) => t + 1);
    }
  }, [scene, liveMode]);

  // Advance to next line — called after each line is fully processed
  const bumpLiveIndex = useCallback(() => {
    liveIndexRef.current++;
    setLiveTrigger((t) => t + 1);
  }, []);

  // Cache: turn number → line index (O(1) seeking instead of O(n) scan)
  const turnIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    for (let i = 0; i < battleLines.length; i++) {
      const line = battleLines[i];
      if (line.includes('|turn|')) {
        const match = line.match(/\|turn\|(\d+)/);
        if (match) {
          map.set(parseInt(match[1]), i);
        }
      }
    }
    return map;
  }, [battleLines]);

  const clearActions = ['switch', 'move', 'turn'];

  // ─── LIVE MODE: useEffect-driven one-line-per-render cycle ───
  // Mirrors replay mode's useEffect([currentAction]) pattern exactly.
  // Uses a ref for the index to prevent React batching from skipping lines.

  useEffect(() => {
    if (!liveMode) return;
    if (liveWaitingRef.current) return;

    const idx = liveIndexRef.current;
    if (idx >= liveBufferRef.current.length) return;

    const line = liveBufferRef.current[idx];
    if (!line?.trim()) {
      bumpLiveIndex();
      return;
    }

    const { args, kwArgs } = Protocol.parseBattleLine(line);

    // Check for request — pause and notify
    if (args[0] === 'request') {
      try {
        const request = JSON.parse(args[1] as string) as Protocol.Request;
        liveWaitingRef.current = true;
        setIsWaitingForChoice?.(true);
        liveCallbacksRef.current.onRequest?.(request);
      } catch (e) {
        // A malformed request must not park the queue on a prompt that will
        // never come: skip it and keep going, loudly.
        console.warn('[battlesim] malformed |request| JSON in replay flow', line, e);
        bumpLiveIndex();
      }
      return;
    }

    // Process the line through the shared BattleEventProcessor
    // Canonical order: parse → format → payload → battle.add → pre-anim → log → post-anim → timeout
    let cancelled = false;
    (async () => {
      liveProcessingRef.current = true;
      const processor = processorRef.current;
      if (!processor || cancelled) { liveProcessingRef.current = false; return; }

      let event: ProcessedBattleEvent;
      try {
        event = await processor.processLine(line);
      } catch (e) {
        console.warn('[battlesim] processLine failed', line, e);
        if (!cancelled) liveProcessingRef.current = false;
        if (!cancelled) bumpLiveIndex();
        return;
      }

      if (cancelled) return;
      updateBattleLog(event.html, battle, event.type);

      if (event.type === 'win' || event.type === 'tie') {
        const timeout = await processor.runAnimation(event);
        await new Promise<void>(resolve => setTimeout(resolve, timeout / getReplaySpeed()));
        if (cancelled) return;
        setBattleComplete?.(true);
        liveCallbacksRef.current.onBattleEnd?.(event.args[1] as string);
        liveProcessingRef.current = false;
        return;
      }

      const timeout = await processor.runAnimation(event);
      await new Promise<void>(resolve => setTimeout(resolve, timeout / getReplaySpeed()));

      if (cancelled) return;
      liveProcessingRef.current = false;
      bumpLiveIndex();
    })();

    return () => { cancelled = true; };
  }, [liveTrigger, liveMode]);

  // addLine: push to buffer. Only trigger effect if nothing is currently processing.
  // bumpLiveIndex will trigger after each line completes.
  const addLine = useCallback((line: string) => {
    if (liveWaitingRef.current) {
      pendingBufferRef.current.push(line);
      return;
    }
    liveBufferRef.current.push(line);
    if (!liveProcessingRef.current) {
      setLiveTrigger((t) => t + 1);
    }
  }, []);

  // resumeAfterChoice: clear waiting, move pending lines, trigger next cycle
  const resumeAfterChoice = useCallback(() => {
    liveWaitingRef.current = false;
    setIsWaitingForChoice?.(false);

    if (pendingBufferRef.current.length > 0) {
      liveBufferRef.current.push(...pendingBufferRef.current);
      pendingBufferRef.current = [];
    }

    setLiveTrigger((t) => t + 1);
  }, []);

  // ─── REPLAY MODE: existing flow control (unchanged) ───

  useEffect(() => {
    if (liveMode) return; // Skip replay logic in live mode

    if(isPlaying && currentAction !== -1) {
      if(battleLines.length === 0 || currentAction >= battleLines.length) {
        setIsPlaying(false);
        return;
      }
      const action = battleLines[currentAction];
      playAction(action);
      return;
    }
    
    if(currentAction === -1 || newTurn === -1) {
      handleTurnChange();
    }
  }, [currentAction, isPlaying, liveMode]);

  const handleTurnChange = () => {
    // Anything still awaiting an animation belongs to the turn we are leaving.
    bumpGeneration();
    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn + 1) changeTurn = lastTurn + 1;

    const builder = new BattleStateBuilder(battleLines, turnIndexMap);

    if(changeTurn === 0) {
      const result = builder.buildSetupState();
      resetBattle(result.battle, changeTurn);
      return;
    }

    const result = builder.buildStateUntilTurn(changeTurn, lastTurn);
    result.battle.setTurn(changeTurn);
    setBattle(result.battle);
    setHtmlLog(result.htmlLog);
    setCurrentAction(result.actionIndex);
    setSettingTurn(false);
    setMessageBar([]);
  };

  const resetBattle = (currBattle: Battle, turn: number) => {
    bumpGeneration();
    // Create a completely new battle instance
    const freshBattle = new Battle(new Generations(Dex as any) as any);
    
    // Set turn to 0
    freshBattle.setTurn(turn);
    
    // Reset HTML log and message bar
    setHtmlLog([]);
    setMessageBar([]);
    
    // Stop playback
    setIsPlaying(false);
    
    // Reset current action to start
    setCurrentAction(0);

    // Reset live mode buffer
    if (liveMode) {
      liveBufferRef.current = [];
      liveIndexRef.current = 0;
      setLiveTrigger(0);
    }
    
    // Clear scene if available
    const resetScene = sceneRef.current;
    if (resetScene) {
      // Clear any active Pokemon on the field
      Object.keys(freshBattle.sides).forEach(side => {
        const sideObj = freshBattle.sides[side as keyof typeof freshBattle.sides];
        if (sideObj && typeof sideObj === 'object' && 'active' in sideObj) {
          const activePokemon = sideObj.active[0];
          if (activePokemon) {
            const pokemonIdent = `${side}a:` as PokemonIdent;
            resetScene.clearPokemonElement(pokemonIdent);
          }
        }
      });
    }
    
    // Process initial setup lines from the battle log
    if (!liveMode && battleLines.length > 0) {
      let startFound = false;
      
      for (const line of battleLines) {
        // Only process lines until 'start' command is found
        if (line.includes('|start')) {
          startFound = true;
          freshBattle.add(line);
          break;
        }
        
        // Add setup commands to the fresh battle
        if (!startFound) {
          freshBattle.add(line);
        }
      }
    }
    
    // Update the battle state
    setBattle(freshBattle);
    setSettingTurn(false);
  };

  const updateBattleState = (currBattle: Battle, turn: number, actionIndex: number) => {
    currBattle.setTurn(turn);
    setBattle(currBattle);
    setCurrentAction(actionIndex);
    setSettingTurn(false);
    setMessageBar([]);
  };

  async function playAction(line: string) {
    const processor = processorRef.current;
    if (!processor) return;

    const generation = generationRef.current;
    const stale = () => generationRef.current !== generation;

    // The speed control has to reach the ANIMATIONS, not only the sleep between
    // them: dividing the sleep alone left every switch, every hit and every
    // faint running at real time, so "4x" was a replay that paused less between
    // identically-slow moves. `setAcceleration(8)` skips them outright, which is
    // what the top speed is supposed to mean.
    const speed = getReplaySpeed();
    processor.context.scene.setAcceleration(speed);

    try {
      const event = await processor.processLine(line);
      if (stale()) return;
      updateBattleLog(event.html, battle, event.type);

      const timeout = await processor.runAnimation(event);
      if (stale()) return;
      await new Promise<void>(resolve => setTimeout(resolve, timeout / speed));
      if (stale()) return;

      if (!liveMode) {
        if (event.type === 'win' || event.type === 'tie') {
          setBattleComplete?.(true);
          setIsPlaying(false);
          return;
        }
        const nextAction = settingTurn ? -1 : currentAction + 1;
        setCurrentAction(nextAction);
        if (nextAction >= battleLines.length) {
          setBattleComplete?.(true);
        }
      }
    } catch (error) {
      console.warn('[battlesim] replay step failed', line, error);
      if (!stale() && !liveMode) setCurrentAction(currentAction + 1);
    }
  }

  const updateBattleLog = (html: string, currentBattle: Battle, actionType: string) => {
    setHtmlLog((prev) => [...prev, html]);
    setBattle(currentBattle);
    
    if(clearActions.includes(actionType)) {
      setMessageBar([html]);
    } else {
      setMessageBar((prev) => [...prev, html]);
    }
  };

  return {
    handleTurnChange,
    playAction,
    /** Invalidate anything in flight (a seek from outside this hook). */
    bumpGeneration,
    updateBattleState,
    resetBattle,
    // Live mode additions
    addLine,
    resumeAfterChoice,
  };
}
