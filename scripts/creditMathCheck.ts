import assert from 'node:assert/strict';
import { calculateCurrentCreditDebts, creditInstallmentsInRange, replaceCreditPurchasesWithInstallments } from '../src/lib/payments';
import { creditInstallment, installmentNumberForMonth } from '../src/lib/utils';

const base = { amount: 90_000, installments: 3, interestRate: 2, interestPeriod: 'MV', interestApplied: true };
const bancolombia = creditInstallment({ ...base, installmentNumber: 1, interestFromFirstInstallment: true });
const rappiFirst = creditInstallment({ ...base, installmentNumber: 1, interestFromFirstInstallment: false });
const rappiSecond = creditInstallment({ ...base, installmentNumber: 2, interestFromFirstInstallment: false });
const promotion = creditInstallment({ ...base, installmentNumber: 2, interestApplied: false, interestFromFirstInstallment: true });

assert.deepEqual(bancolombia, { principal: 30_000, interest: 1_800, total: 31_800 });
assert.deepEqual(rappiFirst, { principal: 30_000, interest: 0, total: 30_000 });
assert.deepEqual(rappiSecond, { principal: 30_000, interest: 1_200, total: 31_200 });
assert.deepEqual(promotion, { principal: 30_000, interest: 0, total: 30_000 });
assert.equal(installmentNumberForMonth('2026-06-15', '2026-07-16'), 2);
assert.deepEqual(creditInstallment({ ...base, installmentNumber: 0, interestFromFirstInstallment: true }), { principal: 0, interest: 0, total: 0 });

const walletSettings = new Map([[1, { interestRate: 0, interestPeriod: 'MV', interestFromFirstInstallment: false }]]);
const purchase = [{ walletId: 1, amount: 100_000, installments: 2, interestApplied: false, date: '2026-07-10' }];
const partialPayment = [{ walletId: 1, amount: 30_000, date: '2026-07-23' }];
const overpayment = [{ walletId: 1, amount: 70_000, date: '2026-07-23' }];

assert.deepEqual(calculateCurrentCreditDebts(purchase, '2026-07-23', walletSettings, overpayment).get(1), { principal: 0, interest: 0, total: 0 });
assert.deepEqual(calculateCurrentCreditDebts(purchase, '2026-08-23', walletSettings, partialPayment).get(1), { principal: 70_000, interest: 0, total: 70_000 });
assert.deepEqual(calculateCurrentCreditDebts(purchase, '2026-08-23', walletSettings, overpayment).get(1), { principal: 50_000, interest: 0, total: 50_000 });
assert.equal(replaceCreditPurchasesWithInstallments(849_980, [{ amount: 431_180 }, { amount: 26_000 }], [{ amount: 318_280 }]), 711_080);
assert.deepEqual(creditInstallmentsInRange([
  { walletId: 1, amount: 431_180, installments: 6, interestApplied: false, date: '2026-07-16', expenseKind: 'variable' },
  { walletId: 1, amount: 26_000, installments: 1, interestApplied: false, date: '2026-07-21', expenseKind: 'variable' },
], '2026-07-20', '2026-07-23', walletSettings), [
  { amount: 26_000, date: '2026-07-21', expenseKind: 'variable' },
]);

console.log('Calculos de tarjetas verificados.');
