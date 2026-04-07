import {
  ColumnDef,
  ColumnFiltersState,
  Table,
  flexRender,
  Row,
  Cell,
  Column,
} from "@tanstack/react-table";
import { AccountImage } from "../../_components/AccountImage";
import {
  filterAmount,
  filterDate,
  filterReason,
} from "../../_util/TransactionFilter";
import { CellDefProps } from "../page";
import { Input } from "@/components/ui/primitives/input";
import { strToDate, cn } from "@/lib/utils";
import { formatMoney } from "../../bankUtils";
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/primitives/card";

// Import shadcn table components
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/primitives/table";
import { StarBankTransaction } from "@boffmedia/shared";

export const columns: ColumnDef<StarBankTransaction>[] = [
  {
    header: "Cuenta",
    accessorKey: "isPayer",
    enableSorting: false,
    cell: (props: CellDefProps<StarBankTransaction>) => {
      const { row } = props;
      return (
        <div className="flex items-center gap-2">
          <AccountImage
            height={40}
            width={40}
            type={row.original.toType!}
            name={row.original.toName!}
            image={(row.original as any).toImage}
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-blue-900">{row.original.toName}</p>
            <p className="text-xs text-blue-600">{row.original.isPayer ? 'Salida' : 'Entrada'}</p>
          </div>
        </div>
      );
    },
  },
  { 
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <div 
          className="flex items-center cursor-pointer hover:text-blue-900 transition-colors" 
          onClick={() => column.toggleSorting()}
        >
          Concepto
          {isSorted === "asc" && <ArrowUpIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {isSorted === "desc" && <ArrowDownIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {!isSorted && <ArrowsUpDownIcon className="ml-1 h-4 w-4 text-blue-400" />}
        </div>
      );
    }, 
    accessorKey: "reason", 
    filterFn: filterReason 
  },
  {
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <div 
          className="flex items-center cursor-pointer hover:text-blue-900 transition-colors" 
          onClick={() => column.toggleSorting()}
        >
          Cantidad
          {isSorted === "asc" && <ArrowUpIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {isSorted === "desc" && <ArrowDownIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {!isSorted && <ArrowsUpDownIcon className="ml-1 h-4 w-4 text-blue-400" />}
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
      const isSorted = column.getIsSorted();
      return (
        <div 
          className="flex items-center cursor-pointer hover:text-blue-900 transition-colors" 
          onClick={() => column.toggleSorting()}
        >
          Saldo
          {isSorted === "asc" && <ArrowUpIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {isSorted === "desc" && <ArrowDownIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {!isSorted && <ArrowsUpDownIcon className="ml-1 h-4 w-4 text-blue-400" />}
        </div>
      );
    },
    id: "balance",
    accessorFn: (row) => row.isPayer ? row.fromBalance : row.toBalance,
    filterFn: filterAmount,
    cell: renderBalance,
    sortingFn: "alphanumeric",
  },
  {
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <div 
          className="flex items-center cursor-pointer hover:text-blue-900 transition-colors" 
          onClick={() => column.toggleSorting()}
        >
          Fecha
          {isSorted === "asc" && <ArrowUpIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {isSorted === "desc" && <ArrowDownIcon className="ml-1 h-4 w-4 text-blue-700" />}
          {!isSorted && <ArrowsUpDownIcon className="ml-1 h-4 w-4 text-blue-400" />}
        </div>
      );
    },
    accessorKey: "date",
    filterFn: filterDate,
    cell: renderDate,
  },
];

function renderMoney(props: CellDefProps<StarBankTransaction>) {
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

function renderBalance(props: CellDefProps<StarBankTransaction>) {
  const { cell } = props;
  return (
    <div className="font-medium text-blue-900">
      {formatMoney(cell.getValue() as number)}
    </div>
  );
}

function renderDate(props: CellDefProps<StarBankTransaction>) {
  const { cell } = props;
  return (
    <div className="text-sm text-blue-700">
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
  table: Table<StarBankTransaction>;
  columnFilters: ColumnFiltersState;
  updateFilters: any;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Desktop view */}
      <div className="hidden md:block">
        <ShadcnTable variant="wingull">
        <TableHeader className="bg-blue-50 sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-blue-800 font-medium py-4">
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
                className="mb-1 mx-auto w-[95%] h-8 bg-blue-100 bg-opacity-80 placeholder:text-blue-900 border-blue-200"
                placeholder="Filtrar Conceptos"
                value={(columnFilters.find((f) => f.id === "reason")?.value as string) || ""}
                onChange={(e) => updateFilters("reason", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-blue-100 bg-opacity-80 placeholder:text-blue-900 border-blue-200"
                placeholder="Filtrar Cantidad"
                value={(columnFilters.find((f) => f.id === "amount")?.value as string) || ""}
                onChange={(e) => updateFilters("amount", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-blue-100 bg-opacity-80 placeholder:text-blue-900 border-blue-200"
                placeholder="Filtrar Saldo"
                value={(columnFilters.find((f) => f.id === "balance")?.value as string) || ""}
                onChange={(e) => updateFilters("balance", e.target.value)}
              />
            </TableHead>
            <TableHead>
              <Input
                className="mb-1 mx-auto w-[95%] h-8 bg-blue-100 bg-opacity-80 placeholder:text-blue-900 border-blue-200"
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
              <TableRow key={row.id} className="hover:bg-blue-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-blue-800">
                No se encontraron transacciones
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden space-y-3 p-4">
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => (
            <Card key={row.id} className="p-4" variant="wingull">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AccountImage
                      height={32}
                      width={32}
                      type={row.original.toType!}
                      name={row.original.toName!}
                      image={(row.original as any).toImage}
                    />
                    <div>
                      <p className="font-medium text-sm">{row.original.toName}</p>
                      <p className="text-xs text-blue-600">
                        {row.original.isPayer ? 'Salida' : 'Entrada'}
                      </p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    row.original.isPayer ? "text-red-600" : "text-emerald-600"
                  )}>
                    {row.original.isPayer ? '-' : '+'} {formatMoney(row.original.amount)}
                  </p>
                </div>
                
                <div className="text-sm text-surface-600">
                  {row.original.reason || "Sin concepto"}
                </div>
                
                <div className="flex justify-between text-xs text-surface-500">
                  <span>{strToDate(row.original.date)}</span>
                  <span>Balance: {formatMoney(row.original.isPayer ? row.original.fromBalance : row.original.toBalance)}</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-8 text-center text-blue-800">
            No se encontraron transacciones
          </div>
        )}
      </div>
    </div>
  );
}