import {  text, timestamp, mysqlTable, int } from "drizzle-orm/mysql-core";

export const test = mysqlTable("test", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});