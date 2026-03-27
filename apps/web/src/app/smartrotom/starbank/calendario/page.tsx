"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import useStarBank from "../_hooks/useStarBank";
import { ChartsSkeleton } from "../graficas/_components/ChartsSkeleton";
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { formatMoney, changeActiveAccount } from "../bankUtils";
import { Badge } from "@/components/ui/primitives/badge";
import { CalendarIcon, Filter } from "lucide-react";
import { FinancialCalendar } from "./_components/FinancialCalendar";
import { TransactionList } from "./_components/TransactionList";
import { FilterPopover } from "./_components/FilterPopover";
import { TransactionDialog } from "./_components/TransactionDialog";
import { AccountSelect } from "../_components/AccountSelect";
import { StarBankTransaction } from "@boffmedia/shared";

// Group transactions by date
interface TransactionsByDate {
  [date: string]: StarBankTransaction[];
}

export default function Calendario() {
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'TRANSFERENCIA', 'COMPRA', 'VENTA', 'BONUS'
  ]);
  const [monthView, setMonthView] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  // Use the account ID for the transactions query
  const { 
    transactions, 
    isLoading: transactionsLoading, 
    refetch: refetchTransactions,
    error: transactionsError
  } = useGetTransactions(activeAccount?.id ?? -1, 500);

  // Refetch transactions when the account changes
  useEffect(() => {
    if (activeAccount?.id) {
      setIsSwitchingAccount(true);
      refetchTransactions()
        .then(() => {
          setIsSwitchingAccount(false);
        });
    }
  }, [activeAccount, refetchTransactions]);

  // Handle account selection with localStorage update
  const handleAccountSelect = (account: any) => {
    if (account) {
      changeActiveAccount(account);
      setActiveAccount(account);
    }
  };

  // Group transactions by date for calendar display
  const transactionsByDate = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return {};
    
    // Filter by selected transaction types
    const filteredTransactions = transactions.filter(tx => selectedTypes.includes(tx.type));
    
    // Group by date
    return filteredTransactions.reduce((acc: TransactionsByDate, tx) => {
      try {
        const txDate = new Date(tx.date);
        
        // Check if date is valid
        if (isNaN(txDate.getTime())) {
          console.warn("Invalid transaction date:", tx.date);
          return acc;
        }
        
        const dateKey = format(txDate, 'yyyy-MM-dd');
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        acc[dateKey].push({
          ...tx,
          isPayer: tx.isPayer
        });
        
      } catch (error) {
        console.error("Error processing transaction:", error, tx);
      }
      
      return acc;
    }, {});
  }, [transactions, activeAccount, selectedTypes]);

  // Get the transactions for the selected day
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay || !transactionsByDate || isNaN(selectedDay.getTime())) {
      return [];
    }
    
    try {
      const dateKey = format(selectedDay, 'yyyy-MM-dd');
      return transactionsByDate[dateKey] || [];
    } catch (error) {
      console.error("Error formatting selected day:", error);
      return [];
    }
  }, [selectedDay, transactionsByDate]);

  // Get the list of unique transaction types for the filter
  const transactionTypes = useMemo(() => {
    if (!transactions) return [];
    
    const types = new Set<string>();
    transactions.forEach(tx => {
      if (tx.type) types.add(tx.type);
    });
    
    return Array.from(types);
  }, [transactions]);

  // Handle filter change
  const handleFilterChange = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Navigate to today
  const handleTodayClick = () => {
    setMonthView(new Date());
    setSelectedDay(new Date());
  };
  
  // Determine if we should show the loading state
  const isLoading = useMemo(() => {
    return !accounts || accounts.length === 0 || (transactionsLoading && !isSwitchingAccount);
  }, [accounts, transactionsLoading, isSwitchingAccount]);
  
  if (isLoading) {
    return <ChartsSkeleton />;
  }

  // Count total transactions in the current view
  const totalTransactions = Object.values(transactionsByDate).reduce(
    (sum, txs) => sum + txs.length, 
    0
  );

  return (
    <div className="max-w-[95%] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar Section */}
        <BankSection className="w-full md:w-3/5">
          <BankSectionHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Calendario Financiero</h1>
                <Badge variant="outline" className="ml-2">
                  {totalTransactions} transacciones
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <AccountSelect 
                  accounts={accounts}
                  activeAccount={activeAccount}
                  setActiveAccount={handleAccountSelect}
                  className="w-48"
                />
                
                <FilterPopover 
                  transactionTypes={transactionTypes}
                  selectedTypes={selectedTypes}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </BankSectionHeader>
          
          <BankSectionContent>
            <FinancialCalendar 
              monthView={monthView}
              setMonthView={setMonthView}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              transactionsByDate={transactionsByDate}
              onTodayClick={handleTodayClick}
            />
          </BankSectionContent>
        </BankSection>

        {/* Transactions for Selected Day Section */}
        <BankSection className="w-full md:w-2/5">
          <BankSectionHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-medium">
                {selectedDay ? format(selectedDay, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccione una fecha"}
              </h2>
              {selectedDayTransactions.length > 0 && (
                <Badge>
                  {selectedDayTransactions.length} {selectedDayTransactions.length === 1 ? "transacción" : "transacciones"}
                </Badge>
              )}
            </div>
          </BankSectionHeader>
          
          <BankSectionContent>
            <TransactionList 
              transactions={selectedDayTransactions}
              onSelectTransaction={setSelectedEvent}
            />
          </BankSectionContent>
        </BankSection>
      </div>

      {/* Transaction Detail Dialog */}
      {selectedEvent && (
        <TransactionDialog
          transaction={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}