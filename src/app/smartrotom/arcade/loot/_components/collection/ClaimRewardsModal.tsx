import { useState } from 'react';
import { Item } from '../../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { ItemDisplay } from '../ItemDisplay';
import { useTranslations } from 'next-intl';
import { getItemName } from '@/lib/intlUtils';
import { arcadeService } from '@/services/api/smartrotom/arcadeService';
import { toast } from 'react-toastify';

interface ClaimRewardsModalProps {
    items: Item[];
    onClose: () => void;
    onClaimSuccess: (claimedItemIds: string[]) => void;
    uuid: string;
  }
  
  export function ClaimRewardsModal({ items, onClose, onClaimSuccess, uuid }: ClaimRewardsModalProps) {
    const t = useTranslations("");
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [isClaiming, setIsClaiming] = useState(false);
  
    // Filter out chests
    const claimableItems = items.filter(item => 
      !item.id.toLowerCase().includes('chest') && 
      !item.id.toLowerCase().includes('box')
    );
  
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
        const itemIds = selectedItems.map(item => item.id);
        const response = await (await arcadeService.claimInventoryItems(uuid, itemIds)).data
  
        if (response?.success) {
          toast.success(`¡Has reclamado ${selectedItems.length} objetos correctamente!`);
          // Pass the claimed item IDs to update the local state
          onClaimSuccess(itemIds);
        } else {
          toast.error(response!.message || 'Error al reclamar los objetos');
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

        <div className="bg-gray-800/60 rounded-lg p-4 max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {claimableItems.map(item => {
              const isSelected = selectedItems.some(i => i.id === item.id);
              const isChest = item.id.toLowerCase().includes('chest') || item.id.toLowerCase().includes('box');
              
              return (
                <div key={item.id} className="flex flex-col items-center">
                  <ItemDisplay
                    type={item.source!}
                    itemId={item.id}
                    count={item.count}
                    size={64}
                    rarity={item.rarity}
                    name={getItemName(t, item.id, item.source)}
                    selectable={true}
                    selected={isSelected}
                    isChest={isChest}
                    onClick={() => toggleItemSelection(item)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-300">
            {selectedItems.length === 0 
              ? 'No has seleccionado objetos' 
              : `${selectedItems.length} objeto(s) seleccionado(s)`
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