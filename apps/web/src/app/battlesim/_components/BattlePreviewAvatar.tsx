"use client"
import { Sprites } from "@pkmn/img";
import { Side } from "@pkmn/client";
import NpcSkin from "@/components/smartrotom/MinecraftSkin";

export function BattlePreviewAvatar({ 
  side, 
  pov, 
  className = "",
  size = "medium" 
}: { 
  side: Side, 
  pov: 0 | 1,
  className?: string,
  size?: "small" | "medium" | "large"
}) {
  
  const povCentered = pov === 0;
  const player = side;
  const avatarId = player?.avatar || 'unknown';
  const uuid = player.name.includes('player:') ? player.name.split(':')[1] : null;
  const avatar = player.name.includes('npc:') ? player.name.split(':')[1] : Sprites.getAvatar(avatarId);

  // Size mappings converted to dimensions rather than classes
  const sizeMap = {
    small: {
      width: 80,
      height: 80,
      scale: povCentered ? 1.2 : 0.8,
    },
    medium: {
      width: 128,
      height: 128,
      scale: povCentered ? 1.5 : 1,
    },
    large: {
      width: 192,
      height: 192,
      scale: 2,
    }
  };

  const selectedSize = sizeMap[size];

  // Container style - common for all avatar types
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: selectedSize.width,
    height: selectedSize.height,
    margin: '0 auto'
  };

  // Minecraft skin style
  const minecraftSkinStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transform: `scale(${selectedSize.scale}) scaleX(${povCentered ? 1 : -1})`,
    objectFit: 'contain'
  };
  
  // Standard avatar style
  const avatarImageStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transform: `scale(${selectedSize.scale}) scaleX(${povCentered ? -1 : 1})`,
    objectFit: 'contain',
    imageRendering: 'pixelated'
  };

  // NPC style
  const npcStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transform: `scale(${selectedSize.scale}) scaleX(${povCentered ? -1 : 1}) translateY(-${selectedSize.height / 5}px)`,
    objectFit: 'contain'
  };

  return (
    <div className={className} style={containerStyles}>
      {uuid !== null ? (
        // Minecraft skin for player
        <div style={minecraftSkinStyles}>
          <img
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
            alt={`${player.name} avatar`}
            src={`https://crafatar.com/renders/body/${uuid}`}
          />
        </div>
      ) : !player.name.includes('npc:') ? (
        // Standard avatar image
        <img
          style={avatarImageStyles}
          src={avatar || "/placeholder.svg"}
          alt={`${player.name} avatar`}
        />
      ) : (
        // NPC skin
        <div style={npcStyles}>
          <NpcSkin
            npcName={avatar}
          />
        </div>
      )}
    </div>
  );
}

export default BattlePreviewAvatar;