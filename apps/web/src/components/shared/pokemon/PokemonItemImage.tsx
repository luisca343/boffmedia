import Image from "next/image";

interface ItemImageProps {
  itemId: string;
  size?: number;
}


export function PokemonItemImage({ itemId, size }: ItemImageProps) {
  const itemName = itemId.split(".").pop() ?? "";
  const imagePath = `/smartrotom/img/sprites/items/${itemName.replace("_", "").toUpperCase()}.png`;
  return (
    <div className="relative group flex space-x-2">
        <Image alt={itemId} width={size} height={size} src={imagePath} />
    </div>
  );
};