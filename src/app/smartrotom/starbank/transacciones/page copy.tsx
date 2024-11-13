"use client";
import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { getValidAccountId } from "../bankUtils";
import { AccountImage } from "../_components/AccountImage";
import { Search } from "lucide-react";
import { strToDate } from "@/lib/utils";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { filterTransactions } from "../_util/TransactionFilter";
import { BankSectionButton } from "../_components/BankSection";
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

export default function Transacciones() {
  const { session } = useBoffSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    { header: "", accessorKey: "isPayer" },
    { header: "Razón", accessorKey: "reason" },
    { header: "Cantidad", accessorKey: "amount" },
    { header: "Saldo", accessorKey: "balance" },
    { header: "Fecha", accessorKey: "date" },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchTerm,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 8,
      },
    },
    onGlobalFilterChange: setSearchTerm,
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: filterTransactions,
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
      const transactionData = res.map((transaction:Transaction) => {
        const isActiveAccount = transaction.from == account;
        return {
          isPayer: isActiveAccount,
          reason: transaction.reason,
          amount: (
            <span>
              {isActiveAccount ? "-" : "+"}
              {transaction.amount} ¥
            </span>
          ),
          balance: (
            <span>
              {transaction.fromBalance} ¥
            </span>
          ),
          date: strToDate(transaction.date),
        };
      });

      setTransactions(transactionData);
    });
  }, [accounts]);

  if (accounts.length === 0) return <div>Cargando...</div>;
  return (
    <main className="h-full flex flex-col max-w-6xl mx-auto space-y-6 p-4">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-center justify-between  max-h-[15%]">
        <div className="relative flex-grow w-full">
          <input
            type="text"
            placeholder="Buscar transacciones..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-main-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-main-400" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden w-full mx-auto  h-[65%]">
        <table className="min-w-full divide-y divide-main-200">
          <thead className="bg-blue-950 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-main-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50">
                {row.getVisibleCells().map((cell) => {
                  let extraClasses = "";
                  let cellValue = cell.getValue();

                  if (cell.column.id === "amount") {
                    extraClasses += cell.row.original.isPayer
                      ? "text-red-500"
                      : "text-green-500";
                  }

                  if (cell.column.id === "date") {
                    cellValue = strToDate(cellValue as string);
                  }

                  if (cell.column.id === "isPayer") {
                    cellValue = (
                      <AccountImage
                        height={32}
                        width={32}
                        account={cell.row.original}
                        activeAccount={activeAccount}
                      />
                    );
                  }

                  return (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 whitespace-nowrap ${extraClasses}`}
                    >
                      {cellValue as string}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (simplified for this example) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md  max-h-[15%]">
        <BankSectionButton onClick={() => table.previousPage()}>
          Anterior
        </BankSectionButton>
        <span className="text-sm text-main-700">
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
