import {
  ColumnDef,
  ColumnFiltersState,
  Table,
  flexRender,
} from "@tanstack/react-table";
import { JapaneseYen } from "lucide-react";
import { AccountImage } from "../../_components/AccountImage";
import {
  filterAmount,
  filterDate,
  filterReason,
} from "../../_util/TransactionFilter";
import { CellDefProps } from "../page"; // Adjust the import path as needed
import { Input } from "@/components/ui/input";
import { strToDate } from "@/lib/utils";

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

export const columns: ColumnDef<Transaction>[] = [
  {
    header: "Razón",
    accessorKey: "isPayer",
    cell: (props: CellDefProps<Transaction>) => {
      const { row, table } = props;
      return (
        <AccountImage
          height={32}
          width={32}
          account={row.original}
          activeAccount={table.options.meta.activeAccount}
        />
      );
    },
  },
  { header: "", accessorKey: "reason", filterFn: filterReason },
  {
    header: "Cantidad",
    accessorKey: "amount",
    filterFn: filterAmount,
    cell: renderMoney,
  },
  {
    header: "Saldo",
    accessorKey: "balance",
    filterFn: filterAmount,
    cell: renderMoney,
  },
  { header: "Fecha", accessorKey: "date", filterFn: filterDate, cell: renderDate },
];

function renderMoney(props: CellDefProps<Transaction>) {
  const { cell, row, column } = props;
  const isPayer = row.original.isPayer;
  const isAmount = column.id === "amount";
  return (
    <div
      className={
        isAmount ? isPayer
          ? "text-red-500 flex items-center"
          : "text-green-500 flex items-center"
          : "font-bold flex items-center text-lg text-blue-950"
      }
    >
      <span className="mr-2">{cell.getValue() as React.ReactNode}</span>
      <JapaneseYen size={16} />
    </div>
  );
}

function renderDate(props: CellDefProps<Transaction>) {
  const { cell } = props;
  return strToDate(cell.getValue() as string);
}

export function TransactionsTable({
  table,
  columnFilters,
  updateFilters,
  className,
}: {
  table: Table<Transaction>;
  columnFilters: ColumnFiltersState;
  updateFilters: any;
  className?: string;
}) {
  return (
    <table className={`min-w-full divide-y divide-gray-200`}>
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
        <tr>
          <th colSpan={2}>
            <Input
              className="bg-blue-800 text-white placeholder-white border-none"
              placeholder="Filtrar transacciones"
              value={columnFilters.find((f) => f.id === "reason")?.value || ""}
              onChange={(e) => updateFilters("reason", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="bg-blue-800 text-white  border-none"
              placeholder="Filtrar Cantidad"
              value={columnFilters.find((f) => f.id === "amount")?.value || ""}
              onChange={(e) => updateFilters("amount", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="bg-blue-800 text-white  border-none"
              placeholder="Filtrar Saldo"
              value={columnFilters.find((f) => f.id === "balance")?.value || ""}
              onChange={(e) => updateFilters("balance", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="bg-blue-800 text-white  border-none"
              placeholder="Filtrar Fecha"
              value={columnFilters.find((f) => f.id === "date")?.value || ""}
              onChange={(e) => updateFilters("date", e.target.value)}
            />
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 ">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-blue-50">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 "
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
