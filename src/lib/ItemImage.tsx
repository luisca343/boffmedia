import Image from "next/image";

interface ItemImageProps {
  type: string;       // Type of item (e.g., "mina", "mine")
  itemId: string;     // The item identifier
  amount: number;     // The amount of the item
  size?: number;      // Optional size parameter (default: 32)
}

export const ItemImage = ({ type, itemId, amount, size = 32 }: ItemImageProps) => {
  const itemName = itemId?.split(":")[1] || itemId;
  console.log("ItemImage", { type, itemId, amount, size });
  
  let imagePath: string;

  if (itemId.includes("box")) {
    imagePath = `/smartrotom/img/apps/arcade/lootbox/${itemName}.png`;
  } else if (type === "mina") {
    imagePath = `/smartrotom/img/apps/mina/recompensas/${itemName}.png`;
  } else {
    // Default to arcade lootbox items
    imagePath = `/smartrotom/img/apps/arcade/lootbox/items/${itemName}.png`;
  }
  
  return (
    <div className="relative group flex space-x-2">
      <Image
        alt={itemId}
        width={size}
        height={size}
        src={imagePath}
        style={{ imageRendering: "pixelated" }}
      />
      {amount > 0 && <span className="ml-2">x{amount}</span>}
    </div>
  );
};