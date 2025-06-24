import { useState, useEffect } from "react";
import { ArcadeInventoryItem, arcadeService } from "@/services/api/smartrotom/arcadeService";
import { useTranslations } from 'next-intl';
import { getItemDescription, getItemName } from "@/lib/intlUtils";
import { LootboxBoxConfig, LootboxItemConfig, LootItemDto, RarityRange, RarityRanges } from "@/generated/api";

// Map the inventory item types to loot box IDs
const BOX_TYPE_MAP: Record<string, string> = {
  "trainer_box": "trainer_box",
  "evolution_box": "evolution_box",
  "battle-box": "battle_box",
};

export function useLootBoxInventory(uuid?: string) {
  const t = useTranslations("");
  const [collection, setCollection] = useState<ArcadeInventoryItem[]>([]);
  const [ownedBoxes, setOwnedBoxes] = useState<Record<string, ArcadeInventoryItem>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [availableLootBoxes, setAvailableLootBoxes] = useState<LootboxBoxConfig[]>([]);
  const [loadingLootBoxes, setLoadingLootBoxes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's inventory
  const fetchInventory = async (userId: string) => {
    try {
      setLoadingInventory(true);
      const response = await arcadeService.getInventory(userId);
      if (response.data && response.data.items) {
        const serverItems = response.data.items
          .filter(item => item.used === 0);
        
        setCollection(serverItems);
        
        const boxes: Record<string, ArcadeInventoryItem> = {};
        response.data.items
          .filter(item => item.used === 0) // Only include unused boxes
          .forEach(item => {
            if (Object.keys(BOX_TYPE_MAP).includes(item.itemId)) {
              boxes[item.itemId] = item;
            }
          });
        
        setOwnedBoxes(boxes);
      }
    } finally {
      setLoadingInventory(false);
    }
  };
  
  function getRarityFromWeight(rarityRanges: RarityRanges, weight: number): string {
    for (const [rarity, range] of Object.entries(rarityRanges)) {
      const typedRange = range as RarityRange;
      if (weight >= typedRange.min && weight <= typedRange.max) {
        return rarity;
      }
    }
    return 'common';
  }
  const fetchLootBoxConfig = async () => {
    try {
      setLoadingLootBoxes(true);
      const {rarityRanges, lootboxConfig} = (await arcadeService.getLootboxConfig()).data!
      
      if (lootboxConfig && lootboxConfig.boxes) {
        const lootBoxes: LootboxBoxConfig[] = lootboxConfig.boxes.map((box: any) => ({
          id: box.id,
          name: box.name,
          description: box.description,
          image: box.image,
          items: box.items.map((item: any) => ({
            id: item.id,
            weight: item.weight,
            rarity: getRarityFromWeight(rarityRanges, item.weight) as ArcadeInventoryItem.rarity,
          })),
          theme: box.theme || "default"
        }));
        setAvailableLootBoxes(lootBoxes);
        
        // Validate boxes have items
        const boxesWithoutItems = lootBoxes.filter(box => !box.items || box.items.length === 0);
        if (boxesWithoutItems.length > 0) {
          setError(`Algunas cajas no tienen objetos definidos: ${boxesWithoutItems.map(b => b.name).join(', ')}`);
        } else {
          setError(null);
        }
      } else {
        setError("No se pudieron cargar las cajas de botín. Intente de nuevo más tarde.");
      }
    } catch (err) {
      console.error("Failed to fetch loot box config:", err);
      setError("Error al cargar las configuraciones de cajas. Por favor, intente de nuevo más tarde.");
    } finally {
      setLoadingLootBoxes(false);
    }
  };

  // Open a loot box and get a reward
  const openLootBox = async (uuid: string, boxId: string) => {
    try {
      const response = await arcadeService.openLootbox({
        uuid,
        boxId,
      });
      
      if (!response.data || !response.success) {
        throw new Error(response?.message || "Error al abrir la caja");
      }

      // Update local state to reflect the consumed box
      setOwnedBoxes(prev => ({
        ...prev,
        [boxId]: {
          ...prev[boxId],
          amount: prev[boxId].amount - 1
        }
      }));
      
      // Return the won item
      const item: LootboxItemConfig = {
        id: response.data.item!.id,
        weight: 0, //TODO: FIX THIS
        //weight: response.data.item!.weight,
        rarity: response.data.item!.rarity as ArcadeInventoryItem.rarity,
      };
      
      return item;
    } catch (err) {
      console.error("Failed to open box:", err);
      throw err;
    }
  };

  // Effects
  useEffect(() => {
    fetchLootBoxConfig();
  }, []);

  useEffect(() => {
    if (uuid) {
      fetchInventory(uuid);
      /*
      const intervalId = setInterval(() => {
        fetchInventory(uuid);
      }, 60000); // Refresh every minute
      
      return () => clearInterval(intervalId);
      */
    }
  }, [uuid]);

  return {
    collection,
    ownedBoxes,
    loadingInventory,
    availableLootBoxes,
    loadingLootBoxes,
    error,
    fetchInventory,
    openLootBox,
    addItemToCollection: (item: any) => setCollection(prev => [...prev, item])
  };
}