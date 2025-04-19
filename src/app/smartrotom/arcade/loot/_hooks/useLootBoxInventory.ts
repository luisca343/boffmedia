import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { arcadeService, InventoryItem, RarityRanges } from "@/services/api/smartrotom/arcadeService";
import { Item, LootBox, Rarity } from "../types";
import { useTranslations } from 'next-intl';
import { getItemDescription, getItemName } from "@/lib/intlUtils";
import { Weight } from "lucide-react";

// Map the inventory item types to loot box IDs
const BOX_TYPE_MAP: Record<string, string> = {
  "trainer_box": "trainer_box",
  "evolution_box": "evolution_box",
  "battle-box": "battle_box",
};

export function useLootBoxInventory(uuid?: string) {
  const t = useTranslations("");
  const [collection, setCollection] = useState<Item[]>([]);
  const [ownedBoxes, setOwnedBoxes] = useState<Record<string, InventoryItem>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [availableLootBoxes, setAvailableLootBoxes] = useState<LootBox[]>([]);
  const [loadingLootBoxes, setLoadingLootBoxes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's inventory
  const fetchInventory = async (userId: string) => {
    try {
      setLoadingInventory(true);
      const response = await arcadeService.getInventory(userId, '');
      if (response.data && response.data.items) {
        const serverItems = response.data.items
          .filter(item => item.used === 0) // Only include unused items
          .map(item => ({
            id: item.itemId,
            name: t(`items.${item.itemId.replace(":", ".")}_name`),
            source: item.sourceType,
            image: getItemName(t, item.itemId),
            weight: 0,
            rarity: item.rarity as Rarity,
            count: item.amount,
            description: getItemDescription(t, item.itemId),
            serverId: item.id,
          }));
        
        setCollection(serverItems);
        
        const boxes: Record<string, InventoryItem> = {};
        response.data.items
          .filter(item => item.used === 0) // Only include unused boxes
          .forEach(item => {
            if (Object.keys(BOX_TYPE_MAP).includes(item.itemId)) {
              boxes[item.itemId] = item;
            }
          });
        
        setOwnedBoxes(boxes);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      toast.error("No se pudo cargar tu inventario. Usando solo datos locales.", {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoadingInventory(false);
    }
  };
  
  function getRarityFromWeight(rarityRanges: RarityRanges, weight: number): string {
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
      const {rarityRanges, lootboxConfig} = (await arcadeService.getLootboxConfig()).data!
      
      if (lootboxConfig && lootboxConfig.boxes) {
        const lootBoxes: LootBox[] = lootboxConfig.boxes.map(box => ({
          id: box.id,
          name: box.name,
          description: box.description,
          image: box.image,
          items: box.items.map(item => ({
            id: item.id,
            weight: item.weight,
            rarity: getRarityFromWeight(rarityRanges, item.weight) as Rarity,
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
      const response = await arcadeService.openLootBox({
        uuid,
        boxId,
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || "Error al abrir la caja");
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
      const item: Item = {
        id: response.data.item!.id,
        weight: response.data.item!.weight,
        rarity: response.data.item!.rarity as Rarity,
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
      
      // Auto-refresh inventory periodically if user is logged in
      const intervalId = setInterval(() => {
        fetchInventory(uuid);
      }, 60000); // Refresh every minute
      
      return () => clearInterval(intervalId);
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
    addItemToCollection: (item: Item) => setCollection(prev => [...prev, item])
  };
}