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
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";

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
    header: "Cuenta",
    accessorKey: "isPayer",
    enableSorting: false,
    cell: (props: CellDefProps<Transaction>) => {
      const { row } = props;
      return (
        <div className="flex items-center gap-2">
          <AccountImage
            height={40}
            width={40}
            type={row.original.type!}
            name={row.original.name!}
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-secondary-900">{row.original.name}</p>
            <p className="text-xs text-secondary-600">{row.original.isPayer ? 'Salida' : 'Entrada'}</p>
          </div>
        </div>
      );
    },
  },
  { 
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting()}>
          Concepto
          <ArrowsUpDownIcon className="ml-1 h-4 w-4" />
        </div>
      );
    }, 
    accessorKey: "reason", 
    filterFn: filterReason 
  },
  {
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting()}>
          Cantidad
          <ArrowsUpDownIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    accessorKey: "amount",
    filterFn: filterAmount,
    cell: renderMoney,
    sortingFn: "alphanumeric",
  },
  {
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting()}>
          Saldo
          <ArrowsUpDownIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    accessorKey: "balance",
    filterFn: filterAmount,
    cell: renderBalance,
    sortingFn: "alphanumeric",
  },
  {
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer" onClick={() => column.toggleSorting()}>
          Fecha
          <ArrowsUpDownIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    accessorKey: "date",
    filterFn: filterDate,
    cell: renderDate,
  },
];

function renderMoney(props: CellDefProps<Transaction>) {
  const { cell, row } = props;
  const isPayer = row.original.isPayer;
  const amount = cell.getValue() as number;
  
  return (
    <div className={`flex items-center font-medium ${isPayer ? "text-red-600" : "text-emerald-600"}`}>
      {isPayer ? (
        <ArrowDownIcon className="h-4 w-4 mr-1" />
      ) : (
        <ArrowUpIcon className="h-4 w-4 mr-1" />
      )}
      {isPayer ? "- " : "+ "}
      {formatMoney(amount)}
    </div>
  );
}

function renderBalance(props: CellDefProps<Transaction>) {
  const { cell } = props;
  return (
    <div className="font-medium text-secondary-900">
      {formatMoney(cell.getValue() as number)}
    </div>
  );
}

function renderDate(props: CellDefProps<Transaction>) {
  const { cell } = props;
  return (
    <div className="text-sm text-secondary-700">
      {strToDate(cell.getValue() as string)}
    </div>
  );
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
        <TableHeader className="bg-secondary-50 sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-secondary-800 font-medium py-4">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
          <TableRow>
            <TableHead className="p-2">
              {/* Account filter intentionally left empty */}
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-secondary-100 bg-opacity-80 placeholder:text-secondary-900 border-secondary-200"
                placeholder="Filtrar Conceptos"
                value={(columnFilters.find((f) => f.id === "reason")?.value as string) || ""}
                onChange={(e) => updateFilters("reason", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-secondary-100 bg-opacity-80 placeholder:text-secondary-900 border-secondary-200"
                placeholder="Filtrar Cantidad"
                value={(columnFilters.find((f) => f.id === "amount")?.value as string) || ""}
                onChange={(e) => updateFilters("amount", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-secondary-100 bg-opacity-80 placeholder:text-secondary-900 border-secondary-200"
                placeholder="Filtrar Saldo"
                value={(columnFilters.find((f) => f.id === "balance")?.value as string) || ""}
                onChange={(e) => updateFilters("balance", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-secondary-100 bg-opacity-80 placeholder:text-secondary-900 border-secondary-200"
                placeholder="Filtrar Fecha"
                value={(columnFilters.find((f) => f.id === "date")?.value as string) || ""}
                onChange={(e) => updateFilters("date", e.target.value)}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-secondary-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-secondary-800">
                No se encontraron transacciones
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}