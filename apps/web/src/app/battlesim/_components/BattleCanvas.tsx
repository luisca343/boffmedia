"use client"
import { Battle, Pokemon, Side } from "@pkmn/client";
import { Loading } from "@/components/smartrotom/Loading";
import { forwardRef, useCallback, useRef, memo } from "react";
import { positionsP1, positionsP2, ASPECT_RATIO, getScaleMultiplier } from "../_utils/viewUtils";
import { PokemonElement, PokemonRefType } from "./PokemonElement";
import { Avatar } from "./Avatar";
import { PokemonTeam } from "./PokemonTeam";
import { Hazard } from "./Hazard";
import { PokemonIdent } from "@pkmn/protocol";
import useViewportWidth from "@/services/useViewPortWidth";
import BattlePreview from "./BattlePreview";
import BattleEndScreen from "./BattleEndScreen";
import { sanitizeHtml } from "../_utils/sanitizeHtml";
import { getParticipantName } from "../_utils/replayUtils";
import { BSXPlate } from "@/components/boffmedia/primitives";
import { toBSXMon } from "../_utils/toBSXMon";
import type { ReactNode } from "react";

export type BattleCanvasRefProps = {
  bounceAll: () => void;
  animateMove: (
    attacker: PokemonIdent,
    moveName: string,
    defender: PokemonIdent
  ) => void;
};

export const BattleCanvas = memo(forwardRef(({ 
    battle, 
    pov, 
    messageBar, 
    showPreviewOverlay, 
    setBattleStarted, 
    setIsPlaying, 
    currentAction, 
    battleLog,
    showFullInfo = false,
    initScene,
    liveMode = false,
    liveStatus,
    onPlayAgain,
    battleComplete = false,
    username,
    choicePanel,
}: {
    battle: Battle,
    pov: 0 | 1 | any,
    messageBar?: string[],
    showPreviewOverlay: boolean,
    setBattleStarted: (started: boolean) => void,
    setIsPlaying: (playing: boolean) => void,
    currentAction: number,
    battleLog: string | null,
    showFullInfo?: boolean,
    initScene?: (gameElement: HTMLElement) => void,
    liveMode?: boolean,
    liveStatus?: 'idle' | 'connecting' | 'active' | 'finished' | 'error',
    onPlayAgain?: () => void,
    battleComplete?: boolean,
    username?: string | null,
    choicePanel?: ReactNode,
}, ref: React.Ref<BattleCanvasRefProps>) => {
    const pokemonRefs = useRef<{ [key: string]: PokemonRefType }>({});
    const [, canvasWidth] = useViewportWidth();

    const gameRefCallback = useCallback((node: HTMLElement | null) => {
        if (node && initScene) {
            initScene(node);
        }
    }, [initScene]);

    const p1 = pov === 0 ? battle.p1 : battle.p2;
    const p2 = pov === 0 ? battle.p2 : battle.p1;

    const pokemon = {
        p1a: p1.active[0], p1b: p1.active[1], p1c: p1.active[2], p1d: p1.active[3], p1e: p1.active[4],
        p2a: p2.active[0], p2b: p2.active[1], p2c: p2.active[2], p2d: p2.active[3], p2e: p2.active[4]
    } as {[key: string]: Pokemon};
    
    if(liveMode && liveStatus === 'connecting') {
        return (
            <div className="flex flex-col items-center justify-center gap-3" style={{ width: canvasWidth, height: canvasWidth * ASPECT_RATIO, backgroundImage: 'url(/battlesim/fx/bg/hagane.png)', backgroundSize: '100% 100%' }}>
                <Loading />
                <span className="text-surface-200 text-sm">Waiting for battle...</span>
            </div>
        )
    }
    if(!liveMode && !battle.pokemonControlled && !battleLog) return <Loading/>

    return (
        <div  id="game" ref={gameRefCallback} className="flex overflow-hidden relative select-none" style={{
            backgroundImage: 'url(/battlesim/fx/bg/hagane.png)', 
            backgroundSize: `100% 100%`, width: canvasWidth, height: canvasWidth * ASPECT_RATIO }}>        
                  
                  {/* Preview overlay only shows when needed */}
                  {!liveMode && showPreviewOverlay && (
                    <div className="absolute inset-0">
                      <BattlePreview 
                        battle={battle} 
                        pov={pov}
                        onStartBattle={() => {
                          setBattleStarted(true);
                          setIsPlaying(true);
                        }}
                      />
                    </div>
                  )}

                  {!liveMode && battleComplete && (
                    <div className="absolute inset-0">
                      <BattleEndScreen
                        battle={battle}
                        pov={pov}
                        username={username}
                        onRestart={
                            () => {
                                setBattleStarted(false);
                                setIsPlaying(false);
                            }
                        }
                      />
                    </div>
                  )}

                  {liveMode && battleComplete && (
                    <div className="absolute inset-0">
                      <BattleEndScreen
                        battle={battle}
                        pov={pov}
                        username={username}
                        onRestart={onPlayAgain}
                      />
                    </div>
                  )}
                  
                  
            <div className="h-[20%] lg:h-[15%] xl:h-[13%] w-full absolute top-0 flex justify-between z-10">
            <div className="m-1 w-1/3 flex items-center h-fit">
                    <div className="w-fit h-8 bg-surface-800 bg-opacity-90 py-1 px-2 rounded-md text-surface-200 z-50">
                        Turno {battle.turn}
                    </div>
                    <span className="text-surface-50 font-bold text-shadow-border1 ml-2">
                        {getParticipantName(p1.name)} vs {getParticipantName(p2.name)}
                    </span>
                    </div>
                <div className="m-1 w-2/3 flex flex-row-reverse items-start gap-1">
                    <PokemonTeam side={p2}/>
                    {positionsP2.map((position, index) => {
                        const mon = toBSXMon(pokemon[position]);
                        return mon && <div key={position} className="flex-1 max-w-[260px] shrink min-w-0"><BSXPlate mon={mon} foe slotTag="2" /></div>;
                    })}
                </div>
            </div>

                
            <div className="h-[20%] md:h-[18%] lg:h-[15%]  w-full absolute bottom-0 flex">
                <div className="m-1 w-2/3 flex flex-row items-start gap-1">
                    <PokemonTeam side={p1}/>
                    {positionsP1.map((position, index) => {
                        const mon = toBSXMon(pokemon[position]);
                        return mon && <div key={position} className="flex-1 max-w-[260px] shrink min-w-0"><BSXPlate mon={mon} active slotTag="1" /></div>;
                    })}
                </div>
                <div className="m-1 w-1/3 flex">
                {/* messageBar commented out — move panel now occupies bottom-right
                {
                    messageBar && messageBar.length > 0 && <div className="w-1/3 h-fit m-1 flex-1 bg-surface-800 bg-opacity-90 py-1 px-2 rounded-md text-surface-200 z-50 absolute right-0 bottom-0">
                        {messageBar.map((message, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(message) }}></div>
                        ))}
                    </div>
                }
                */}
                </div>
            </div>
            <Avatar side={p1} pov={pov}/>
            <Avatar side={p2} pov={pov}/>
            
            {positionsP1.map((position, index) => (
            <PokemonElement
                key={position}
                battle={battle}
                pokemon={pokemon[position]}
                ref={(el: PokemonRefType | null) => { if (el) pokemonRefs.current[position] = el; }}
                side={battle.p1}
                position={position}
                showFullInfo={showFullInfo}
            />
        ))}

            {Object.entries(battle.p1.sideConditions).map((entry) => {
                return <Hazard key={entry[0]} hazard={entry} side="p1" />
            })}

        {positionsP2.map((position, index) => (
                <PokemonElement
                    key={position}
                    battle={battle}
                    pokemon={pokemon[position]}
                    ref={(el: PokemonRefType | null) => { if (el) pokemonRefs.current[position] = el; }}
                    side={battle.p2}
                    position={position}
                    showFullInfo={showFullInfo}
                />
            ))}
            <div id='overlay' className="absolute w-full h-full pointer-events-none">
                <div className="absolute top-16 left-0 text-surface-50 text-shadow-border1 z-20 ml-2">
                    {battle.sides.map((side) => {
                        return Object.values(side.sideConditions).map((value) => {
                            return <div key={`condition-${side.name}-${value.name}`}>{side.name}: {value.name} {value.minDuration} {value.maxDuration > 0 && `- ${value.maxDuration}`} turns</div>
                        })
                    })}
                </div>
                <div className={`weather w-full h-full absolute top-0 left-0 ${battle.field.terrainState.id}`}></div>

                {battle.field.pseudoWeather['trickroom'] && (
                    <div className={`weather w-full h-full absolute top-0 left-0 `} style={{
                        backgroundImage: 'url(/battlesim/fx/trickroom.png)',
                        backgroundSize: '100% 100%',
                        opacity: 0.6,
                        zIndex: 5,
                    }}>
                    </div>
                )}
                <div className={`weather w-full h-full absolute top-0 left-0 `} style={{
                    backgroundImage: 'url(/battlesim/fx/bg/hagane_overlay.png)',
                    backgroundSize: '100% 100%',
                    zIndex: 1,
                }}>
                </div>
            </div>

            {choicePanel && (
              <div
                className="absolute bottom-2 right-2 z-30 pointer-events-auto rounded-[var(--radius)]"
                style={{
                  maxWidth: 'min(540px, calc(100% - 16px))',
                  maxHeight: 'calc(100% - 16px)',
                  overflowY: 'auto',
                  background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid var(--border)',
                  padding: '10px',
                }}
              >
                {choicePanel}
              </div>
            )}
        </div>
    )
}))

BattleCanvas.displayName = "BattleCanvas";