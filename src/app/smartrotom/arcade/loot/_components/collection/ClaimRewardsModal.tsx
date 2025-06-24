import { useState, useMemo } from 'react';
import { Item } from '../../types';
import { X, Check, AlertCircle, Box } from 'lucide-react';
import { ItemDisplay } from '../ItemDisplay';
import { useTranslations } from 'next-intl';
import { getItemName } from '@/lib/intlUtils';
import { toast } from 'react-toastify';

interface ClaimRewardsModalProps {
  items: Item[];
  onClose: () => void;
  onClaimSuccess: (claimedItemIds: string[]) => void;
  uuid: string;
}

// Define an interface for the item claim data
interface ClaimItemData {
  id: string;
  type: string;
}

export function ClaimRewardsModal({ items, onClose, onClaimSuccess, uuid }: ClaimRewardsModalProps) {
  const t = useTranslations("");
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Filter out chests and boxes
  const claimableItems = items.filter(item => 
    !item.id.toLowerCase().includes('chest') && 
    !item.id.toLowerCase().includes('box')
  );
  
  // Separate Pokémon from non-Pokémon items
  const pokemonItems = claimableItems.filter(item => item.source === 'pokemon');
  const nonPokemonItems = claimableItems.filter(item => item.source !== 'pokemon');
  
  // Calculate required chests for Minecraft items
  const chestCalculation = useMemo(() => {
    if (selectedItems.length === 0) return { slots: 0, chests: 0 };
    
    const selectedNonPokemon = selectedItems.filter(item => item.source !== 'pokemon');
    
    // Calculate slots needed
    const requiredSlots = selectedNonPokemon.reduce((total, item) => {
      // Each item type uses at least one slot
      // If count is more than 64, calculate additional slots needed
      const itemSlots = Math.ceil((item.count || 1) / 64);
      return total + itemSlots;
    }, 0);
    
    // Each chest has 27 slots in Minecraft
    const chestsNeeded = Math.ceil(requiredSlots / 27);
    
    return { slots: requiredSlots, chests: chestsNeeded };
  }, [selectedItems]);
  
  const toggleItemSelection = (item: Item) => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  
  const handleClaim = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsClaiming(true);
      
      // Create an array of item IDs and types for claiming
      const claimItems: ClaimItemData[] = selectedItems.map(item => ({
        id: item.id,
        type: item.source || 'minecraft' // Default to 'minecraft' if source is not specified
      }));
      
      // Send both item IDs and types to the server
      //TODO: Uncomment the following line when arcadeService is properly set up
      //const response = await (await arcadeService.claimInventoryItems(uuid, claimItems)).data;

      const response = false;
      
      if (response) {
        // Different messages based on what was claimed
        if (selectedItems.some(item => item.source === 'pokemon') && 
            selectedItems.some(item => item.source !== 'pokemon')) {
          toast.success(`¡Has reclamado ${selectedItems.length} objetos correctamente! Se te entregarán ${chestCalculation.chests} cofre(s) en Minecraft.`);
        } else if (selectedItems.every(item => item.source === 'pokemon')) {
          toast.success(`¡Has reclamado ${selectedItems.length} Pokémon correctamente!`);
        } else {
          toast.success(`¡Has reclamado ${selectedItems.length} objetos correctamente! Se te entregarán ${chestCalculation.chests} cofre(s) en Minecraft.`);
        }
        
        // Pass the claimed item IDs to update the local state
        onClaimSuccess(selectedItems.map(item => item.id));
      } else {
        toast.error(response || 'Error al reclamar los objetos');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast.error('Ocurrió un error al reclamar los objetos');
    } finally {
      setIsClaiming(false);
      onClose();
    }
  };

  
  if (claimableItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Reclamar Recompensas</h3>
            <button 
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-full border border-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle size={32} className="text-gray-400 mb-3" />
            <p className="text-gray-300 text-center">No tienes objetos para reclamar en este momento</p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg border border-gray-700 font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  
  const selectedNonPokemon = selectedItems.filter(item => item.source !== 'pokemon');
  const selectedPokemon = selectedItems.filter(item => item.source === 'pokemon');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">Reclamar Recompensas</h3>
          <button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-full border border-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-300 mb-4">
          Selecciona las recompensas que deseas reclamar. Los cofres no se pueden reclamar.
        </p>

        {/* Display chest calculation info if we have selected non-Pokémon items */}
        {selectedNonPokemon.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4 flex items-center">
            <Box size={20} className="text-blue-400 mr-2" />
            <div>
              <p className="text-blue-300">
                <span className="font-semibold">{selectedNonPokemon.length}</span> {selectedNonPokemon.length === 1 ? 'objeto' : 'objetos'} de Minecraft seleccionados
              </p>
              <p className="text-blue-300 text-sm">
                Ocuparán <span className="font-semibold">{chestCalculation.slots}</span> {chestCalculation.slots === 1 ? 'espacio' : 'espacios'} en 
                <span className="font-semibold"> {chestCalculation.chests}</span> {chestCalculation.chests === 1 ? 'cofre' : 'cofres'}
              </p>
            </div>
          </div>
        )}

        {/* Display Pokémon count if any selected */}
        {selectedPokemon.length > 0 && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-4">
            <p className="text-green-300">
              <span className="font-semibold">{selectedPokemon.length}</span> {selectedPokemon.length === 1 ? 'Pokémon' : 'Pokémon'} seleccionados
            </p>
          </div>
        )}

        {/* Split display into two sections: Pokémon and non-Pokémon */}
        <div className="bg-gray-800/60 rounded-lg p-4 max-h-[400px] overflow-y-auto">
          {pokemonItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-cyan-300 font-medium mb-2 border-b border-gray-700 pb-1">Pokémon</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {pokemonItems.map(item => {
                  const isSelected = selectedItems.some(i => i.id === item.id);
                  return (
                    <div key={item.id} className="flex flex-col items-center text-surface-100">
                      <ItemDisplay
                        type={item.source!}
                        itemId={item.id}
                        count={item.count}
                        size={64}
                        rarity={item.rarity}
                        name={getItemName(t, item.id, item.source)}
                        selectable={true}
                        selected={isSelected}
                        isChest={false}
                        onClick={() => toggleItemSelection(item)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nonPokemonItems.length > 0 && (
            <div>
              <h4 className="text-amber-300 font-medium mb-2 border-b border-gray-700 pb-1">Objetos de Minecraft</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {nonPokemonItems.map(item => {
                  const isSelected = selectedItems.some(i => i.id === item.id);
                  return (
                    <div key={item.id} className="flex flex-col items-center text-surface-100">
                      <ItemDisplay
                        type={item.source!}
                        itemId={item.id}
                        count={item.count}
                        size={64}
                        rarity={item.rarity}
                        name={getItemName(t, item.id, item.source)}
                        selectable={true}
                        selected={isSelected}
                        isChest={false}
                        onClick={() => toggleItemSelection(item)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-300">
            {selectedItems.length === 0 
              ? 'No has seleccionado objetos' 
              : `${selectedItems.length} ${selectedItems.length === 1 ? 'objeto' : 'objetos'} seleccionado${selectedItems.length === 1 ? '' : 's'}`
            }
          </span>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleClaim}
              disabled={selectedItems.length === 0 || isClaiming}
              className={`flex items-center px-4 py-2 rounded-lg font-bold ${
                selectedItems.length === 0 || isClaiming
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500'
              }`}
            >
              {isClaiming && <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />}
              <Check size={16} className="mr-1" />
              <span>{isClaiming ? 'Reclamando...' : 'Reclamar Recompensas'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}