"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Sparkles, Coins, Box, Info, Loader2 } from "lucide-react";
import { Item, LootBox, Rarity } from "./types";
import LootBoxSelector from "./LootBoxSelector";
import LootBoxOpening from "./LootBoxOpening";
import ItemCollection from "./ItemCollection";
import { availableLootBoxes } from "./lootboxData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { useBoffSession } from "@/services/useBoffSession";
import { arcadeService, GetInventoryResponse, InventoryItem } from "@/services/api/smartrotom/arcadeService";
import { darCaja } from "@/services/mcef/mcefApi";
import {useTranslations} from 'next-intl';
import { getItemDescription, getItemName } from "@/lib/intlUtils";

// Map the inventory item types to loot box IDs
const BOX_TYPE_MAP: Record<string, string> = {
  "trainer-box": "trainer-box",
  "evolution-box": "evolution-box",
  "battle-box": "battle-box",
};

export default function LootBoxGame() {
  const t = useTranslations("");
  const { session } = useBoffSession();
  const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [collection, setCollection] = useState<Item[]>([]);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [ownedBoxes, setOwnedBoxes] = useState<Record<string, InventoryItem>>({});

  // Fetch user's inventory on component mount
  useEffect(() => {
    if (session?.user.smartRotomUser?.uuid) {
      fetchInventory(session.user.smartRotomUser.uuid);
    }
  }, [session]);
  
  // Validate the lootboxes have items on initial load
  useEffect(() => {
    const boxesWithoutItems = availableLootBoxes.filter(box => !box.items || box.items.length === 0);
    if (boxesWithoutItems.length > 0) {
      setError(`Algunas cajas no tienen objetos definidos: ${boxesWithoutItems.map(b => b.name).join(', ')}`);
    } else {
      setSelectedBox(availableLootBoxes[0]);
    }
  }, []);

  // Fetch user's inventory
  const fetchInventory = async (uuid: string) => {
    try {
      setLoadingInventory(true);
      const response = await arcadeService.getInventory(uuid, '');
      console.log("Fetched inventory:", response.data);
      if (response.data && response.data.items) {
        const serverItems = response.data.items
          .filter(item => item.used === 0) // Only include unused items
          .map(item => ({
            id: item.itemId,
            name: t(`items.${item.itemId.replace(":", ".")}_name`),
            source: item.sourceType,
            image: getItemName(t, item.itemId),
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

  const handleSelectBox = (box: LootBox) => {
    if (!box.items || box.items.length === 0) {
      setError(`La caja "${box.name}" no tiene objetos disponibles.`);
      return;
    }
    setError(null);
    setSelectedBox(box);
  };

  const handleOpenBox = async () => {
    if (!selectedBox) {
      setError("No hay caja seleccionada.");
      return;
    }
    
    if (!selectedBox.items || selectedBox.items.length === 0) {
      setError(`La caja "${selectedBox.name}" no tiene objetos disponibles.`);
      return;
    }
    
    // Check if the user has this box in their inventory
    const boxInInventory = ownedBoxes[selectedBox.id];
    if (!boxInInventory || boxInInventory.amount <= 0) {
      setError(`No tienes una ${selectedBox.name} en tu inventario.`);
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Immediately consume the box from the server BEFORE showing animations
      if (session?.user.smartRotomUser?.uuid && boxInInventory.id) {
        await arcadeService.consumeInventoryItem(
          session.user.smartRotomUser.uuid, 
          boxInInventory.itemId
        );
        
        // Update the local state to reflect the change
        setOwnedBoxes(prev => ({
          ...prev,
          [selectedBox.id]: {
            ...prev[selectedBox.id],
            amount: prev[selectedBox.id].amount - 1
          }
        }));
      } else {
        // Update local state only if not connected to server
        setOwnedBoxes(prev => ({
          ...prev,
          [selectedBox.id]: {
            ...prev[selectedBox.id],
            amount: prev[selectedBox.id].amount - 1
          }
        }));
      }
      
      // Determine prize and start animation
      const item = determineRandomItem(selectedBox);
      setWonItem(item);
      setIsOpening(true);
      
    } catch (err) {
      console.error("Failed to consume box:", err);
      toast.error("Error al abrir la caja. Inténtalo de nuevo.", {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpeningComplete = async () => {
    if (wonItem && selectedBox) {
      // Add the item to the collection
      setCollection(prev => [...prev, wonItem]);
      
      // Save won item to server if user is logged in
      if (session?.user.smartRotomUser?.uuid) {
        try {
          setLoading(true);
            
          // Add the won item to inventory
          await addItemToInventory(session.user.smartRotomUser.uuid, wonItem);
            
          toast.success(`¡${wonItem.name} añadido a tu inventario!`, {
            position: "top-center",
            autoClose: 4000
          });
            
          // Refresh inventory to ensure it's up to date
          await fetchInventory(session.user.smartRotomUser.uuid);
            
        } catch (err) {
          console.error("Failed to save item to inventory:", err);
          toast.warning("Error al añadir objeto al inventario.", {
            position: "top-right",
            autoClose: 5000
          });
        } finally {
          setLoading(false);
        }
      } else {
        toast.info("Inicia sesión para guardar tus objetos en tu inventario permanente.", {
          position: "top-right",
          autoClose: 5000
        });
      }
    }
      
    // Reset state to show box selector again
    setIsOpening(false);
    setWonItem(null);
  };

  const addItemToInventory = async (uuid: string, item: Item) => {
    const itemData = {
      uuid,
      itemId: item.id,
      itemType: item.rarity.toUpperCase(),
      name: item.name,
      amount: 1,
      sourceType: 'arcade',
      sourceId: 1 // Using a default sourceId for loot boxes
    };
    
    const response = await arcadeService.addInventoryItem(itemData);
    
    if (!response.data) {
      throw new Error(response.data!.message || "Error adding item to inventory");
    }
    
    return response.data;
  };

  const determineRandomItem = (box: LootBox): Item => {
    // Safety check
    if (!box.items || box.items.length === 0) {
      // Create a fallback item
      return {
        id: "fallback",
        name: "Objeto Misterioso",
        image: "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png",
        rarity: "common",
        description: "Un objeto misterioso apareció."
      } as Item;
    }

    // Apply rarity weights: common=60%, uncommon=25%, rare=10%, epic=4%, legendary=1%
    const rarityWeights = {
      common: 60,
      uncommon: 25,
      rare: 10,
      epic: 4,
      legendary: 1
    };
    
    // Group items by rarity
    const itemsByRarity: Record<string, Item[]> = {};
    box.items.forEach(item => {
      if (!itemsByRarity[item.rarity]) {
        itemsByRarity[item.rarity] = [];
      }
      itemsByRarity[item.rarity].push(item);
    });
    
    // Generate random number from 0-100
    const rand = Math.random() * 100;
    
    // Determine rarity based on weights
    let selectedRarity: string = "common";
    let cumulativeWeight = 0;
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeWeight += weight;
      if (rand <= cumulativeWeight) {
        selectedRarity = rarity;
        break;
      }
    }
    
    // Default to common if no items of the selected rarity
    if (!itemsByRarity[selectedRarity] || itemsByRarity[selectedRarity].length === 0) {
      // Find any rarity that has items
      const fallbackRarity = Object.keys(itemsByRarity).find(rarity => 
        itemsByRarity[rarity] && itemsByRarity[rarity].length > 0
      );

      if (!fallbackRarity) {
        // Create a fallback item if no items found
        return {
          id: "fallback",
          name: "Objeto Misterioso",
          image: "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png",
          rarity: "common",
          description: "Un objeto misterioso apareció."
        } as Item;
      }
      
      selectedRarity = fallbackRarity;
    }
    
    // Select random item from the rarity group
    const itemsOfRarity = itemsByRarity[selectedRarity];
    return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
  };
  
  // Auto-refresh inventory periodically if user is logged in
  useEffect(() => {
    if (!session?.user.smartRotomUser?.uuid) return;
    
    const intervalId = setInterval(() => {
      fetchInventory(session.user.smartRotomUser!.uuid);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [session]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header with boxes and user status */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-indigo-900/70 to-blue-900/70 rounded-lg border-2 border-indigo-500/40 shadow-md">
        <button 
          onClick={() => setShowInfoModal(true)}
          className="flex items-center space-x-2 bg-blue-900/60 hover:bg-blue-800/80 text-cyan-300 px-4 py-2 rounded-md transition border border-blue-700/50"
        >
          <Info size={20} />
          <span>Información</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-gray-900/60 px-4 py-2 rounded-lg border border-gray-700/50">
          <Box className="text-indigo-400 w-6 h-6" />
          <span className="text-xl font-bold text-indigo-400">
            {Object.values(ownedBoxes).reduce((total, box) => total + box.amount, 0)} cajas
          </span>
        </div>
        
        <button 
          onClick={() => setShowCollection(!showCollection)}
          disabled={loadingInventory}
          className={`flex items-center space-x-2 ${
            loadingInventory ? 'bg-gray-700/60 cursor-wait' : 'bg-purple-900/60 hover:bg-purple-800/80'
          } text-purple-300 px-4 py-2 rounded-md transition border border-purple-700/50`}
        >
          {loadingInventory ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Sparkles size={20} />
          )}
          <span>Colección ({collection.length})</span>
        </button>
      </div>

      {/* Session status message */}
      {!session && (
        <div className="bg-blue-900/70 text-white p-4 rounded-lg mb-6 text-center border-2 border-blue-500/40">
          No has iniciado sesión. Los objetos que consigas solo se guardarán localmente.
          <div className="mt-2">
            <a href="/login" className="bg-blue-500/70 hover:bg-blue-600/70 text-white px-4 py-2 rounded-md font-bold transition">
              Iniciar Sesión
            </a>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900/70 text-white p-4 rounded-lg mb-6 text-center border-2 border-red-500/40">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showCollection ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ItemCollection 
              items={collection} 
              onClose={() => setShowCollection(false)} 
            />
          </motion.div>
        ) : isOpening && selectedBox && wonItem ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <LootBoxOpening 
              lootBox={selectedBox} 
              wonItem={wonItem} 
              onComplete={handleOpeningComplete} 
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LootBoxSelector 
              lootBoxes={availableLootBoxes} 
              selectedBox={selectedBox} 
              onSelect={handleSelectBox}
              onOpenBox={handleOpenBox}
              ownedBoxes={ownedBoxes}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="bg-gray-900 border-2 border-cyan-500/30 max-w-2xl shadow-md shadow-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Cómo funcionan las Poké Cajas
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-300">
              Descubre objetos especiales para tu colección
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-gray-300">
            <p className="flex items-start">
              <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">1</span> 
              <span>Selecciona una caja de la colección disponible.</span>
            </p>
            <p className="flex items-start">
              <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">2</span>
              <span>Necesitas tener la caja en tu inventario para poder abrirla.</span>
            </p>
            <p className="flex items-start">
              <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">3</span>
              <span>Los objetos tienen diferentes niveles de rareza:</span>
            </p>
            <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-800">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                  <span className="text-gray-400">Común - 60% de probabilidad</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                  <span className="text-green-400">Poco común - 25% de probabilidad</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                  <span className="text-blue-400">Raro - 10% de probabilidad</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                  <span className="text-purple-400">Épico - 4% de probabilidad</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                  <span className="text-yellow-400">Legendario - 1% de probabilidad</span>
                </li>
              </ul>
            </div>
            <p className="flex items-start">
              <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">4</span>
              <span>Abre cajas para coleccionar todos los objetos posibles.</span>
            </p>
            <p className="flex items-start">
              <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">5</span>
              <span>Puedes conseguir cajas completando desafíos en el juego.</span>
            </p>
            {session && (
              <p className="flex items-start">
                <span className="text-cyan-400 font-bold mr-2 bg-cyan-900/30 w-6 h-6 flex items-center justify-center rounded-full">6</span>
                <span>Los objetos que obtengas se guardan en tu inventario permanente.</span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg border-2 border-cyan-500/30 flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
            <span className="text-white font-bold">Actualizando inventario...</span>
          </div>
        </div>
      )}
    </div>
  );
}