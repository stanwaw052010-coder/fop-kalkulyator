const test = require('node:test');
const assert = require('node:assert');
const F = require('../public/engine.js');
const d = s => new Date(s + 'T00:00:00Z');
const iso = x => x.toISOString().slice(0, 10);

test('2026 amounts follow MZP 8647 and PM 3328', () => {
  const r = F.RULES[2026];
  assert.strictEqual(r.esvMonthly, Math.round(r.minWage * 0.22 * 100) / 100);
  assert.strictEqual(r.groups[1].tax, Math.round(r.subsistence * 0.10 * 100) / 100);
  assert.strictEqual(r.groups[2].tax, Math.round(r.minWage * 0.20 * 100) / 100);
  assert.strictEqual(r.groups[1].militaryMonthly, Math.round(r.minWage * 0.10 * 100) / 100);
  assert.strictEqual(r.groups[1].limit, 167 * r.minWage);
  assert.strictEqual(r.groups[2].limit, 834 * r.minWage);
  assert.strictEqual(r.groups[3].limit, 1167 * r.minWage);
});

test('group 2 monthly total = ЄП + ВЗ + ЄСВ', () => {
  const t = F.taxes({ group: 2 });
  assert.strictEqual(t.total, 4496.44);
  assert.strictEqual(t.yearTotal, 53957.28);
});

test('group 3 quarter: 5% + 1% of income + ЄСВ for 3 months', () => {
  const t = F.taxes({ group: 3, quarterIncome: 100000 });
  assert.deepStrictEqual([t.tax, t.military, t.esv, t.total], [5000, 1000, 5707.02, 11707.02]);
  assert.strictEqual(F.taxes({ group: 3, quarterIncome: 100000, vat: true }).tax, 3000);
});

test('ЄСВ can be switched off for exempt ФОП', () => {
  assert.strictEqual(F.taxes({ group: 1, payEsv: false }).total, 1197.5);
});

test('limit usage and status', () => {
  assert.strictEqual(F.limit({ group: 1, incomeYtd: 722024.5 }).used, 50);
  assert.strictEqual(F.limit({ group: 1, incomeYtd: 1200000 }).status, 'warn');
  assert.strictEqual(F.limit({ group: 1, incomeYtd: 1500000 }).status, 'over');
});

test('group 3 deadlines from 15 Oct 2026', () => {
  const ds = F.deadlines({ group: 3, from: d('2026-10-15'), quarterIncome: 100000 });
  assert.deepStrictEqual(ds.map(x => iso(x.date)), ['2026-10-20', '2026-11-09', '2026-11-19', '2027-01-20']);
  assert.match(ds[0].what, /ЄСВ за III квартал 2026/);
  assert.strictEqual(ds[2].amount, 6000);
  assert.strictEqual(ds[0].daysLeft, 5);
});

test('group 1 deadlines are monthly on the 20th plus quarterly ЄСВ', () => {
  const ds = F.deadlines({ group: 1, from: d('2026-10-21'), count: 3 });
  assert.deepStrictEqual(ds.map(x => iso(x.date)), ['2026-11-20', '2026-12-20', '2027-01-20']);
});

test('annual declaration for groups 1-2 appears before 1 March', () => {
  const ds = F.deadlines({ group: 2, from: d('2027-02-21'), count: 2 });
  assert.match(ds[0].what, /Річна декларація за 2026/);
});

test('weekend deadlines are flagged', () => {
  const ds = F.deadlines({ group: 1, from: d('2026-12-01'), count: 1 });
  assert.strictEqual(iso(ds[0].date), '2026-12-20');
  assert.strictEqual(ds[0].weekend, true); // 20.12.2026 — неділя
});

test('unknown year fails loudly', () => {
  assert.throws(() => F.taxes({ year: 2031, group: 1 }), /2031/);
});
