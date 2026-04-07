"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { formatMoney } from "../../bankUtils";

interface TransactionDialogProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDialog({ transaction, isOpen, onClose }: TransactionDialogProps) {
  if (!transaction) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle de Transacción</DialogTitle>
          <DialogDescription>
            {new Date(transaction.date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-surface-500">Tipo</p>
              <p className="font-medium">{transaction.type}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Monto</p>
              <p className={`font-medium ${transaction.isIncome ? 'text-highlight-600' : 'text-red-600'}`}>
                {transaction.isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-surface-500">Concepto</p>
            <p className="font-medium">{transaction.reason || "Sin concepto"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-surface-500">Emisor</p>
              <p className="font-medium">{transaction.fromName || "Desconocido"}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Receptor</p>
              <p className="font-medium">{transaction.toName || "Desconocido"}</p>
            </div>
          </div>
          
          {transaction.fromBalance !== undefined && (
            <div>
              <p className="text-sm text-surface-500">Nuevo saldo</p>
              <p className="font-medium">{formatMoney(transaction.fromBalance)}</p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full" 
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}