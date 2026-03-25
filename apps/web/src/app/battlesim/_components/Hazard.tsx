import Image from "next/image";
import { getScaleMultiplier } from "../_utils/viewUtils";

    
    export function Hazard({hazard, side}: {hazard: [string, {name: string, level: number, minDuration: number, maxDuration: number, remove?: boolean}], side: string}) {
        const [name, value] = hazard;
    
        // Create an array of levels from the current level down to 1
        const levels = Array.from({ length: value.level }, (_, i) => value.level - i);
        if(name === 'default') return <></>

    


        const hazards = ["stickyweb", "toxicspikes", "spikes", "stealthrock"];

        const hazardOffsets: {[key: string]: {[key: string]: {top: number; left: number, width: number, z?: number}}} = {
            p1: {
                stickyweb1: {top: 250 * getScaleMultiplier(), left: 420 * getScaleMultiplier(), width: 100},
                toxicspikes1: {top: 250 * getScaleMultiplier(), left: 420 * getScaleMultiplier(), width: 50},
                toxicspikes2: {top: 270 * getScaleMultiplier(), left: 520 * getScaleMultiplier(), width: 50},
                spikes1: {top: 300 * getScaleMultiplier(), left: 470 * getScaleMultiplier(), width: 50},
                spikes2: {top: 280 * getScaleMultiplier(), left: 400 * getScaleMultiplier(), width: 50},
                spikes3: {top: 250 * getScaleMultiplier(), left: 480 * getScaleMultiplier(), width: 50},
                stealthrock1: {top: 280 * getScaleMultiplier(), left: 350 * getScaleMultiplier(), width: 50},
                stealthrock2: {top: 295 * getScaleMultiplier(), left: 520 * getScaleMultiplier(), width: 50},
                default: {top: 0, left: 0, width: 50}
            },
            p2: {
                stickyweb1: {top: 110 * getScaleMultiplier(), left: 560 * getScaleMultiplier(), width: 75  * getScaleMultiplier()},
                toxicspikes1: {top: 150 * getScaleMultiplier(), left: 520 * getScaleMultiplier(), width: 30  * getScaleMultiplier()},
                toxicspikes2: {top: 160 * getScaleMultiplier(), left: 620 * getScaleMultiplier(), width: 30  * getScaleMultiplier()},
                stealthrock1: {top: 160, left: 600, width: 30},
                stealthrock2: {top: 140, left: 540, width: 30},
                spikes1: {top: 160, left: 570, width: 30},
                spikes2: {top: 160, left: 540, width: 30},
                spikes3: {top: 140, left: 620, width: 30},
                default: {top: 0, left: 0, width: 50, z: 1}
            }
        }
        


        return (
            <>
                {levels.map(level => {
                    const hazardName = name + level;
                    const offset = hazardOffsets[side][hazardName] || hazardOffsets[side].default;
                    return (
                        <Image
                            key={level}
                            src={`/battlesim/fx/${name}.png`}
                            alt={name}
                            width={offset.width}
                            height={offset.width}
                            className={`z-[${1 + (offset.z || 0)}] opacity-80`}
                            style={{ top: offset.top, left: offset.left, position: 'absolute'}}
                        />
                    );
                })}
            </>
        );
    }