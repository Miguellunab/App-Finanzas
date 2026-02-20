// Script de seed: pobla la DB con datos iniciales
// Ejecutar con: npx tsx scripts/seed.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql, schema });

async function main() {
  console.log('🌱 Ejecutando seed...');

  // Wallets iniciales
  const walletsData = [
    { name: 'Efectivo', emoji: '💵', color: '#22c55e', currency: 'COP', balance: 150000 },
    { name: 'Bancolombia', emoji: '🏦', color: '#3b82f6', currency: 'COP', balance: 2500000 },
    { name: 'Nequi', emoji: '💜', color: '#8b5cf6', currency: 'COP', balance: 80000 },
    { name: 'Tarjeta Crédito', emoji: '💳', color: '#f43f5e', currency: 'COP', balance: -350000 },
  ];

  // Categorías iniciales
  const categoriesData = [
    { name: 'Comida y Mercado', emoji: '🛒', color: '#22c55e', type: 'expense', budgetLimit: 500000 },
    { name: 'Transporte', emoji: '🚌', color: '#3b82f6', type: 'expense', budgetLimit: 150000 },
    { name: 'Entretenimiento', emoji: '🎮', color: '#8b5cf6', type: 'expense', budgetLimit: 200000 },
    { name: 'Salud', emoji: '❤️‍🩹', color: '#f43f5e', type: 'expense', budgetLimit: null },
    { name: 'Educación', emoji: '📚', color: '#06b6d4', type: 'expense', budgetLimit: null },
    { name: 'Ropa y Estilo', emoji: '👕', color: '#ec4899', type: 'expense', budgetLimit: 300000 },
    { name: 'Casa y Hogar', emoji: '🏠', color: '#f97316', type: 'expense', budgetLimit: null },
    { name: 'Trabajo / Freelance', emoji: '💼', color: '#eab308', type: 'income', budgetLimit: null },
    { name: 'Salario', emoji: '💰', color: '#14b8a6', type: 'income', budgetLimit: null },
    { name: 'Servicios', emoji: '💡', color: '#6366f1', type: 'expense', budgetLimit: 200000 },
    { name: 'Suscripciones', emoji: '📱', color: '#a855f7', type: 'expense', budgetLimit: 100000 },
    { name: 'Mascotas', emoji: '🐾', color: '#fb923c', type: 'expense', budgetLimit: null },
  ];

  try {
    // Check si ya hay datos
    const walletsCount = await db.select().from(schema.wallets);
    if (walletsCount.length === 0) {
      await db.insert(schema.wallets).values(walletsData);
      console.log(`✅ ${walletsData.length} billeteras creadas`);
    } else {
      console.log(`ℹ️  Ya existen ${walletsCount.length} billeteras, saltando...`);
    }

    const categoriesCount = await db.select().from(schema.categories);
    if (categoriesCount.length === 0) {
      await db.insert(schema.categories).values(categoriesData);
      console.log(`✅ ${categoriesData.length} categorías creadas`);
    } else {
      console.log(`ℹ️  Ya existen ${categoriesCount.length} categorías, saltando...`);
    }

    console.log('🎉 Seed completado!');
  } catch (error) {
    console.error('Error durante el seed:', error);
  }
}

main();
