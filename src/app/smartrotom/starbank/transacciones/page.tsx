"use client";
import { rotomGET } from "@/services/boffAPI";
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

interface Transaction {
  from: number;
  to: number;
  amount: number;
  fromBalance: number;
  toBalance: number;
  reason: string;
  type: string;
  date: string;
  isPayer: boolean;
}

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
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
        pageSize: 12,
      },
    },
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      activeAccount,
    },
  });

  useEffect(() => {
    if (session?.user) {
      rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid).then(
        (res) => {
          setAccounts(res);
        }
      );
    }
  }, [session]);

  useEffect(() => {
    if (accounts.length === 0) return;
    const account = getValidAccountId(accounts);
    setActiveAccount(account);

    rotomGET("/starbank/transactions/" + account).then((res) => {
      const transactionData = res.map((transaction: Transaction) => {
        const isActiveAccount = transaction.from == account;
        return {
          isPayer: isActiveAccount,
          reason: transaction.reason,
          amount: transaction.amount,
          balance: isActiveAccount ? transaction.fromBalance : transaction.toBalance,
          date: transaction.date,
        };
      });

      setTransactions(transactionData);
    });
  }, [accounts]);

  function updateFilters(columnId: string, value: string) {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    if (value) {
      newFilters.push({ id: columnId, value });
    }
    setColumnFilters(newFilters);
  }

  if (accounts.length === 0) return <div>Cargando...</div>;
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
      {/* Pagination (simplified for this example) */}
      <div className="flex justify-between items-center bg-white p-4 shadow-md max-h-[15%] rounded-md border border-blue-200">
        <BankSectionButton onClick={() => table.previousPage()}>
          Anterior
        </BankSectionButton>
        <span className="text-sm text-gray-700">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>
        <BankSectionButton
          onClick={() =>
            table.getState().pagination.pageIndex + 1 < table.getPageCount()
              ? table.nextPage()
              : null
          }
        >
          Siguiente
        </BankSectionButton>
      </div>
    </main>
  );
}

function esPagador(transaction: any, activeAccount: any) {
  return transaction.from == activeAccount;
}