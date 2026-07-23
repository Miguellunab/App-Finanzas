import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq, sql, gte, lte, and, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getGroq, MODELS, STATS_SYSTEM_PROMPT } from '../../lib/groq';
import { getCurrentMonthRange } from '../../lib/utils';
import { calculateCurrentCreditDebts, creditInstallmentsInRange, replaceCreditPurchasesWithInstallments } from '../../lib/payments';
import { today } from '../../lib/subscriptions';

const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const searchParams = url.searchParams;
    const period = searchParams.get('period') ?? 'month'; // month | all
    const currentDate = today();
    
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (period === 'month') {
      const range = getCurrentMonthRange();
      startDate = range.start;
      endDate = currentDate;
    } else if (searchParams.get('startDate')) {
      startDate = searchParams.get('startDate')!;
      endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
    }

    const dateConditions: ReturnType<typeof gte>[] = [];
    if (startDate) dateConditions.push(gte(schema.transactions.date, startDate));
    if (endDate) dateConditions.push(lte(schema.transactions.date, endDate));
    const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

    // Totales del período
    const totalsQuery = db.select({
      type: schema.transactions.type,
      total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(schema.transactions)
    .where(dateFilter)
    .groupBy(schema.transactions.type);

    // Gastos por tipo
    const expenseConditions = [eq(schema.transactions.type, 'expense')];
    if (dateFilter) expenseConditions.push(dateFilter);

    const byExpenseKindQuery = db.select({
      expenseKind: schema.transactions.expenseKind,
      total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(schema.transactions)
    .where(and(...expenseConditions))
    .groupBy(schema.transactions.expenseKind)
    .orderBy(sql`SUM(${schema.transactions.amount}) DESC`);

    const adjustmentConditions = [or(
      and(eq(schema.transactions.type, 'expense'), eq(schema.transactions.expenseKind, 'mismatch')),
      and(eq(schema.transactions.type, 'income'), eq(schema.transactions.expenseKind, 'surplus')),
    )];
    if (dateFilter) adjustmentConditions.push(dateFilter);
    const adjustmentsQuery = db.select({
      kind: schema.transactions.expenseKind,
      total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(schema.transactions)
    .where(and(...adjustmentConditions))
    .groupBy(schema.transactions.expenseKind);

    // Gastos por día del período (o últimos 30 días en el histórico)
    const last30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const byDayQuery = db.select({
      date: schema.transactions.date,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type}='income' THEN ${schema.transactions.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type}='expense' THEN ${schema.transactions.amount} ELSE 0 END), 0)`,
    })
    .from(schema.transactions)
    .where(dateFilter ?? gte(schema.transactions.date, last30Days))
    .groupBy(schema.transactions.date)
    .orderBy(schema.transactions.date);

    // Balance total de todas las wallets
    const walletBalancesQuery = db.select({
      id: schema.wallets.id,
      name: schema.wallets.name,
      emoji: schema.wallets.emoji,
      color: schema.wallets.color,
      currency: schema.wallets.currency,
      balance: schema.wallets.balance,
      type: schema.wallets.type,
      interestRate: schema.wallets.interestRate,
      interestPeriod: schema.wallets.interestPeriod,
      creditLimit: schema.wallets.creditLimit,
      statementDay: schema.wallets.statementDay,
      dueDay: schema.wallets.dueDay,
      interestFromFirstInstallment: schema.wallets.interestFromFirstInstallment,
      sourceWalletId: schema.wallets.sourceWalletId,
      vaultStartDate: schema.wallets.vaultStartDate,
      vaultEndDate: schema.wallets.vaultEndDate,
      includeInBalance: schema.wallets.includeInBalance,
    })
    .from(schema.wallets)
    .where(eq(schema.wallets.isArchived, false));

    const creditWalletsQuery = db.select({
      id: schema.wallets.id,
      interestRate: schema.wallets.interestRate,
      interestPeriod: schema.wallets.interestPeriod,
      interestFromFirstInstallment: schema.wallets.interestFromFirstInstallment,
    })
    .from(schema.wallets)
    .where(eq(schema.wallets.type, 'credit'));

    const creditTxsQuery = db.select({
      walletId: schema.transactions.walletId,
      amount: schema.transactions.amount,
      date: schema.transactions.date,
      installments: schema.transactions.installments,
      interestApplied: schema.transactions.interestApplied,
      expenseKind: schema.transactions.expenseKind,
      interestRate: schema.wallets.interestRate,
      interestPeriod: schema.wallets.interestPeriod,
      interestFromFirstInstallment: schema.wallets.interestFromFirstInstallment,
    })
    .from(schema.transactions)
    .leftJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
    .where(and(eq(schema.transactions.type, 'expense'), eq(schema.wallets.type, 'credit')));

    const creditDestination = alias(schema.wallets, 'credit_payment_destination');
    const creditPaymentsQuery = db.select({
      walletId: schema.transactions.walletDestinationId,
      amount: schema.transactions.amount,
      date: schema.transactions.date,
    })
    .from(schema.transactions)
    .innerJoin(creditDestination, eq(schema.transactions.walletDestinationId, creditDestination.id))
    .where(and(eq(schema.transactions.type, 'transfer'), eq(creditDestination.type, 'credit')));

    const [totals, byExpenseKind, adjustments, byDay, walletBalances, creditWallets, creditTxs, creditPayments] = await Promise.all([
      totalsQuery,
      byExpenseKindQuery,
      adjustmentsQuery,
      byDayQuery,
      walletBalancesQuery,
      creditWalletsQuery,
      creditTxsQuery,
      creditPaymentsQuery,
    ]);

    const income = totals.find(t => t.type === 'income')?.total ?? 0;
    const rawExpenses = totals.find(t => t.type === 'expense')?.total ?? 0;
    const transfers = totals.find(t => t.type === 'transfer')?.total ?? 0;

    const creditWalletSettings = new Map(creditWallets.map(wallet => [wallet.id, {
      interestRate: wallet.interestRate,
      interestPeriod: wallet.interestPeriod,
      interestFromFirstInstallment: wallet.interestFromFirstInstallment,
    }]));
    const scheduledCreditExpenses = period === 'month' && startDate && endDate
      ? creditInstallmentsInRange(creditTxs, startDate, endDate, creditWalletSettings)
      : [];
    const periodCreditExpenses = period === 'month'
      ? creditTxs.filter(transaction => (!startDate || transaction.date >= startDate) && (!endDate || transaction.date <= endDate))
      : [];
    const expenses = period === 'month'
      ? replaceCreditPurchasesWithInstallments(rawExpenses, periodCreditExpenses, scheduledCreditExpenses)
      : rawExpenses;

    const expenseKinds = new Map(byExpenseKind.map(entry => [entry.expenseKind, { ...entry }]));
    if (period === 'month') {
      for (const transaction of periodCreditExpenses) {
        const entry = expenseKinds.get(transaction.expenseKind);
        if (entry) {
          entry.total -= transaction.amount;
          entry.count -= 1;
        }
      }
      for (const installment of scheduledCreditExpenses) {
        const entry = expenseKinds.get(installment.expenseKind) ?? { expenseKind: installment.expenseKind, total: 0, count: 0 };
        entry.total += installment.amount;
        entry.count += 1;
        expenseKinds.set(installment.expenseKind, entry);
      }
    }
    const displayedExpenseKinds = [...expenseKinds.values()]
      .filter(entry => entry.total > 0)
      .sort((a, b) => b.total - a.total);

    const days = new Map(byDay.map(entry => [entry.date, { ...entry }]));
    if (period === 'month') {
      for (const transaction of periodCreditExpenses) {
        const entry = days.get(transaction.date);
        if (entry) entry.expense -= transaction.amount;
      }
      for (const installment of scheduledCreditExpenses) {
        const entry = days.get(installment.date) ?? { date: installment.date, income: 0, expense: 0 };
        entry.expense += installment.amount;
        days.set(installment.date, entry);
      }
    }
    const displayedByDay = [...days.values()]
      .filter(entry => entry.income !== 0 || entry.expense > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const debtByWallet = calculateCurrentCreditDebts(
      creditTxs,
      currentDate,
      creditWalletSettings,
      creditPayments.flatMap(payment => payment.walletId === null ? [] : [{ ...payment, walletId: payment.walletId }]),
    );
    const wallets = walletBalances.map(w => {
      const debt = debtByWallet.get(w.id);
      const monthlyPrincipal = w.type === 'credit' ? debt?.principal ?? Math.max(0, w.balance) : 0;
      const monthlyInterest = w.type === 'credit' ? debt?.interest ?? 0 : 0;
      return { ...w, monthlyPrincipal, monthlyInterest, monthlyDebt: monthlyPrincipal + monthlyInterest };
    });
    const creditDebt = (w: typeof wallets[number]) => Math.max(0, w.monthlyDebt);
    const totalBalance = wallets.reduce((acc, w) => {
      if (!w.includeInBalance) return acc;
      return acc + (w.type === 'credit' ? -creditDebt(w) : w.balance);
    }, 0);

    return new Response(JSON.stringify({
      data: {
        period: { startDate, endDate },
        income, expenses, transfers,
        balance: income - expenses,
        totalBalance,
        byExpenseKind: displayedExpenseKinds,
        adjustments,
        byDay: displayedByDay,
        wallets,
      }
    }), { headers: jsonHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
  }
};

// POST para review de IA
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { period = 'month', startDate: customStart, endDate: customEnd } = body;

    let startDate: string;
    let endDate: string;

    if (period === 'month') {
      const range = getCurrentMonthRange();
      startDate = range.start;
      endDate = range.end;
    } else {
      startDate = customStart;
      endDate = customEnd;
    }

    // Recopilar datos para la IA
    const txs = await db.select({
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      currency: schema.transactions.currency,
      description: schema.transactions.description,
      date: schema.transactions.date,
      expenseKind: schema.transactions.expenseKind,
      walletName: schema.wallets.name,
    })
    .from(schema.transactions)
    .leftJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
    .where(and(gte(schema.transactions.date, startDate), lte(schema.transactions.date, endDate)))
    .orderBy(schema.transactions.date);

    if (txs.length === 0) {
      return new Response(JSON.stringify({ 
        review: 'No hay transacciones registradas en este periodo para analizar. Empieza a registrar tus movimientos!' 
      }), { headers: jsonHeaders });
    }

    const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const currentDate = today();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();

    const dataContext = `
PERIODO: ${startDate} al ${endDate}
HOY: ${currentDate} (dia ${currentDay} de ${daysInMonth})
TOTAL INGRESOS: $${totalIncome.toLocaleString('es-CO')} COP
TOTAL GASTOS: $${totalExpenses.toLocaleString('es-CO')} COP
BALANCE DEL PERIODO: $${(totalIncome - totalExpenses).toLocaleString('es-CO')} COP

TRANSACCIONES (${txs.length} en total):
${txs.map(t => `- [${t.date}] ${t.type === 'income' ? 'INGRESO' : t.type === 'expense' ? 'GASTO' : 'TRANSFERENCIA'} $${t.amount.toLocaleString('es-CO')} COP | Tipo gasto: ${t.expenseKind ?? 'sin clasificar'} | Billetera: ${t.walletName ?? 'N/A'} | "${t.description}"`).join('\n')}
    `.trim();

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODELS.text,
      messages: [
        { role: 'system', content: STATS_SYSTEM_PROMPT },
        { role: 'user', content: `Analiza estos datos financieros y dame un review completo:\n\n${dataContext}` },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const review = completion.choices[0]?.message?.content ?? 'No se pudo generar el analisis.';

    return new Response(JSON.stringify({ review }), { headers: jsonHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
  }
};
