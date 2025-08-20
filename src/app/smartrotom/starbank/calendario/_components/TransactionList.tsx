"use client";

import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { formatMoney } from "../../bankUtils";
import { CalendarIcon } from "lucide-react";
import { StarBankTransaction } from "@/generated/api";

interface TransactionListProps {
  transactions: StarBankTransaction[];
  onSelectTransaction: (transaction: StarBankTransaction) => void;
}

export function TransactionList({ transactions, onSelectTransaction }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="h-[550px] flex flex-col items-center justify-center text-center">
        <CalendarIcon className="h-12 w-12 text-blue-200 mb-4" />
        <h3 className="text-lg font-medium text-blue-900">No hay transacciones</h3>
        <p className="text-blue-600 mt-1">
          No hay transacciones registradas para esta fecha
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[550px] pr-4">
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <Card 
            key={index} 
            className="p-4 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => onSelectTransaction(transaction)}
            variant="wingull"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${!transaction.isPayer ? 'bg-highlight-500' : 'bg-red-500'}`} />
                  <p className="font-medium">
                    {!transaction.isPayer ? 
                      `De ${transaction.fromName || 'Desconocido'}` : 
                      `A ${transaction.toName || 'Desconocido'}`}
                  </p>
                </div>
                <p className="text-sm text-surface-500">{transaction.reason || "Sin concepto"}</p>
                <p className="text-xs text-surface-400">
                  {format(new Date(transaction.date), 'HH:mm')}
                </p>
              </div>
              <p className={`font-semibold ${!transaction.isPayer ? 'text-highlight-600' : 'text-red-600'}`}>
                {!transaction.isPayer ? '+' : '-'} {formatMoney(transaction.amount)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}