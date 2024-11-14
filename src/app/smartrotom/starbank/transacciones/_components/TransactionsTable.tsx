import {
  ColumnDef,
  ColumnFiltersState,
  Table,
  flexRender,
} from "@tanstack/react-table";
import { AccountImage } from "../../_components/AccountImage";
import {
  filterAmount,
  filterDate,
  filterReason,
} from "../../_util/TransactionFilter";
import { CellDefProps } from "../page"; // Adjust the import path as needed
import { Input } from "@/components/ui/input";
import { strToDate } from "@/lib/utils";
import { formatMoney } from "../../bankUtils";

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
      const meta = table.options.meta as { activeAccount: number };
      return (
        <AccountImage
          height={32}
          width={32}
          // @ts-ignore
          account={row.original}
          activeAccount={meta.activeAccount}
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
  {
    header: "Fecha",
    accessorKey: "date",
    filterFn: filterDate,
    cell: renderDate,
  },
];

function renderMoney(props: CellDefProps<Transaction>) {
  const { cell, row, column } = props;
  const isPayer = row.original.isPayer;
  const isAmount = column.id === "amount";
  return (
    <div
      className={
        isAmount
          ? isPayer
            ? "text-red-500 flex items-center"
            : "text-green-500 flex items-center"
          : "font-bold flex items-center text-lg text-blue-950"
      }
    >
      <span className="mr-2">{formatMoney(cell.getValue() as number)}</span>
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
    <table className={`min-w-full divide-y divide-main-200`}>
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
              className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
              placeholder="Filtrar Transacciones"
              value={(columnFilters.find((f) => f.id === "reason")?.value as string) || ""}
              onChange={(e) => updateFilters("reason", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
              placeholder="Filtrar Cantidad"
              value={(columnFilters.find((f) => f.id === "amount")?.value as string) || ""}
              onChange={(e) => updateFilters("amount", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
              placeholder="Filtrar Saldo"
              value={(columnFilters.find((f) => f.id === "balance")?.value as string) || ""}
              onChange={(e) => updateFilters("balance", e.target.value)}
            />
          </th>
          <th>
            <Input
              className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
              placeholder="Filtrar Fecha"
              value={(columnFilters.find((f) => f.id === "date")?.value as string) || ""}
              onChange={(e) => updateFilters("date", e.target.value)}
            />
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-main-200 ">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-blue-50">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-6 py-2 whitespace-nowrap text-sm text-text-tertiary "
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
