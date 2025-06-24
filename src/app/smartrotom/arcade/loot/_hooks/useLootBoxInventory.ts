import { useState, useEffect } from "react";
import { ArcadeInventoryItem, ArcadeService } from "@/services/api/smartrotom/arcadeService";
import { useTranslations } from 'next-intl';
import { LootboxBoxConfig } from "@/generated/api";

// Map the inventory item types to loot box IDs
const BOX_TYPE_MAP: Record<string, string> = {
  "trainer_box": "trainer_box",
  "evolution_box": "evolution_box",
  "battle-box": "battle_box",
};

export function useLootBoxInventory(uuid?: string) {
  const t = useTranslations("");
  const [collection, setCollection] = useState<ArcadeInventoryItem[]>([]);
  const [ownedBoxes, setOwnedBoxes] = useState<Record<string, any>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [availableLootBoxes, setAvailableLootBoxes] = useState<LootboxBoxConfig[]>([]);
  const [loadingLootBoxes, setLoadingLootBoxes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async (userId: string) => {
    try {
      setLoadingInventory(true);
      const response = await ArcadeService.getInventory(userId);
      if (response.data && response.data.items) {
        const serverItems = response.data.items
          .filter(item => item.used === 0);
        
        setCollection(serverItems);
        
        const boxes: Record<string, any> = {};
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
  
  function getRarityFromWeight(rarityRanges: Record<string, {min: number; max: number;}>, weight: number): string {
    for (const [rarity, range] of Object.entries(rarityRanges)) {
      if (weight >= range.min && weight <= range.max) {
        return rarity;
      }
    }
    return 'common';
  }
  const fetchLootBoxConfig = async () => {
    try {
      setLoadingLootBoxes(true);
      const {rarityRanges, lootboxConfig} = (await ArcadeService.getLootboxConfig()).data!
      
      if (lootboxConfig && lootboxConfig.boxes) {
        const lootBoxes: LootboxBoxConfig[] = lootboxConfig.boxes.map((box: any) => ({
          id: box.id,
          name: box.name,
          description: box.description,
          image: box.image,
          items: box.items.map((item: any) => ({
            id: item.id,
            weight: item.weight,
            rarity: getRarityFromWeight(rarityRanges, item.weight) as any,
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
      const response = await ArcadeService.openLootbox({
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
      const item: any = {
        id: Number(response.data.item!.id),
        //weight: response.data.item!.weight, //TODO: FIX THIS
        rarity: response.data.item!.rarity as any,
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
    addItemToCollection: (item: ArcadeInventoryItem) => setCollection(prev => [...prev, item])
  };
}