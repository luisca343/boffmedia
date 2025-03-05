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
  const povCentered = pov === side.n;
  const player = side;
  const avatarId = player?.avatar || 'unknown';
  const uuid = player.name.includes('player:') ? player.name.split(':')[1] : null;
  const avatar = player.name.includes('npc:') ? player.name.split(':')[1] : Sprites.getAvatar(avatarId);
  const avatarNumber = parseInt(avatarId);

  // Size mappings for responsive design
  const sizeMap = {
    small: {
      container: "w-20 h-20",
      transform: povCentered ? "scale(1.2) scaleX(-1)" : "scale(0.8)"
    },
    medium: {
      container: "w-28 h-28 md:w-32 md:h-32",
      transform: povCentered ? "scale(1.5) scaleX(-1)" : "scale(1)"
    },
    large: {
      container: "w-36 h-36 md:w-40 md:h-40 lg:w-48 lg:h-48",
      transform: povCentered ? "scale(2) scaleX(-1)" : "scale(1.2)"
    }
  };

  const selectedSize = sizeMap[size];

  // Common container styles
  const containerClasses = `relative ${selectedSize.container} ${className}`;

  // Minecraft skin styles
  const minecraftSkinClasses = "w-full h-full object-contain";
  
  // Avatar image styles
  const avatarImageClasses = "w-full h-full object-contain";

  // NPC styles
  const npcClasses = "w-full h-full object-contain";

  return (
    <div className={containerClasses}>
      {uuid !== null ? (
        // Minecraft skin for player
        <div className="relative w-full h-full" style={{ transform: selectedSize.transform }}>
          <img
            className={minecraftSkinClasses}
            alt={`${player.name} avatar`}
            src={`https://crafatar.com/renders/body/${uuid}`}
          />
        </div>
      ) : avatarNumber >= 0 ? (
        // Standard avatar image
        <div className="relative w-full h-full" style={{ transform: selectedSize.transform }}>
          <img
            className={avatarImageClasses}
            src={avatar || "/placeholder.svg"}
            alt={`${player.name} avatar`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      ) : (
        // NPC skin
        <div className="relative w-full h-full" style={{ transform: selectedSize.transform }}>
          <NpcSkin
            npcName={avatar}
          />
        </div>
      )}
    </div>
  );
}

export default BattlePreviewAvatar;
