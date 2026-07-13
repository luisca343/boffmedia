export enum TransactionType {
  TRANSFERENCIA = 'TRANSFERENCIA',
  COMPRA = 'COMPRA',
  VENTA = 'VENTA',
  PREMIO = 'PREMIO',
  DERROTA_ENTRENADOR = 'DERROTA_ENTRENADOR',
  DEPOSITO = 'DEPOSITO',
  RETIRO = 'RETIRO',
  MULTA = 'MULTA',
  TASA = 'TASA',
  SUBASTA = 'SUBASTA',
  RECOMPENSA = 'RECOMPENSA',
  // Wigglypop. MERCADO is the buyer → escrow leg (and the escrow → buyer refund);
  // VENTA_P2P is the escrow → seller payout. Two types, not one, so the ledger can tell
  // "money I put into the market" apart from "money the market paid me".
  MERCADO = 'MERCADO',
  VENTA_P2P = 'VENTA_P2P',
}
