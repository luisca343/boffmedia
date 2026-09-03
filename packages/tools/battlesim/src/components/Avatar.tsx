import { useToolT, BATTLESIM_NS } from '../i18n';
import { Sprites } from "@pkmn/img";
import { avatarUrl, handleSpriteError } from "../sprites";
import { Side } from "@pkmn/client";
import { useBattleScale } from '../lib/battle-layout';

export function Avatar({ side, pov }: { side: Side, pov: 0 | 1 }) {
    const t = useToolT(`${BATTLESIM_NS}.avatar`)
    const { scale: s } = useBattleScale();
    const povCentered = pov === side.n
    const player = side
    const avatarId = player?.avatar || 'unknown';
    const uuid = player.name.includes('player:') ? player.name.split(':')[1] : null;
    const avatar = player.name.includes('npc:') ? player.name.split(':')[1] : Sprites.getAvatar(avatarId);

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${povCentered ? 307 * s : 98 * s}px`,
        left: `${povCentered ? 150 * s : 645 * s}px`,
        width: `${povCentered ? s * 45 : s * 25}px`,
        height: `${povCentered ? s * 100 : s * 50}px`,
        transform: `scaleX(${povCentered ? 1.2 : -.8}) scaleY(${povCentered ? 1.2 : .8})`,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
    };

    const npcStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${povCentered ? 307 * s : 102 * s}px`,
        left: `${povCentered ? 150 * s : 645 * s}px`,
        width: `${povCentered ? s * 45 : s * 25}px`,
        height: `${povCentered ? s * 100 : s * 50}px`,
        transform: `scaleX(${povCentered ? 2 : -1}) scaleY(${povCentered ? 2 : 1})`,
        margin: 'auto',
        imageRendering: 'pixelated',
        zIndex: povCentered ? 100 : 5,
    };

    const avatarStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${povCentered ? 240 * s : 102 * s}px`,
        left: `${povCentered ? 75 * s : 640 * s}px`,
        width: `${s * (povCentered ? 175 : 40)}px`,
        height: `${s * (povCentered ? 175 : 40)}px`,
        transform: povCentered ? 'scale(1) scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
        zIndex: povCentered ? 10 : 5,
    };

    return (
        <>
            {uuid !== null ? (
                <img className="mx-auto" alt={t("alt")} style={baseStyles} src={`https://api.mineatar.io/body/full${uuid}`} />
            ) : !player.name.includes('npc:') ? (
                <img className="mx-auto" style={avatarStyles} src={avatar} alt={t("alt")} />
            ) : (
                <img alt={t("alt")} style={npcStyles} src={avatarUrl(avatar)} onError={handleSpriteError} />
            )}
        </>
    );
}
