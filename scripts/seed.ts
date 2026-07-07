import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql, schema });

async function main() {
  console.log('Ejecutando seed...');

  const walletsData = [
    { name: 'Efectivo', emoji: '$', color: '#22c55e', currency: 'COP', balance: 150000 },
    { name: 'Bancolombia', emoji: 'B', color: '#3b82f6', currency: 'COP', balance: 2500000 },
    { name: 'Nequi', emoji: 'N', color: '#8b5cf6', currency: 'COP', balance: 80000 },
    { name: 'Tarjeta Credito', emoji: 'TC', color: '#f43f5e', currency: 'COP', balance: -350000 },
  ];

  try {
    const walletsCount = await db.select().from(schema.wallets);
    if (walletsCount.length === 0) {
      await db.insert(schema.wallets).values(walletsData);
      console.log(`${walletsData.length} billeteras creadas`);
    } else {
      console.log(`Ya existen ${walletsCount.length} billeteras, saltando...`);
    }

    console.log('Seed completado');
  } catch (error) {
    console.error('Error durante el seed:', error);
  }
}

main();
