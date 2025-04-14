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
import { CellDefProps } from "../page";
import { Input } from "@/components/ui/input";
import { strToDate } from "@/lib/utils";
import { formatMoney } from "../../bankUtils";
import { Transaction } from "@/types/starbank";

// Import shadcn table components
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className={className}>
      <ShadcnTable variant="wingull">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
          <TableRow>
            <TableHead colSpan={2}>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
                placeholder="Filtrar Transacciones"
                value={(columnFilters.find((f) => f.id === "reason")?.value as string) || ""}
                onChange={(e) => updateFilters("reason", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
                placeholder="Filtrar Cantidad"
                value={(columnFilters.find((f) => f.id === "amount")?.value as string) || ""}
                onChange={(e) => updateFilters("amount", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
                placeholder="Filtrar Saldo"
                value={(columnFilters.find((f) => f.id === "balance")?.value as string) || ""}
                onChange={(e) => updateFilters("balance", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-opacity-80 bg-blue-400 text-white placeholder:text-white border-none font-thin"
                placeholder="Filtrar Fecha"
                value={(columnFilters.find((f) => f.id === "date")?.value as string) || ""}
                onChange={(e) => updateFilters("date", e.target.value)}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-blue-50 h-11">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}