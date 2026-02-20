// Script de seed: pobla la DB con datos iniciales
// Ejecutar con: npx tsx scripts/seed.ts

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../gastos.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '💳',
    color TEXT NOT NULL DEFAULT '#6366f1',
    currency TEXT NOT NULL DEFAULT 'COP',
    balance REAL NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '📦',
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    type TEXT NOT NULL DEFAULT 'both',
    budget_limit REAL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    category_id INTEGER REFERENCES categories(id),
    wallet_id INTEGER NOT NULL REFERENCES wallets(id),
    wallet_destination_id INTEGER REFERENCES wallets(id),
    description TEXT NOT NULL DEFAULT '',
    ai_generated INTEGER NOT NULL DEFAULT 0,
    raw_input TEXT,
    date TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Wallets iniciales
const walletsData = [
  { name: 'Efectivo', emoji: '💵', color: '#22c55e', currency: 'COP', balance: 150000 },
  { name: 'Bancolombia', emoji: '🏦', color: '#3b82f6', currency: 'COP', balance: 2500000 },
  { name: 'Nequi', emoji: '💜', color: '#8b5cf6', currency: 'COP', balance: 80000 },
  { name: 'Tarjeta Crédito', emoji: '💳', color: '#f43f5e', currency: 'COP', balance: -350000 },
];

// Categorías iniciales
const categoriesData = [
  { name: 'Comida y Mercado', emoji: '🛒', color: '#22c55e', type: 'expense', budget_limit: 500000 },
  { name: 'Transporte', emoji: '🚌', color: '#3b82f6', type: 'expense', budget_limit: 150000 },
  { name: 'Entretenimiento', emoji: '🎮', color: '#8b5cf6', type: 'expense', budget_limit: 200000 },
  { name: 'Salud', emoji: '❤️‍🩹', color: '#f43f5e', type: 'expense', budget_limit: null },
  { name: 'Educación', emoji: '📚', color: '#06b6d4', type: 'expense', budget_limit: null },
  { name: 'Ropa y Estilo', emoji: '👕', color: '#ec4899', type: 'expense', budget_limit: 300000 },
  { name: 'Casa y Hogar', emoji: '🏠', color: '#f97316', type: 'expense', budget_limit: null },
  { name: 'Trabajo / Freelance', emoji: '💼', color: '#eab308', type: 'income', budget_limit: null },
  { name: 'Salario', emoji: '💰', color: '#14b8a6', type: 'income', budget_limit: null },
  { name: 'Servicios', emoji: '💡', color: '#6366f1', type: 'expense', budget_limit: 200000 },
  { name: 'Suscripciones', emoji: '📱', color: '#a855f7', type: 'expense', budget_limit: 100000 },
  { name: 'Mascotas', emoji: '🐾', color: '#fb923c', type: 'expense', budget_limit: null },
];

// Insertar wallets
const insertWallet = db.prepare(`
  INSERT OR IGNORE INTO wallets (name, emoji, color, currency, balance)
  VALUES (@name, @emoji, @color, @currency, @balance)
`);

// Insertar categorías
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, emoji, color, type, budget_limit)
  VALUES (@name, @emoji, @color, @type, @budget_limit)
`);

const insertManyWallets = db.transaction(() => {
  for (const w of walletsData) insertWallet.run(w);
});

const insertManyCategories = db.transaction(() => {
  for (const c of categoriesData) insertCategory.run(c);
});

// Check si ya hay datos
const walletCount = (db.prepare('SELECT COUNT(*) as count FROM wallets').get() as any).count;
const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;

if (walletCount === 0) {
  insertManyWallets();
  console.log(`✅ ${walletsData.length} billeteras creadas`);
} else {
  console.log(`ℹ️  Ya existen ${walletCount} billeteras, saltando...`);
}

if (categoryCount === 0) {
  insertManyCategories();
  console.log(`✅ ${categoriesData.length} categorías creadas`);
} else {
  console.log(`ℹ️  Ya existen ${categoryCount} categorías, saltando...`);
}

// Transacciones de ejemplo para este mes
const walletId = (db.prepare('SELECT id FROM wallets WHERE name = ?').get('Bancolombia') as any)?.id;
const categoryComida = (db.prepare('SELECT id FROM categories WHERE name = ?').get('Comida y Mercado') as any)?.id;
const categorySalario = (db.prepare('SELECT id FROM categories WHERE name = ?').get('Salario') as any)?.id;
const categoryTransporte = (db.prepare('SELECT id FROM categories WHERE name = ?').get('Transporte') as any)?.id;
const effectivoId = (db.prepare('SELECT id FROM wallets WHERE name = ?').get('Efectivo') as any)?.id;

const txCount = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any).count;

if (txCount === 0 && walletId && categoryComida && categorySalario) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

  const insertTx = db.prepare(`
    INSERT INTO transactions (type, amount, currency, category_id, wallet_id, description, ai_generated, date)
    VALUES (@type, @amount, @currency, @categoryId, @walletId, @description, @aiGenerated, @date)
  `);

  const sampleTxs = [
    { type: 'income', amount: 3500000, currency: 'COP', categoryId: categorySalario, walletId, description: 'Salario febrero', aiGenerated: 0, date: twoDaysAgo },
    { type: 'expense', amount: 45000, currency: 'COP', categoryId: categoryComida, walletId, description: 'Mercado semanal', aiGenerated: 0, date: yesterday },
    { type: 'expense', amount: 12000, currency: 'COP', categoryId: categoryTransporte, walletId: effectivoId ?? walletId, description: 'Taxi al trabajo', aiGenerated: 0, date: today },
    { type: 'expense', amount: 28500, currency: 'COP', categoryId: categoryComida, walletId: effectivoId ?? walletId, description: 'Almuerzo + café', aiGenerated: 1, date: today },
  ];

  const insertSampleTxs = db.transaction(() => {
    for (const tx of sampleTxs) insertTx.run(tx);
  });

  insertSampleTxs();
  console.log(`✅ ${sampleTxs.length} transacciones de ejemplo creadas`);
}

// Actualizar balances de wallets según transacciones
const updateBalances = db.transaction(() => {
  const allWallets = db.prepare('SELECT id FROM wallets').all() as any[];
  for (const w of allWallets) {
    const income = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE wallet_id = ? AND type = 'income'
    `).get(w.id) as any).total;
    const expense = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE wallet_id = ? AND type = 'expense'
    `).get(w.id) as any).total;
    const transferOut = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE wallet_id = ? AND type = 'transfer'
    `).get(w.id) as any).total;
    const transferIn = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE wallet_destination_id = ? AND type = 'transfer'
    `).get(w.id) as any).total;
    // Nota: balance inicial en seed + movimientos
    // Para seed solo usamos los valores del seed como balance inicial
  }
});

db.close();
console.log('🎉 Seed completado!');
