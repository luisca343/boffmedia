"use client";
import { useEffect, useState } from "react";
import { getValidAccountId } from "../bankUtils";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  Table,
  Row,
  Column,
  Cell,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { BankSection, BankSectionButton } from "../_components/BankSection";
import { TransactionsTable, columns } from "./_components/TransactionsTable";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { AccountSelect } from "../_components/AccountSelect";
import { Input } from "@/components/ui/primitives/input";
import { formatMoney, getActiveAccountBalance, changeActiveAccount } from "../bankUtils";
import { Search } from "lucide-react";
import { TransactionSkeleton } from "./_components/TransactionSkeleton";
import { SummaryCard } from "../_components/SummaryCard";
import { ArrowDownIcon, ArrowUpIcon, ChevronUpDownIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { StarBankTransaction } from "@/generated/api";
import useStarBank from "../_hooks/useStarBank";

export interface CellDefProps<TData> {
  table: Table<TData>;
  row: Row<TData>;
  column: Column<TData>;
  cell: Cell<TData, unknown>;
  getValue: () => any;
  renderValue: () => any;
}

function calculateTransactionStats(transactions: StarBankTransaction[], activeAccount: number) {
  let income = 0;
  let expense = 0;

  transactions.forEach(transaction => {
    if (!transaction.isPayer) {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  });

  return { income, expense, net: income - expense };
}

export default function Transacciones() {
  const { session } = useBoffSession();
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const [transactions, setTransactions] = useState<StarBankTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [stats, setStats] = useState({ income: 0, expense: 0, net: 0 });

  const { transactions: fetchedTransactions, error: transactionsError, isLoading: transactionsLoading } = useGetTransactions(activeAccount?.id ?? -1);

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter: searchTerm,
      columnFilters,
      sorting,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      activeAccount,
    },
  });

  useEffect(() => {
    if (fetchedTransactions && activeAccount) {
      setTransactions(fetchedTransactions);
      setStats(calculateTransactionStats(fetchedTransactions, activeAccount.id));
    }
  }, [fetchedTransactions, activeAccount]);

  function updateFilters(columnId: string, value: string) {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    if (value) {
      newFilters.push({ id: columnId, value });
    }
    setColumnFilters(newFilters);
  }

  function handleAccountChange(accountId: any) {
    changeActiveAccount(Number(accountId));
    setActiveAccount(Number(accountId));
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  if (!accounts || transactionsLoading) return <TransactionSkeleton />;
  if (transactionsError) return <div>Error: {transactionsError}</div>;

  const currentAccount = activeAccount;

  return (
    <main className="max-w-[90%] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BankSection className="md:col-span-4 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Historial de Transacciones</h1>
              <p className="text-blue-600">
                Mostrando transacciones para la cuenta <span className="font-medium">{currentAccount?.name || 'Cargando...'}</span>
              </p>
            </div>
            
            <div className="w-full md:w-auto">
              <AccountSelect
                accounts={accounts}
                activeAccount={activeAccount}
                setActiveAccount={handleAccountChange}
                className="w-full md:w-64"
              />
            </div>
          </div>
        </BankSection>
        
        <SummaryCard 
          title="Balance Actual"
          value={formatMoney(getActiveAccountBalance(accounts!, activeAccount))}
          icon={<ChevronUpDownIcon className="h-6 w-6" />}
          className="md:col-span-1"
        />
        
        <SummaryCard 
          title="Ingresos Totales"
          value={formatMoney(stats.income)}
          icon={<ArrowUpIcon className="h-6 w-6 text-success-500" />}
          //change={{ value: 5.2, isPositive: true }}
          className="md:col-span-1"
        />
        
        <SummaryCard 
          title="Gastos Totales"
          value={formatMoney(stats.expense)}
          icon={<ArrowDownIcon className="h-6 w-6 text-error-500" />}
          //change={{ value: 2.8, isPositive: false }}
          className="md:col-span-1"
        />
  {/* Removed 'Total Neto' card as net is always equal to current balance */}
      </div>

      {/* Search and Filter */}
      <BankSection className="bg-white rounded-lg border border-blue-200 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input 
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-blue-50"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <span>Mostrando {table.getFilteredRowModel().rows.length} de {transactions.length} transacciones</span>
          </div>
        </div>
      </BankSection>

      {/* Transactions Table */}
      <BankSection variant="noPadding" className="bg-white rounded-lg overflow-hidden border border-blue-200">
        <TransactionsTable
          table={table}
          columnFilters={columnFilters}
          updateFilters={updateFilters}
        />
      </BankSection>
      
      {/* Pagination */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm rounded-md border border-blue-200">
        <div className="flex items-center gap-2">
          <BankSectionButton 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </BankSectionButton>
          
          <BankSectionButton 
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </BankSectionButton>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-700">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-blue-200 rounded text-sm bg-blue-50"
          >
            {[10, 25, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Mostrar {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </main>
  );
}