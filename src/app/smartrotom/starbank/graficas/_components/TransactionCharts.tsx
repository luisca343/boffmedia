"use client";

import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatMoney } from "../../bankUtils";
import { StarBankAccount, FullTransaction } from "@/types/starbank";

// Chart colors
const INCOME_COLOR = '#10b981';
const EXPENSE_COLOR = '#ef4444';
const BALANCE_COLOR = '#3b82f6';

interface TransactionChartsProps {
  transactions: FullTransaction[];
  activeAccount: any;
  chartType: 'balance' | 'inout';
}

export default function TransactionCharts({ 
  transactions, 
  activeAccount,
  chartType 
}: TransactionChartsProps) {
  
  // Prepare data for balance chart - group by date
  const balanceData = useMemo(() => {
    if (!transactions || transactions.length < 2 || !activeAccount) return [];
    
    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create data points with running balance
    const dataPoints = sortedTransactions.map((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      const isFromActiveAccount = transaction.from === activeAccount.id;
      
      // Determine the balance for this transaction based on whether it's from or to the active account
      let balance = isFromActiveAccount ? transaction.fromBalance : transaction.toBalance;
      
      return {
        date,
        balance,
        amount: transaction.amount,
        concept: transaction.reason || "Transferencia",
        type: transaction.type
      };
    });
    
    return dataPoints;
  }, [transactions, activeAccount]);
  
  // Prepare data for income/expense pie chart
  const pieChartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !activeAccount) return [];
    
    let income = 0;
    let expense = 0;
    
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      // If active account is the sender, it's an expense
      if (transaction.from === activeAccount.id) {
        expense += amount;
      } 
      // If active account is the receiver, it's income
      else if (transaction.to === activeAccount.id) {
        income += amount;
      }
    });
    
    return [
      { name: "Ingresos", value: income },
      { name: "Gastos", value: expense }
    ];
  }, [transactions, activeAccount]);
  
  // Calculate total income and expense
  const totalIncome = pieChartData[0]?.value || 0;
  const totalExpense = pieChartData[1]?.value || 0;
  
  if (chartType === 'balance') {
    return (
      <div className="h-[350px] w-full">
        {balanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={balanceData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BALANCE_COLOR} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={BALANCE_COLOR} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => value.split('/').slice(0, 2).join('/')}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => formatMoney(value).replace('MX$', '').trim()} 
              />
              <Tooltip 
                formatter={(value: number) => formatMoney(value)} 
                labelFormatter={(label) => `Fecha: ${label}`}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-secondary-200 rounded shadow">
                        <p className="font-medium">{`Fecha: ${label}`}</p>
                        <p className="text-secondary-700">{`Balance: ${formatMoney(data.balance)}`}</p>
                        <p className="text-sm text-surface-600">{`Concepto: ${data.concept}`}</p>
                        <p className="text-sm text-surface-600">{`Tipo: ${data.type}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke={BALANCE_COLOR} 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                name="Balance" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-secondary-50 rounded-lg">
            <p className="text-secondary-800">No hay suficientes datos para mostrar el gráfico</p>
          </div>
        )}
      </div>
    );
  }
  
  // Income/Expense chart (pie chart)
  return (
    <div className="h-[350px] w-full">
      {totalIncome > 0 || totalExpense > 0 ? (
        <div className="flex flex-col md:flex-row items-center h-full">
          <div className="w-full md:w-3/5 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  <Cell key={`cell-0`} fill={INCOME_COLOR} />
                  <Cell key={`cell-1`} fill={EXPENSE_COLOR} />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatMoney(value)} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full md:w-2/5 p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-900">Resumen Financiero</h3>
            
            <div className="space-y-4">
              <div className="bg-highlight-50 p-4 rounded-lg">
                <div className="text-sm text-highlight-600 mb-1">Total Ingresos</div>
                <div className="text-2xl font-bold text-highlight-700">{formatMoney(totalIncome)}</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600 mb-1">Total Gastos</div>
                <div className="text-2xl font-bold text-red-700">{formatMoney(totalExpense)}</div>
              </div>
              
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Balance Neto</div>
                <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-highlight-700' : 'text-red-700'}`}>
                  {formatMoney(totalIncome - totalExpense)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full bg-secondary-50 rounded-lg">
          <p className="text-secondary-800">No hay suficientes datos para mostrar el gráfico</p>
        </div>
      )}
    </div>
  );
}