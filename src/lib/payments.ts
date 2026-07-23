import { creditInstallment, installmentNumberForMonth } from './utils';

export interface CreditTransactionForDebt {
  walletId: number;
  amount: number;
  installments: number;
  interestApplied: boolean;
  date: string;
}

export interface CreditDebt {
  principal: number;
  interest: number;
  total: number;
}

export interface CreditPaymentForDebt {
  walletId: number;
  amount: number;
  date: string;
}

export function replaceCreditPurchasesWithInstallments(
  expenses: number,
  creditPurchases: Array<{ amount: number }>,
  installments: Array<{ amount: number }>,
) {
  return expenses
    - creditPurchases.reduce((sum, transaction) => sum + transaction.amount, 0)
    + installments.reduce((sum, installment) => sum + installment.amount, 0);
}

export function creditInstallmentsInRange(
  transactions: Array<CreditTransactionForDebt & { expenseKind?: string | null }>,
  startDate: string,
  endDate: string,
  wallets: Map<number, { interestRate: number; interestPeriod: string; interestFromFirstInstallment: boolean }>,
) {
  return transactions.flatMap(transaction => {
    const wallet = wallets.get(transaction.walletId);
    if (!wallet) return [];

    const [year, month, day] = transaction.date.split('-').map(Number);
    const installments = [];
    for (let number = 1; number <= Math.max(1, Math.trunc(transaction.installments)); number += 1) {
      const date = dateForMonthDay(year, month - 1 + number - 1, day);
      if (date < startDate || date > endDate) continue;
      const installment = creditInstallment({
        amount: transaction.amount,
        installments: transaction.installments,
        installmentNumber: number,
        interestRate: wallet.interestRate,
        interestPeriod: wallet.interestPeriod,
        interestApplied: transaction.interestApplied,
        interestFromFirstInstallment: wallet.interestFromFirstInstallment,
      });
      if (installment.total > 0) installments.push({ amount: installment.total, date, expenseKind: transaction.expenseKind ?? null });
    }
    return installments;
  });
}

export function calculateCurrentCreditDebts(
  transactions: CreditTransactionForDebt[],
  currentDate: string,
  wallets: Map<number, { interestRate: number; interestPeriod: string; interestFromFirstInstallment: boolean }>,
  payments: CreditPaymentForDebt[] = [],
) {
  const monthlyEvents = new Map<number, Map<string, CreditDebt & { payments: number }>>();
  const eventFor = (walletId: number, month: string) => {
    const walletEvents = monthlyEvents.get(walletId) ?? new Map();
    monthlyEvents.set(walletId, walletEvents);
    const event = walletEvents.get(month) ?? { principal: 0, interest: 0, total: 0, payments: 0 };
    walletEvents.set(month, event);
    return event;
  };

  for (const transaction of transactions) {
    const wallet = wallets.get(transaction.walletId);
    if (!wallet) continue;

    const installmentCount = Math.min(
      Math.max(1, Math.trunc(transaction.installments)),
      Math.max(0, installmentNumberForMonth(transaction.date, currentDate)),
    );
    const [purchaseYear, purchaseMonth] = transaction.date.split('-').map(Number);

    for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
      const installment = creditInstallment({
        amount: transaction.amount,
        installments: transaction.installments,
        installmentNumber,
        interestRate: wallet.interestRate,
        interestPeriod: wallet.interestPeriod,
        interestApplied: transaction.interestApplied,
        interestFromFirstInstallment: wallet.interestFromFirstInstallment,
      });
      const month = new Date(Date.UTC(purchaseYear, purchaseMonth - 1 + installmentNumber - 1, 1)).toISOString().slice(0, 7);
      const event = eventFor(transaction.walletId, month);
      event.principal += installment.principal;
      event.interest += installment.interest;
      event.total += installment.total;
    }
  }

  for (const payment of payments) {
    if (!wallets.has(payment.walletId) || payment.amount <= 0 || payment.date > currentDate) continue;
    eventFor(payment.walletId, payment.date.slice(0, 7)).payments += payment.amount;
  }

  const debts = new Map<number, CreditDebt>();

  for (const [walletId, events] of monthlyEvents) {
    const debt = { principal: 0, interest: 0, total: 0 };
    for (const [, event] of [...events.entries()].sort(([monthA], [monthB]) => monthA.localeCompare(monthB))) {
      debt.principal += event.principal;
      debt.interest += event.interest;
      const interestPaid = Math.min(debt.interest, event.payments);
      debt.interest -= interestPaid;
      debt.principal = Math.max(0, debt.principal - (event.payments - interestPaid));
      debt.total = debt.principal + debt.interest;
    }
    debts.set(walletId, debt);
  }

  return debts;
}

function dateForMonthDay(year: number, monthIndex: number, day: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay)));
  return date.toISOString().slice(0, 10);
}

export function cardPaymentWindow(currentDate: string, statementDay?: number | null, dueDay?: number | null) {
  if (!statementDay || !dueDay) return null;

  const [year, month, day] = currentDate.split('-').map(Number);
  const current = dateForMonthDay(year, month - 1, day);

  for (let offset = -2; offset <= 2; offset += 1) {
    const monthDate = new Date(Date.UTC(year, month - 1 + offset, 1));
    const start = dateForMonthDay(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), statementDay);
    const dueMonthOffset = dueDay < statementDay ? 1 : 0;
    const end = dateForMonthDay(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + dueMonthOffset, dueDay);
    if (start <= current && current <= end) return { start, end };
  }

  return null;
}
