"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import TransactionCharts from "./_components/TransactionCharts";
import TransactionMetrics from "./_components/TransactionMetrics";
import DateRangeSelector from "./_components/DateRangeSelector";
import TransactionTypeDistribution from "./_components/TransactionTypeDistribution";
import { AccountSelect } from "../_components/AccountSelect";
import { useBoffSession } from "@/services/useBoffSession";
import useStarBank from "../_hooks/useStarBank";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { ChartsSkeleton } from "./_components/ChartsSkeleton";
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { Calendar } from "@/components/ui/primitives/calendar";
import { Button } from "@/components/ui/primitives/button";
import { formatMoney, changeActiveAccount } from "../bankUtils";
import { StarBankAccount, StarBankTransaction } from "@boffmedia/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Graficas() {
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date]>([
    new Date(new Date().setMonth(new Date().getMonth() - 1)), // Last month
    new Date() // Today
  ]);
  
  // Get account data from the hook
  const { accounts, activeAccount, setActiveAccount } = useStarBank();

  // Store the active account ID in local state to ensure consistency
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(null);
  
  // Track whether we're switching accounts to prevent unnecessary skeleton shows
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  
  // Initialize metrics state
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    averageTransaction: 0,
    largestExpense: 0,
    largestIncome: 0,
    transactionCount: 0
  });

  // Update the current account ID when activeAccount changes
  useEffect(() => {
    if (activeAccount && activeAccount.id !== undefined) {
      setCurrentAccountId(activeAccount.id);
    }
  }, [activeAccount]);

  // Use the account ID for the transactions query with null fallback
  const { 
    transactions, 
    isLoading: transactionsLoading, 
    refetch: refetchTransactions,
    error: transactionsError
  } = useGetTransactions(currentAccountId ?? -1);

  // Refetch transactions when the account changes
  useEffect(() => {
    if (currentAccountId && currentAccountId !== -1) {
      setIsSwitchingAccount(true);
      refetchTransactions()
        .then(() => {
          setIsSwitchingAccount(false);
        });
    }
  }, [currentAccountId, refetchTransactions]);

  // Handle account change - optimize to prevent unnecessary re-renders
  const handleAccountChange = useCallback((accountId: number) => {
    // Only proceed if we're actually changing accounts
    if (accountId !== currentAccountId) {
      setIsSwitchingAccount(true);
      
      // Find the account object with the matching ID
      const selectedAccount = accounts?.find((acc: StarBankAccount) => acc.id === accountId);
      
      if (selectedAccount) {
        // Use changeActiveAccount utility to save to localStorage
        changeActiveAccount(accountId);
        setActiveAccount(selectedAccount.id);
      }
    }
  }, [accounts, setActiveAccount, currentAccountId]);

  // Custom handler for AccountSelect component
  const handleAccountSelect = (account: StarBankAccount) => {
    if (account && account.id) {
      // Use changeActiveAccount utility to save to localStorage
      changeActiveAccount(account.id);
    }
  };

  // Filter transactions by the selected date range - using useMemo for performance
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((tx: StarBankTransaction) => {
      try {
        const txDate = new Date(tx.date);
        return txDate >= selectedDateRange[0] && txDate <= selectedDateRange[1];
      } catch (e) {
        console.error("Error parsing date:", e);
        return false;
      }
    });
  }, [transactions, selectedDateRange]);

  // Process transaction data for metrics
  useEffect(() => {
    // Make sure we have all the data we need before calculating
    if (!filteredTransactions.length || !currentAccountId) return;
    
    // Calculate metrics
    let incomeTotal = 0;
    let expensesTotal = 0;
    let largestExpense = 0;
    let largestIncome = 0;
    let sum = 0;
    
    filteredTransactions.forEach((transaction: StarBankTransaction) => {
      const amount = transaction.amount;
      sum += amount;
      
      if (transaction.from === currentAccountId) {
        expensesTotal += amount;
        largestExpense = Math.max(largestExpense, amount);
      } else {
        incomeTotal += amount;
        largestIncome = Math.max(largestIncome, amount);
      }
    });
    
    // Only update metrics state if values have changed
    const newMetrics = {
      totalIncome: incomeTotal,
      totalExpenses: expensesTotal,
      averageTransaction: filteredTransactions.length > 0 ? sum / filteredTransactions.length : 0,
      largestExpense,
      largestIncome,
      transactionCount: filteredTransactions.length
    };
    
    setMetrics(newMetrics);
  }, [filteredTransactions, currentAccountId]);
  
  // Determine if we should show the loading state
  const shouldShowSkeleton = useMemo(() => {
    return (
      !accounts || 
      accounts.length === 0 || 
      (transactionsLoading && !isSwitchingAccount) || 
      !activeAccount
    );
  }, [accounts, transactionsLoading, activeAccount, isSwitchingAccount]);
  
  // Show loading state until all necessary data is available
  if (shouldShowSkeleton) {
    return <ChartsSkeleton />;
  }

  // Error state
  if (transactionsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-surface-700">No se pudieron cargar los datos. Por favor, intente nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[90%] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header section with account selector and date range picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BankSection className="w-full">
          <BankSectionHeader>Seleccionar Cuenta</BankSectionHeader>
          <BankSectionContent>
            <div className="w-full">
              {accounts && accounts.length > 0 && (
                <AccountSelect 
                  accounts={accounts}
                  activeAccount={activeAccount}
                  setActiveAccount={(account: any) => {
                    if (account) {
                      changeActiveAccount(account);
                    }
                    setActiveAccount(account);
                  }}
                  id="account-select"
                  className="w-full"
                />
              )}
            </div>
          </BankSectionContent>
        </BankSection>

        <BankSection className="w-full">
          <BankSectionHeader>Periodo de Análisis</BankSectionHeader>
          <BankSectionContent>
            <DateRangeSelector 
              dateRange={selectedDateRange} 
              onDateChange={setSelectedDateRange}
            />
          </BankSectionContent>
        </BankSection>
      </div>
      
      {/* Metrics cards */}
      <TransactionMetrics 
        metrics={metrics} 
        accountName={activeAccount?.name || ""}
      />
      
      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance evolution chart */}
        <BankSection className="w-full">
          <BankSectionHeader>Evolución de Balance</BankSectionHeader>
          <BankSectionContent>
            {filteredTransactions && filteredTransactions.length > 0 ? (
              <TransactionCharts 
                transactions={filteredTransactions} 
                activeAccount={activeAccount}
                chartType="balance" 
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-surface-700">No hay transacciones para mostrar en el periodo seleccionado.</p>
              </div>
            )}
          </BankSectionContent>
        </BankSection>
        
        {/* Income/Expenses chart */}
        <BankSection className="w-full">
          <BankSectionHeader>Ingresos y Gastos</BankSectionHeader>
          <BankSectionContent>
            {filteredTransactions && filteredTransactions.length > 0 ? (
              <TransactionCharts 
                transactions={filteredTransactions} 
                activeAccount={activeAccount}
                chartType="inout" 
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-surface-700">No hay transacciones para mostrar en el periodo seleccionado.</p>
              </div>
            )}
          </BankSectionContent>
        </BankSection>
      </div>
      
      {/* Transaction type distribution */}
      <BankSection className="w-full">
        <BankSectionHeader>Distribución por Tipo de Transacción</BankSectionHeader>
        <BankSectionContent>
          {filteredTransactions && filteredTransactions.length > 0 ? (
            <TransactionTypeDistribution 
              transactions={filteredTransactions} 
              activeAccount={activeAccount!}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-surface-700">No hay transacciones para mostrar en el periodo seleccionado.</p>
            </div>
          )}
        </BankSectionContent>
      </BankSection>
    </div>
  );
}