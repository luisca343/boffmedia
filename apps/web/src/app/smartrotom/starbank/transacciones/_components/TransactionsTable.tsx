import { ColumnDef, Table, flexRender } from "@tanstack/react-table";
import { AccountImage } from "../../_components/AccountImage";
import {
  filterAmount,
  filterDate,
  filterReason,
} from "../../_util/TransactionFilter";
import { CellDefProps } from "../page";
import { strToDate } from "@/lib/utils";
import { formatMoney } from "../../bankUtils";
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { StarBankTransaction } from "@boffmedia/shared";

export const columns: ColumnDef<StarBankTransaction>[] = [
  {
    header: "Contraparte",
    accessorKey: "isPayer",
    enableSorting: false,
    cell: (props: CellDefProps<StarBankTransaction>) => {
      const { row } = props;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              flexShrink: 0,
              borderRadius: "50%",
              overflow: "hidden",
              width: 32,
              height: 32,
            }}
          >
            <AccountImage
              height={32}
              width={32}
              type={row.original.toType!}
              name={row.original.toName!}
              image={(row.original as any).toImage}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-fg, #0c1830)" }}>
              {row.original.toName}
            </p>
            <p style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}>
              {row.original.isPayer ? "Salida" : "Entrada"}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          onClick={() => column.toggleSorting()}
        >
          Concepto
          {sorted === "asc" ? (
            <ArrowUpIcon style={{ width: 12, height: 12 }} />
          ) : sorted === "desc" ? (
            <ArrowDownIcon style={{ width: 12, height: 12 }} />
          ) : (
            <ArrowsUpDownIcon style={{ width: 12, height: 12, opacity: 0.4 }} />
          )}
        </span>
      );
    },
    accessorKey: "reason",
    filterFn: filterReason,
  },
  {
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            justifyContent: "flex-end",
            width: "100%",
          }}
          onClick={() => column.toggleSorting()}
        >
          Cantidad
          {sorted === "asc" ? (
            <ArrowUpIcon style={{ width: 12, height: 12 }} />
          ) : sorted === "desc" ? (
            <ArrowDownIcon style={{ width: 12, height: 12 }} />
          ) : (
            <ArrowsUpDownIcon style={{ width: 12, height: 12, opacity: 0.4 }} />
          )}
        </span>
      );
    },
    accessorKey: "amount",
    filterFn: filterAmount,
    cell: renderMoney,
    sortingFn: "alphanumeric",
  },
  {
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            justifyContent: "flex-end",
            width: "100%",
          }}
          onClick={() => column.toggleSorting()}
        >
          Saldo
          {sorted === "asc" ? (
            <ArrowUpIcon style={{ width: 12, height: 12 }} />
          ) : sorted === "desc" ? (
            <ArrowDownIcon style={{ width: 12, height: 12 }} />
          ) : (
            <ArrowsUpDownIcon style={{ width: 12, height: 12, opacity: 0.4 }} />
          )}
        </span>
      );
    },
    id: "balance",
    accessorFn: (row) => (row.isPayer ? row.fromBalance : row.toBalance),
    filterFn: filterAmount,
    cell: renderBalance,
    sortingFn: "alphanumeric",
  },
  {
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            justifyContent: "flex-end",
            width: "100%",
          }}
          onClick={() => column.toggleSorting()}
        >
          Fecha
          {sorted === "asc" ? (
            <ArrowUpIcon style={{ width: 12, height: 12 }} />
          ) : sorted === "desc" ? (
            <ArrowDownIcon style={{ width: 12, height: 12 }} />
          ) : (
            <ArrowsUpDownIcon style={{ width: 12, height: 12, opacity: 0.4 }} />
          )}
        </span>
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
    <div
      style={{
        textAlign: "right",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        color: isPayer ? "var(--sb-neg-2, #dc2626)" : "var(--sb-pos-2, #059669)",
      }}
    >
      {isPayer ? "− " : "+ "}
      {formatMoney(amount)}
    </div>
  );
}

function renderBalance(props: CellDefProps<StarBankTransaction>) {
  const { cell } = props;
  return (
    <div
      style={{
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 500,
        color: "var(--sb-fg, #0c1830)",
      }}
    >
      {formatMoney(cell.getValue() as number)}
    </div>
  );
}

function renderDate(props: CellDefProps<StarBankTransaction>) {
  const { cell } = props;
  return (
    <div
      style={{
        textAlign: "right",
        color: "var(--sb-fg-muted, #5b6b85)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {strToDate(cell.getValue() as string)}
    </div>
  );
}

export function TransactionsTable({ table }: { table: Table<StarBankTransaction> }) {
  const rows = table.getRowModel().rows;

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--sb-fg-muted, #5b6b85)",
                      background: "var(--sb-surface-2, #f7faff)",
                      borderBottom: "1px solid var(--sb-border, #e3ebf5)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  style={{ cursor: "pointer", transition: "background 150ms ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: "var(--sb-fg-2, #2c3a55)",
                        borderBottom:
                          i < rows.length - 1
                            ? "1px solid var(--sb-border, #e3ebf5)"
                            : "none",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--sb-fg-muted, #5b6b85)",
                    fontSize: 13,
                  }}
                >
                  No se encontraron transacciones con estos filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3 p-4">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.id}
              style={{
                borderRadius: 12,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface, #fff)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{ borderRadius: "50%", overflow: "hidden", width: 32, height: 32, flexShrink: 0 }}
                  >
                    <AccountImage
                      height={32}
                      width={32}
                      type={row.original.toType!}
                      name={row.original.toName!}
                      image={(row.original as any).toImage}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-fg, #0c1830)" }}>
                      {row.original.toName}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}>
                      {row.original.isPayer ? "Salida" : "Entrada"}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: row.original.isPayer
                      ? "var(--sb-neg-2, #dc2626)"
                      : "var(--sb-pos-2, #059669)",
                  }}
                >
                  {row.original.isPayer ? "− " : "+ "}
                  {formatMoney(row.original.amount)}
                </p>
              </div>
              <p style={{ fontSize: 13, color: "var(--sb-fg-2, #2c3a55)" }}>
                {row.original.reason || "Sin concepto"}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--sb-fg-muted, #5b6b85)",
                }}
              >
                <span>{strToDate(row.original.date)}</span>
                <span>
                  Saldo:{" "}
                  {formatMoney(
                    row.original.isPayer ? row.original.fromBalance : row.original.toBalance,
                  )}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p
            style={{ padding: 40, textAlign: "center", color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13 }}
          >
            No se encontraron transacciones con estos filtros
          </p>
        )}
      </div>
    </div>
  );
}
