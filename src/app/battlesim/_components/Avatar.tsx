import { Sprites } from "@pkmn/img";
import { getScaleMultiplier } from "../_utils/viewUtils";
import {  Side } from "@pkmn/client";
import NpcSkin from "@/components/smartrotom/MinecraftSkin";

export function Avatar({ side, pov} : { side: Side, pov: 0 | 1}) {
    const povCentered = pov === side.n
    const player = side
    const avatarId = player?.avatar || 'unknown';
    const uuid = player.avatar.includes('-') ? player.avatar : null;
    const avatar = Sprites.getAvatar(avatarId);
    const avatarNumber = parseInt(avatarId);

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${povCentered ? 307 * getScaleMultiplier() : 98 * getScaleMultiplier()}px`,
        left: `${povCentered ? 150 * getScaleMultiplier() : 645 * getScaleMultiplier()}px`,
        width: `${povCentered ? getScaleMultiplier() * 45 : getScaleMultiplier() * 25}px`,
        height: `${povCentered ? getScaleMultiplier() * 100 : getScaleMultiplier() * 50}px`,
        transform: `scaleX(${povCentered ? 1.2 : -.8}) scaleY(${povCentered ? 1.2 : .8})`,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
    };
    
    const npcStyles: React.CSSProperties = {
        position:'absolute',
        top: `${povCentered ? 307 * getScaleMultiplier() : 102 * getScaleMultiplier()}px`,
        left: `${povCentered ? 150 * getScaleMultiplier() : 645 * getScaleMultiplier()}px`,
        width: `${povCentered ? getScaleMultiplier() * 45 : getScaleMultiplier() * 25}px`,
        height: `${povCentered ? getScaleMultiplier() * 100 : getScaleMultiplier() * 50}px`,
        transform: `scaleX(${povCentered ? 2 : -1}) scaleY(${povCentered ? 2 : 1})`,
        margin: 'auto',
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
        
    };

    const avatarStyles: React.CSSProperties = {
        position:'absolute',
        top: `${povCentered ? 240 * getScaleMultiplier() : 102 * getScaleMultiplier()}px`,
        left: `${povCentered ? 75 * getScaleMultiplier() : 640 * getScaleMultiplier()}px`,
        width: `${getScaleMultiplier() * (povCentered ? 175 : 40)}px`,
        height: `${getScaleMultiplier() * (povCentered ? 175 : 40)}px`,
        transform: povCentered ? 'scale(1) scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 10 : 5,
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

