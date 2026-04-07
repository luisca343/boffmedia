"use client";

import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from "recharts";
import { formatMoney } from "../../bankUtils";
import { StarBankAccount, StarBankTransaction } from "@boffmedia/shared";

interface TransactionTypeDistributionProps {
  transactions: StarBankTransaction[];
  activeAccount: StarBankAccount;
}

export default function TransactionTypeDistribution({ 
  transactions, 
  activeAccount 
}: TransactionTypeDistributionProps) {
  
  // Process transaction data by type
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !activeAccount) return [];
    
    // Group transactions by type
    const typeGroups = transactions.reduce((groups: Record<string, any>, transaction) => {
      const type = transaction.type || 'OTROS';
      
      if (!groups[type]) {
        groups[type] = {
          type,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (transaction.from === activeAccount.id) {
        groups[type].expense += transaction.amount;
      } else {
        groups[type].income += transaction.amount;
      }
      
      groups[type].count += 1;
      
      return groups;
    }, {});
    
    // Convert to array for chart
    return Object.values(typeGroups);
  }, [transactions, activeAccount]);
  
  return (
    <div className="h-[400px] w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="type" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => value.charAt(0) + value.slice(1).toLowerCase()}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => formatMoney(value).replace('MX$', '').trim()} 
            />
            <Tooltip 
              formatter={(value: number) => formatMoney(value)} 
              labelFormatter={(label) => `Tipo: ${label.charAt(0) + label.slice(1).toLowerCase()}`}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-blue-200 rounded shadow">
                      <p className="font-medium">{`Tipo: ${label.charAt(0) + label.slice(1).toLowerCase()}`}</p>
                      <p className="text-highlight-700">{`Ingresos: ${formatMoney(data.income)}`}</p>
                      <p className="text-red-700">{`Gastos: ${formatMoney(data.expense)}`}</p>
                      <p className="text-surface-600">{`Transacciones: ${data.count}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="income" name="Ingresos" fill="#10b981" />
            <Bar dataKey="expense" name="Gastos" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full bg-blue-50 rounded-lg">
          <p className="text-blue-800">No hay suficientes datos para mostrar el gráfico</p>
        </div>
      )}
      
      <div className="text-sm text-center text-surface-500 mt-4">
        Distribución de transacciones por tipo
      </div>
    </div>
  );
}