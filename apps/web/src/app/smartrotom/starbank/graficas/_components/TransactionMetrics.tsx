"use client";

import { formatMoney } from "../../bankUtils";
import { ArrowUpCircle, ArrowDownCircle, BarChart2, TrendingUp } from "lucide-react";

interface MetricsProps {
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    averageTransaction: number;
    largestExpense: number;
    largestIncome: number;
    transactionCount: number;
  };
  accountName: string;
}

export default function TransactionMetrics({ metrics, accountName }: MetricsProps) {
  const {
    totalIncome,
    totalExpenses,
    averageTransaction,
    largestExpense,
    largestIncome,
    transactionCount
  } = metrics;
  
  const netBalance = totalIncome - totalExpenses;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income card */}
      <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-600 font-medium">Ingresos Totales</p>
            <p className="text-2xl font-bold text-highlight-600 mt-1">
              {formatMoney(totalIncome)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-highlight-100 flex items-center justify-center text-highlight-600">
            <ArrowUpCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-2">{accountName}</p>
      </div>

      {/* Expenses card */}
      <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-600 font-medium">Gastos Totales</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatMoney(totalExpenses)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <ArrowDownCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-2">{accountName}</p>
      </div>

      {/* Net Balance card */}
      <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-600 font-medium">Balance Neto</p>
            <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-highlight-600' : 'text-red-600'}`}>
              {formatMoney(netBalance)}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-full ${netBalance >= 0 ? 'bg-highlight-100 text-highlight-600' : 'bg-red-100 text-red-600'} flex items-center justify-center`}>
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-2">{`${transactionCount} transacciones`}</p>
      </div>

      {/* Average Transaction card */}
      <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-600 font-medium">Transacción Promedio</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {formatMoney(averageTransaction)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <BarChart2 className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-2">
          Max: {formatMoney(Math.max(largestIncome, largestExpense))}
        </p>
      </div>
    </div>
  );
}