import assert from 'node:assert/strict';
import { getCurrentMonthRange } from '../src/lib/utils';

assert.deepEqual(getCurrentMonthRange('2026-07-19'), { start: '2026-06-20', end: '2026-07-19' });
assert.deepEqual(getCurrentMonthRange('2026-07-20'), { start: '2026-07-20', end: '2026-08-19' });
assert.deepEqual(getCurrentMonthRange('2026-01-01'), { start: '2025-12-20', end: '2026-01-19' });

console.log('Ciclos financieros verificados.');
