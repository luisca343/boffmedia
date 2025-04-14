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
} from "@tanstack/react-table";
import { BankSection, BankSectionButton } from "../_components/BankSection";
import { TransactionsTable, columns } from "./_components/TransactionsTable";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { FullTransaction, Transaction } from "@/types/starbank";

export interface CellDefProps<TData> {
  table: Table<TData>;
  row: Row<TData>;
  column: Column<TData>;
  cell: Cell<TData, unknown>;
  getValue: () => any;
  renderValue: () => any;
}


export default function Transacciones() {
  const { session } = useBoffSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { accounts, error: accountsError, isLoading: accountsLoading } = useGetAccounts(session?.user?.smartRotomUser?.uuid!);
  const { transactions: fetchedTransactions, error: transactionsError, isLoading: transactionsLoading } = useGetTransactions(activeAccount);

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchTerm,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 8,
      },
    },
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      activeAccount,
    },
  });

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const account = getValidAccountId(accounts);
      setActiveAccount(account);
    }
  }, [accounts]);

  useEffect(() => {
    if (fetchedTransactions) {
      const transactionData = fetchedTransactions.map((transaction: FullTransaction) => {
        const isActiveAccount = transaction.from == activeAccount;
        return {
          isPayer: isActiveAccount,
          reason: transaction.reason,
          amount: transaction.amount,
          balance: isActiveAccount ? transaction.fromBalance : transaction.toBalance,
          date: transaction.date,
        };
      });

      setTransactions(transactionData);
    }
  }, [fetchedTransactions, activeAccount]);

  function updateFilters(columnId: string, value: string) {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    if (value) {
      newFilters.push({ id: columnId, value });
    }
    setColumnFilters(newFilters);
  }

  if (accountsLoading || transactionsLoading) return <div>Cargando...</div>;
  if (accountsError || transactionsError) return <div>Error: {accountsError || transactionsError}</div>;

  return (
    <main className="h-full flex flex-col max-w-6xl mx-auto space-y-6 p-4">
      {/* Transactions Table */}
      <BankSection variant="noPadding" className=" bg-white rounded-lg overflow-hidden w-full mx-auto h-[75%]">
        <TransactionsTable
          table={table}
          columnFilters={columnFilters}
          updateFilters={updateFilters}
        />
      </BankSection>
      <div className="flex justify-between items-center bg-white p-4 shadow-md max-h-[15%] rounded-md border border-blue-200">
        <BankSectionButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </BankSectionButton>
        <span className="text-sm text-surface-700">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>
        <BankSectionButton
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </BankSectionButton>
      </div>
    </main>
  );
}

