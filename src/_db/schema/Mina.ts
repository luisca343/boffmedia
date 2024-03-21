import { sql } from "drizzle-orm";
import { char, datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const partidasMina = mysqlTable("mina_partidas", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull(),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP()`),
});

export type PartidaMina = typeof partidasMina.$inferSelect;

export const recompensasMina = mysqlTable("mina_recompensas", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    valor: int("valor").notNull(),
    nombre: varchar("nombre", { length: 32 }).notNull(),
    tipo: varchar("tipo", { length: 32 }).notNull(),
    idObjeto: varchar("tipo", { length: 32 }).notNull(),
    ancho: int("ancho").notNull(),
    alto: int("alto").notNull(),
});

export type RecompensaMina = typeof recompensasMina.$inferSelect;

export const detallePartidasMina = mysqlTable("mina_partidas_detalle", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    partidaId: int("id_partida").notNull(),
    recompensaId: int("id_recompensa").notNull(),
    valor: int("valor").notNull(),
    reclamada: int("reclamada").notNull().default(0),
});

export type DetallePartidaMina = typeof detallePartidasMina.$inferSelect;