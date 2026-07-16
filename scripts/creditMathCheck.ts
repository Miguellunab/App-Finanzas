import assert from 'node:assert/strict';
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
