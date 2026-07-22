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

export function calculateCurrentCreditDebts(
  transactions: CreditTransactionForDebt[],
  currentDate: string,
  wallets: Map<number, { interestRate: number; interestPeriod: string; interestFromFirstInstallment: boolean }>,
) {
  const debts = new Map<number, CreditDebt>();

  for (const transaction of transactions) {
    const wallet = wallets.get(transaction.walletId);
    if (!wallet) continue;

    const installment = creditInstallment({
      amount: transaction.amount,
      installments: transaction.installments,
      installmentNumber: installmentNumberForMonth(transaction.date, currentDate),
      interestRate: wallet.interestRate,
      interestPeriod: wallet.interestPeriod,
      interestApplied: transaction.interestApplied,
      interestFromFirstInstallment: wallet.interestFromFirstInstallment,
    });
    const debt = debts.get(transaction.walletId) ?? { principal: 0, interest: 0, total: 0 };
    debts.set(transaction.walletId, {
      principal: debt.principal + installment.principal,
      interest: debt.interest + installment.interest,
      total: debt.total + installment.total,
    });
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
