import { battlesimAssetUrl } from '../asset';
import { useBattleScale } from '../lib/battle-layout';

type HazardOffset = { top: number; left: number; width: number; z?: number };

// Field-space (960 wide) positions. Every entry is scaled at render time; the
// p2 stealth-rock and spikes rows used to forget the multiplier and sat at
// desktop pixels on a phone-sized canvas.
const HAZARD_OFFSETS: { [side: string]: { [key: string]: HazardOffset } } = {
    p1: {
        stickyweb1: { top: 250, left: 420, width: 100 },
        toxicspikes1: { top: 250, left: 420, width: 50 },
        toxicspikes2: { top: 270, left: 520, width: 50 },
        spikes1: { top: 300, left: 470, width: 50 },
        spikes2: { top: 280, left: 400, width: 50 },
        spikes3: { top: 250, left: 480, width: 50 },
        stealthrock1: { top: 280, left: 350, width: 50 },
        stealthrock2: { top: 295, left: 520, width: 50 },
        default: { top: 0, left: 0, width: 50 },
    },
    p2: {
        stickyweb1: { top: 110, left: 560, width: 75 },
        toxicspikes1: { top: 150, left: 520, width: 30 },
        toxicspikes2: { top: 160, left: 620, width: 30 },
        stealthrock1: { top: 160, left: 600, width: 30 },
        stealthrock2: { top: 140, left: 540, width: 30 },
        spikes1: { top: 160, left: 570, width: 30 },
        spikes2: { top: 160, left: 540, width: 30 },
        spikes3: { top: 140, left: 620, width: 30 },
        default: { top: 0, left: 0, width: 50, z: 1 },
    },
};

export function Hazard({ hazard, side }: { hazard: [string, { name: string, level: number, minDuration: number, maxDuration: number, remove?: boolean }], side: string }) {
    const { scale } = useBattleScale();
    const [name, value] = hazard;
    if (name === 'default') return <></>;

    // Create an array of levels from the current level down to 1
    const levels = Array.from({ length: value.level }, (_, i) => value.level - i);

    return (
        <>
            {levels.map(level => {
                const hazardName = name + level;
                const offset = HAZARD_OFFSETS[side]?.[hazardName] || HAZARD_OFFSETS[side]?.default || HAZARD_OFFSETS.p1.default;
                const size = offset.width * scale;
                return (
                    <img key={level}
                        src={battlesimAssetUrl('fx' + '/' + `${name}.png`)}
                        alt={name}
                        width={size}
                        height={size}
                        className="pointer-events-none absolute opacity-80"
                        style={{ top: offset.top * scale, left: offset.left * scale, zIndex: 1 + (offset.z || 0) }}
                    />
                );
            })}
        </>
    );
}
