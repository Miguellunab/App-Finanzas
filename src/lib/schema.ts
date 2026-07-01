import { pgTable, text, integer, real, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Billeteras (Efectivo, Tarjeta, etc.)
export const wallets = pgTable('wallets', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('💳'),
  color: text('color').notNull().default('#6366f1'),
  currency: text('currency').notNull().default('COP'),
  balance: real('balance').notNull().default(0),
  type: text('type').notNull().default('debit'),
  interestRate: real('interest_rate').notNull().default(0),
  interestPeriod: text('interest_period').notNull().default('EA'),
  creditLimit: real('credit_limit').notNull().default(0),
  statementDay: integer('statement_day'),
  dueDay: integer('due_day'),
  interestFromFirstInstallment: boolean('interest_from_first_installment').notNull().default(false),
  sourceWalletId: integer('source_wallet_id'),
  vaultEndDate: text('vault_end_date'),
  includeInBalance: boolean('include_in_balance').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Categorías (Comida, Transporte, etc.)
export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('📦'),
  color: text('color').notNull().default('#8b5cf6'),
  type: text('type').notNull().default('both'),
  budgetLimit: real('budget_limit'), // Límite mensual opcional
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Transacciones
export const transactions = pgTable('transactions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('COP'),
  categoryId: integer('category_id').references(() => categories.id),
  walletId: integer('wallet_id').notNull().references(() => wallets.id),
  walletDestinationId: integer('wallet_destination_id').references(() => wallets.id), // Para transferencias
  description: text('description').notNull().default(''),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  rawInput: text('raw_input'), // El texto original que dio el usuario
  installments: integer('installments').notNull().default(1),
  interestApplied: boolean('interest_applied').notNull().default(false),
  date: text('date').notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tipos exportados
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
