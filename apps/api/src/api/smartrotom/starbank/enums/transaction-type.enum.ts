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
  // Absolute balance correction (admin / game-driven setBalance). The ledger row
  // records the signed delta against the virtual system account 0, so history
  // shows how much was minted or burned to reach the target.
  AJUSTE = 'AJUSTE',
  SUBASTA = 'SUBASTA',
  RECOMPENSA = 'RECOMPENSA',
  // Wigglypop. MERCADO is the buyer → escrow leg (and the escrow → buyer refund);
  // VENTA_P2P is the escrow → seller payout. Two types, not one, so the ledger can tell
  // "money I put into the market" apart from "money the market paid me".
  MERCADO = 'MERCADO',
  VENTA_P2P = 'VENTA_P2P',
}
