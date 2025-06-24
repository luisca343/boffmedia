"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LootBoxSelector from "../selector/LootBoxSelector";
import LootBoxOpening from "../opening/LootBoxOpening";
import ItemCollection from "../collection/ItemCollection";
import { toast } from "react-toastify";
import { useBoffSession } from "@/services/useBoffSession";
import {useTranslations} from 'next-intl';
import { getItemName } from "@/lib/intlUtils";
import { useLootBoxInventory } from "../../_hooks/useLootBoxInventory";
import { ErrorDisplay } from "./ErrorDisplay";
import { LootBoxHeader } from "./LootBoxHeader";
import { InfoModal } from "./InfoModal";
import { LoadingOverlay } from "./LoadingOverlay";
import { Loader2 } from "lucide-react";
import { ArcadeInventory, LootboxBoxConfig } from "@/generated/api";

export default function LootBoxGame() {
  const t = useTranslations("");
  const { session } = useBoffSession();
  const uuid = session?.user.smartRotomUser?.uuid!;
  
  const handleInventoryUpdate = async () => {
    if (uuid) {
      await fetchInventory(uuid);
    }
  };

  const {
    collection,
    ownedBoxes,
    loadingInventory,
    availableLootBoxes,
    loadingLootBoxes,
    error,
    openLootBox,
    fetchInventory,
    addItemToCollection
  } = useLootBoxInventory(uuid);
  
  const [selectedBox, setSelectedBox] = useState<LootboxBoxConfig | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [wonItem, setWonItem] = useState<ArcadeInventory | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add useEffect to set first loot box as selected when availableLootBoxes are loaded
  useEffect(() => {
    if (availableLootBoxes.length > 0 && !selectedBox) {
      const firstValidBox = availableLootBoxes.find(box => box.items && box.items.length > 0);
      if (firstValidBox) {
        setSelectedBox(firstValidBox);
      }
    }
  }, [availableLootBoxes, selectedBox]);

  const handleSelectBox = (box: LootboxBoxConfig) => {
    if (!box.items || box.items.length === 0) {
      toast.error(`La caja "${box.name}" no tiene objetos disponibles.`);
      return;
    }
    setSelectedBox(box);
  };

  const handleOpenBox = async () => {
    if (!selectedBox) {
      toast.error("No hay caja seleccionada.");
      return;
    }
    
    if (!selectedBox.items || selectedBox.items.length === 0) {
      toast.error(`La caja "${selectedBox.name}" no tiene objetos disponibles.`);
      return;
    }
    
    // Check if the user has this box in their inventory
    const boxInInventory = ownedBoxes[selectedBox.id];
    if (!boxInInventory || boxInInventory.amount <= 0) {
      toast.error(`No tienes una ${selectedBox.name} en tu inventario.`);
      return;
    }
    
    setLoading(true);
    
    try {
      // If logged in, open the box on server
      if (uuid && boxInInventory.id) {
        const item = await openLootBox(uuid, selectedBox.id);
        setWonItem(item);
        setIsOpening(true);
      } 
    } catch (err) {
      console.error("Failed to open box:", err);
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
      addItemToCollection(wonItem);
      
      // For non-authenticated users, just show a message
      if (!uuid) {
        toast.info("Inicia sesión para guardar tus objetos en tu inventario permanente.", {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        toast.success(`¡${getItemName(t, wonItem.itemId)} añadido a tu inventario!`, {
          position: "top-center",
          autoClose: 4000
        });
        
        // Refresh inventory to ensure we have the latest data
        await fetchInventory(uuid);
      }
    }
      
    // Reset state to show box selector again
    setIsOpening(false);
    setWonItem(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header with boxes and user status */}
      <LootBoxHeader 
        ownedBoxes={ownedBoxes}
        collectionCount={collection.length}
        loadingInventory={loadingInventory}
        onShowInfo={() => setShowInfoModal(true)}
        onShowCollection={() => setShowCollection(true)}
      />

      {/* Loading loot boxes message */}
      {loadingLootBoxes && (
        <div className="bg-gray-900/70 text-white p-4 rounded-lg mb-6 text-center border-2 border-gray-500/40 flex justify-center items-center gap-3">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
          <span>Cargando cajas de botín...</span>
        </div>
      )}

      {/* Error message */}
      <ErrorDisplay error={error} />

      <AnimatePresence>
        {showCollection ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ItemCollection 
              uuid={uuid}
              items={collection} 
              onClose={() => setShowCollection(false)}
              onInventoryUpdate={handleInventoryUpdate}
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
            {!loadingLootBoxes && availableLootBoxes.length > 0 && (
              <LootBoxSelector 
                lootBoxes={availableLootBoxes} 
                selectedBox={selectedBox || availableLootBoxes[0]} 
                onSelect={handleSelectBox}
                onOpenBox={handleOpenBox}
                ownedBoxes={ownedBoxes}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <InfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
        hasSession={!!session}
      />
      
      {/* Loading overlay */}
      <LoadingOverlay loading={loading} />
    </div>
  );
}