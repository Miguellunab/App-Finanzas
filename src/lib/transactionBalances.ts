import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from './db';

export async function applyToWallets(
  db: ReturnType<typeof getDb>,
  tx: { type: string; amount: number; walletId: number; walletDestinationId?: number | null },
  undo = false,
) {
  const amount = undo ? -tx.amount : tx.amount;
  const wallet = await db.select({ type: schema.wallets.type }).from(schema.wallets).where(eq(schema.wallets.id, tx.walletId)).limit(1);
  const isCredit = wallet[0]?.type === 'credit';
  const sourceDelta = tx.type === 'income' ? (isCredit ? -amount : amount) : (isCredit ? amount : -amount);
  await db.update(schema.wallets).set({ balance: sql`balance + ${sourceDelta}` }).where(eq(schema.wallets.id, tx.walletId));

  if (tx.type === 'transfer' && tx.walletDestinationId) {
    const destination = await db.select({ type: schema.wallets.type }).from(schema.wallets).where(eq(schema.wallets.id, tx.walletDestinationId)).limit(1);
    const destDelta = destination[0]?.type === 'credit' ? -amount : amount;
    await db.update(schema.wallets).set({ balance: sql`balance + ${destDelta}` }).where(eq(schema.wallets.id, tx.walletDestinationId));
  }
}
