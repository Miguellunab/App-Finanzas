import type { APIRoute } from 'astro';
import { and, eq, isNull, lte } from 'drizzle-orm';
import { getDb, schema } from '../../lib/db';
import { calculateCurrentCreditDebts, cardPaymentWindow } from '../../lib/payments';
import { applyToWallets } from '../../lib/transactionBalances';
import { nextChargeDateAfter, today } from '../../lib/subscriptions';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function positiveAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

async function sourceWallet(db: ReturnType<typeof getDb>, sourceWalletId: number, destinationWalletId?: number) {
  const wallets = await db.select({ id: schema.wallets.id, type: schema.wallets.type, isArchived: schema.wallets.isArchived })
    .from(schema.wallets)
    .where(eq(schema.wallets.id, sourceWalletId))
    .limit(1);
  const wallet = wallets[0];
  if (!wallet || wallet.isArchived || wallet.type === 'vault' || wallet.id === destinationWalletId) return null;
  return wallet;
}

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const currentDate = today();
    const [creditWallets, creditTxs, cardPeriods, subscriptions] = await Promise.all([
      db.select({
        id: schema.wallets.id,
        name: schema.wallets.name,
        emoji: schema.wallets.emoji,
        currency: schema.wallets.currency,
        balance: schema.wallets.balance,
        interestRate: schema.wallets.interestRate,
        interestPeriod: schema.wallets.interestPeriod,
        statementDay: schema.wallets.statementDay,
        dueDay: schema.wallets.dueDay,
        interestFromFirstInstallment: schema.wallets.interestFromFirstInstallment,
      }).from(schema.wallets).where(and(eq(schema.wallets.type, 'credit'), eq(schema.wallets.isArchived, false))),
      db.select({
        walletId: schema.transactions.walletId,
        amount: schema.transactions.amount,
        installments: schema.transactions.installments,
        interestApplied: schema.transactions.interestApplied,
        date: schema.transactions.date,
      })
        .from(schema.transactions)
        .innerJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
        .where(and(eq(schema.transactions.type, 'expense'), eq(schema.wallets.type, 'credit'))),
      db.select({
        walletId: schema.cardPaymentPeriods.walletId,
        periodStart: schema.cardPaymentPeriods.periodStart,
        periodEnd: schema.cardPaymentPeriods.periodEnd,
      }).from(schema.cardPaymentPeriods),
      db.select({
        subscriptionId: schema.subscriptions.id,
        name: schema.subscriptions.name,
        amount: schema.subscriptions.amount,
        currency: schema.subscriptions.currency,
        chargeDate: schema.subscriptions.nextChargeDate,
        defaultWalletId: schema.subscriptions.walletId,
        defaultWalletName: schema.wallets.name,
        defaultWalletEmoji: schema.wallets.emoji,
      })
        .from(schema.subscriptions)
        .leftJoin(schema.wallets, eq(schema.subscriptions.walletId, schema.wallets.id))
        .leftJoin(schema.subscriptionCharges, and(
          eq(schema.subscriptionCharges.subscriptionId, schema.subscriptions.id),
          eq(schema.subscriptionCharges.chargeDate, schema.subscriptions.nextChargeDate),
        ))
        .where(and(
          eq(schema.subscriptions.isArchived, false),
          lte(schema.subscriptions.nextChargeDate, currentDate),
          isNull(schema.subscriptionCharges.subscriptionId),
        )),
    ]);

    const settings = new Map(creditWallets.map(wallet => [wallet.id, {
      interestRate: wallet.interestRate,
      interestPeriod: wallet.interestPeriod,
      interestFromFirstInstallment: wallet.interestFromFirstInstallment,
    }]));
    const debtByWallet = calculateCurrentCreditDebts(creditTxs, currentDate, settings);
    const periodKeys = new Set(cardPeriods.map(period => `${period.walletId}:${period.periodStart}:${period.periodEnd}`));
    const cards = creditWallets.flatMap(wallet => {
      const window = cardPaymentWindow(currentDate, wallet.statementDay, wallet.dueDay);
      const debt = debtByWallet.get(wallet.id);
      if (!window || !debt || debt.total <= 0 || wallet.balance <= 0) return [];
      if (periodKeys.has(`${wallet.id}:${window.start}:${window.end}`)) return [];
      return [{
        kind: 'card' as const,
        key: `card:${wallet.id}:${window.start}`,
        walletId: wallet.id,
        name: wallet.name,
        emoji: wallet.emoji,
        currency: wallet.currency,
        amount: Math.round(debt.total),
        principal: Math.round(debt.principal),
        interest: Math.round(debt.interest),
        periodStart: window.start,
        periodEnd: window.end,
      }];
    });

    return response({
      data: [...cards, ...subscriptions.map(subscription => ({
        kind: 'subscription' as const,
        key: `subscription:${subscription.subscriptionId}:${subscription.chargeDate}`,
        subscriptionId: subscription.subscriptionId,
        name: subscription.name,
        currency: subscription.currency,
        amount: Math.round(subscription.amount),
        chargeDate: subscription.chargeDate,
        defaultWalletId: subscription.defaultWalletId,
        defaultWalletName: subscription.defaultWalletName,
        defaultWalletEmoji: subscription.defaultWalletEmoji,
      }))],
      date: currentDate,
    });
  } catch (error: any) {
    return response({ error: error.message ?? 'No se pudieron cargar los pagos pendientes' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const action = body.action === 'cancel' ? 'cancelled' : body.action;
    if (!['paid', 'cancelled'].includes(action) || !['card', 'subscription'].includes(body.kind)) {
      return response({ error: 'Tipo de pago o accion no valida' }, 400);
    }

    const currentDate = today();

    if (body.kind === 'card') {
      const walletId = Number(body.walletId);
      const wallet = (await db.select().from(schema.wallets).where(eq(schema.wallets.id, walletId)).limit(1))[0];
      const window = cardPaymentWindow(currentDate, wallet?.statementDay, wallet?.dueDay);
      if (!wallet || wallet.type !== 'credit' || wallet.isArchived || !window || window.start !== body.periodStart || window.end !== body.periodEnd) {
        return response({ error: 'La tarjeta no tiene un periodo de pago activo' }, 400);
      }

      let amount: number | null = null;
      let sourceWalletId: number | null = null;
      if (action === 'paid') {
        amount = positiveAmount(body.amount);
        sourceWalletId = Number(body.sourceWalletId);
        if (!amount || !Number.isInteger(sourceWalletId) || !(await sourceWallet(db, sourceWalletId, walletId))) {
          return response({ error: 'Selecciona una billetera de origen y un monto valido' }, 400);
        }
      }

      const claimed = await db.insert(schema.cardPaymentPeriods).values({
        walletId,
        periodStart: window.start,
        periodEnd: window.end,
        status: action,
      }).onConflictDoNothing().returning();
      if (!claimed.length) return response({ error: 'Este periodo ya fue registrado' }, 409);
      if (action === 'cancelled') return response({ success: true, status: action });

      const transaction = await db.insert(schema.transactions).values({
        type: 'transfer',
        amount: amount!,
        currency: wallet.currency,
        walletId: sourceWalletId!,
        walletDestinationId: walletId,
        description: `Pago tarjeta: ${wallet.name}`,
        aiGenerated: false,
        installments: 1,
        interestApplied: false,
        date: currentDate,
      }).returning();
      await applyToWallets(db, transaction[0]);
      await db.update(schema.cardPaymentPeriods).set({
        status: 'paid',
        amount,
        sourceWalletId,
        transactionId: transaction[0].id,
      }).where(and(
        eq(schema.cardPaymentPeriods.walletId, walletId),
        eq(schema.cardPaymentPeriods.periodStart, window.start),
        eq(schema.cardPaymentPeriods.periodEnd, window.end),
      ));
      return response({ success: true, status: action, transactionId: transaction[0].id });
    }

    const subscriptionId = Number(body.subscriptionId);
    const subscription = (await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, subscriptionId)).limit(1))[0];
    if (!subscription || subscription.isArchived || subscription.nextChargeDate > currentDate) {
      return response({ error: 'La suscripcion no tiene un pago pendiente' }, 400);
    }

    let amount: number | null = null;
    let sourceWalletId: number | null = null;
    if (action === 'paid') {
      amount = positiveAmount(body.amount);
      sourceWalletId = Number(body.sourceWalletId);
      if (!amount || !Number.isInteger(sourceWalletId) || !(await sourceWallet(db, sourceWalletId))) {
        return response({ error: 'Selecciona una billetera de origen y un monto valido' }, 400);
      }
    }

    const chargeDate = subscription.nextChargeDate;
    const claimed = await db.insert(schema.subscriptionCharges).values({
      subscriptionId,
      chargeDate,
    }).onConflictDoNothing().returning();
    if (!claimed.length) return response({ error: 'Este pago ya fue registrado' }, 409);

    let transactionId: number | null = null;
    if (action === 'paid') {
      const transaction = await db.insert(schema.transactions).values({
        type: 'expense',
        amount: amount!,
        currency: subscription.currency,
        walletId: sourceWalletId!,
        description: `Suscripcion: ${subscription.name}`,
        expenseKind: 'fixed',
        aiGenerated: false,
        installments: 1,
        interestApplied: false,
        date: currentDate,
      }).returning();
      await applyToWallets(db, transaction[0]);
      transactionId = transaction[0].id;
      await db.update(schema.subscriptionCharges).set({ transactionId }).where(and(
        eq(schema.subscriptionCharges.subscriptionId, subscriptionId),
        eq(schema.subscriptionCharges.chargeDate, chargeDate),
      ));
    }

    await db.update(schema.subscriptions).set({
      ...(action === 'paid' ? { lastChargedDate: chargeDate } : {}),
      nextChargeDate: nextChargeDateAfter(chargeDate, subscription.chargeDay),
    }).where(eq(schema.subscriptions.id, subscriptionId));

    return response({ success: true, status: action, transactionId });
  } catch (error: any) {
    console.error('Payment settlement failed', error);
    return response({ error: error.message ?? 'No se pudo registrar el pago' }, 500);
  }
};
