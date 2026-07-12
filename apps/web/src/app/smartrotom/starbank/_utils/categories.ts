import type { IconName } from "../_components/ui/icons";
import type { SBTransaction } from "../_types";

export type CategoryId =
  | "league" | "shop" | "heal" | "transfer" | "reward" | "fee" | "subscription" | "other";

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconName;
  /** Raw hex — for SVG fills/strokes (data-driven, not expressible as a utility). */
  hex: string;
  /** Literal Tailwind class strings (kept static so JIT can see them). */
  text: string;
  soft: string;
  dotBg: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  league:       { id: "league",       label: "Liga",           icon: "trophy",  hex: "#2463eb", text: "text-sb-league",       soft: "bg-sb-league/10",       dotBg: "bg-sb-league" },
  shop:         { id: "shop",         label: "Tienda",         icon: "bag",     hex: "#06b6d4", text: "text-sb-shop",         soft: "bg-sb-shop/10",         dotBg: "bg-sb-shop" },
  heal:         { id: "heal",         label: "Centro Pokémon", icon: "heart",   hex: "#ec4899", text: "text-sb-heal",         soft: "bg-sb-heal/10",         dotBg: "bg-sb-heal" },
  transfer:     { id: "transfer",     label: "Transferencia",  icon: "arrows",  hex: "#8b5cf6", text: "text-sb-transfer",     soft: "bg-sb-transfer/10",     dotBg: "bg-sb-transfer" },
  reward:       { id: "reward",       label: "Recompensa",     icon: "gift",    hex: "#10b981", text: "text-sb-reward",       soft: "bg-sb-reward/10",       dotBg: "bg-sb-reward" },
  fee:          { id: "fee",          label: "Comisión",       icon: "receipt", hex: "#94a3b8", text: "text-sb-fee",          soft: "bg-sb-fee/10",          dotBg: "bg-sb-fee" },
  subscription: { id: "subscription", label: "Suscripción",    icon: "cal",     hex: "#f59e0b", text: "text-sb-subscription", soft: "bg-sb-subscription/10", dotBg: "bg-sb-subscription" },
  other:        { id: "other",        label: "Otros",          icon: "receipt", hex: "#64748b", text: "text-sb-other",        soft: "bg-sb-other/10",        dotBg: "bg-sb-other" },
};

const RULES: Array<[CategoryId, RegExp]> = [
  ["subscription", /suscrip|mensual|anual|pc\+/i],
  ["reward",       /premio|recompensa|salario|victoria|misi[oó]n|bonus/i],
  ["heal",         /curaci[oó]n|curar|cura |centro|revivir|pok[eé]mon center/i],
  ["shop",         /tienda|ball|bola|ultra|caja|booster|repelente|caramelo|\btm\d|compra|pok[eé]bola/i],
  ["league",       /liga|gimnasio|\bgym\b|frontier|pase|cuota|torneo/i],
  ["fee",          /comisi[oó]n|\bfee\b/i],
  ["transfer",     /transferencia|reembolso|apuesta|venta|mover|env[ií]o/i],
];

/** Best-effort category from the real transaction (no category field in the API).
 *  Falls back to "other" so the chip pattern always renders. */
export function resolveCategory(tx: Pick<SBTransaction, "reason">): Category {
  const reason = tx?.reason ?? "";
  for (const [id, re] of RULES) {
    if (re.test(reason)) return CATEGORIES[id];
  }
  return CATEGORIES.other;
}
