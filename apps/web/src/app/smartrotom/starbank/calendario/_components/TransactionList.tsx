"use client";

import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Card } from "@/components/ui/primitives/card";
import { formatMoney } from "../../bankUtils";
import { CalendarIcon } from "lucide-react";
import { StarBankTransaction } from "@boffmedia/shared";

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
            className="p-4 cursor-pointer hover:bg-blue-50 transition-colors border-l-4"
            style={{
              borderLeftColor: !transaction.isPayer ? '#10b981' : '#ef4444'
            }}
            onClick={() => onSelectTransaction(transaction)}
            variant="wingull"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${!transaction.isPayer ? 'bg-warning' : 'bg-red-500'}`} />
                  <p className="font-medium text-blue-900">
                    {!transaction.isPayer ? 
                      `De ${transaction.fromName || 'Desconocido'}` : 
                      `A ${transaction.toName || 'Desconocido'}`}
                  </p>
                </div>
                <p className="text-sm text-ink-dim">{transaction.reason || "Sin concepto"}</p>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>{format(new Date(transaction.date), 'HH:mm')}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {transaction.type}
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className={`font-semibold text-lg ${!transaction.isPayer ? 'text-warning' : 'text-red-600'}`}>
                  {!transaction.isPayer ? '+' : '-'} {formatMoney(transaction.amount)}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Balance: {formatMoney(transaction.isPayer ? transaction.fromBalance : transaction.toBalance)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}