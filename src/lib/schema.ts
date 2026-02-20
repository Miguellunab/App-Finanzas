import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Billeteras (Efectivo, Tarjeta, etc.)
export const wallets = sqliteTable('wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('💳'),
  color: text('color').notNull().default('#6366f1'),
  currency: text('currency').notNull().default('COP'),
  balance: real('balance').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Categorías (Comida, Transporte, etc.)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('📦'),
  color: text('color').notNull().default('#8b5cf6'),
  type: text('type', { enum: ['income', 'expense', 'both'] }).notNull().default('both'),
  budgetLimit: real('budget_limit'), // Límite mensual opcional
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Transacciones
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('COP'),
  categoryId: integer('category_id').references(() => categories.id),
  walletId: integer('wallet_id').notNull().references(() => wallets.id),
  walletDestinationId: integer('wallet_destination_id').references(() => wallets.id), // Para transferencias
  description: text('description').notNull().default(''),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).notNull().default(false),
  rawInput: text('raw_input'), // El texto original que dio el usuario
  date: text('date').notNull().default(sql`(date('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Tipos exportados
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
