import { Sprites } from "@pkmn/img";
import { getScaleMultiplier } from "../_utils/viewUtils";
import { Battle } from "@pkmn/client";
import NpcSkin from "@/components/smartrotom/MinecraftSkin";





export function Avatar({ battle, side, pov, style } : { battle: Battle, side: 'p1' | 'p2', pov: 0 | 1 , style?: React.CSSProperties}) {
    const povCentered = side === 'p1' && pov === 0 || side === 'p2' && pov === 1;

    const player = battle[side];
    const avatarId = player?.avatar || 'unknown';
    const uuid = player.avatar.includes('-') ? player.avatar : null;
    const avatar = Sprites.getAvatar(avatarId);
    const avatarNumber = parseInt(avatarId);


    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${307 * getScaleMultiplier()}px`,
        left: `${150 * getScaleMultiplier()}px`,
        width: `${getScaleMultiplier() * 45}px`,
        height: `${getScaleMultiplier() * 100}px`,
        transform: `scaleX(${povCentered ? 1.2 : -1}) scaleY(${povCentered ? 1.2 : 1})`,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
    };
    
    const npcStyles: React.CSSProperties = {
        position:'absolute',
        top: `${102 * getScaleMultiplier()}px`,
        left: `${645 * getScaleMultiplier()}px`,
        width: `${getScaleMultiplier() * 25}px`,
        height: `${getScaleMultiplier() * 50}px`,
        transform: `scaleX(${povCentered ? 1 : -1}) scaleY(${povCentered ? 1 : 1})`,
        margin: 'auto',
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
        
    };

    const avatarStyles: React.CSSProperties = {
        position:'absolute',
        top: `${povCentered ? 230 * getScaleMultiplier() : 94 * getScaleMultiplier()}px`,
        left: `${povCentered ? 90 * getScaleMultiplier() : 630 * getScaleMultiplier()}px`,
        width: `${getScaleMultiplier() * (povCentered ? 175 : 50)}px`,
        height: `${getScaleMultiplier() * (povCentered ? 175 : 50)}px`,
        transform: povCentered ? 'scale(1) scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
    };

    return (
        <>
            {uuid !== null ? (
                <img
                    className="mx-auto"
                    alt="avatar"
                    style={baseStyles}
                    src={`https://crafatar.com/renders/body/${uuid}`}
                />
            ) : avatarNumber >= 0 ? (
                <img
                    className="mx-auto"
                    style={avatarStyles}
                    src={avatar}
                    alt="avatar"
                />
            ) : (
                <NpcSkin
                    npcName={avatarId}
                    height={50}
                    width={50}
                    style={npcStyles}
                />
            )}
        </>
    );
}