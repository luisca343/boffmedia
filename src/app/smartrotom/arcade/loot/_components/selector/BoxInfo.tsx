import { Box } from "lucide-react";
import { LootBox } from "../../types";
import { ArcadeInventoryItem, LootboxBoxConfig } from "@/generated/api";

interface BoxInfoProps {
  selectedBox: LootboxBoxConfig | null;
  ownedBoxes: Record<string, ArcadeInventoryItem>;
  currentBoxTheme: {
    text: string;
    border: string;
  };
}

export function BoxInfo({ selectedBox, ownedBoxes, currentBoxTheme }: BoxInfoProps) {
  if (!selectedBox) return null;
  
  const ownedCount = ownedBoxes[selectedBox.id] ? ownedBoxes[selectedBox.id].amount : 0;

  return (
    <div className={`text-sm px-4 py-2 bg-black/30 rounded-lg border ${currentBoxTheme.text} ${currentBoxTheme.border}  flex items-center gap-2`}>
      <Box size={16} />
      <span>Disponibles: <strong>{ownedCount}</strong></span>
    </div>
  );
}