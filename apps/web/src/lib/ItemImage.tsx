import Image from "next/image";
import { PokemonImage } from "./PokemonImage";

interface ItemImageProps {
  type?: string;
  itemId: string;
  amount?: number;
  size?: number;
}

export const ItemImage = ({ type = "", itemId, amount = 0, size = 32 }: ItemImageProps) => {
  let itemName = itemId?.split(":")[1] || itemId;
  let imagePath: string;

  if (itemId.includes("box")) {
    imagePath = `/smartrotom/img/apps/arcade/lootbox/${itemName}.png`;
  } else if (type === "mina") {
    imagePath = `/smartrotom/img/apps/mina/recompensas/${itemName}.png`;
  } else {
    imagePath = `/smartrotom/img/sprites/items/${itemName.replace("_", "").toUpperCase()}.png`;
  }
  
  return (
    <div className="relative group flex space-x-2">
      {type === "pokemon" ? 
        <PokemonImage itemId={itemId} size={size} /> :
        <Image alt={itemId} width={size} height={size} src={imagePath} style={{ imageRendering: "pixelated" }} />
      }

      {amount > 0 && <span className="ml-2">x{amount}</span>}
    </div>
  );
};
