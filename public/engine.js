// ФОП-помічник — розрахунок податків, ліміту доходу і найближчих строків сплати для ФОП на єдиному податку.
// Чисті функції, працюють у браузері й у Node. Значення року винесені в RULES, щоб щороку оновлювати лише їх.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Fop = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Джерело: Закон «Про Державний бюджет України на 2026 рік» (МЗП 8647 грн, прожитковий мінімум 3328 грн)
  // у переказі buhplatforma.com.ua, buhgalter911.com, zaxid.net. Перевіряти з ДПС на початку кожного року.
  const RULES = {
    2026: {
      minWage: 8647,
      subsistence: 3328,
      esvMonthly: 1902.34,          // 22% МЗП
      groups: {
        1: { tax: 332.80, militaryMonthly: 864.70, limit: 1444049 },  // 10% ПМ; ВЗ 10% МЗП; 167 МЗП
        2: { tax: 1729.40, militaryMonthly: 864.70, limit: 7211598 }, // 20% МЗП; ВЗ 10% МЗП; 834 МЗП
        3: { rate: 0.05, rateVat: 0.03, militaryRate: 0.01, limit: 10091049 }, // 1167 МЗП
      },
    },
  };

  const round2 = n => Math.round(n * 100) / 100;
  const ymd = (y, m, d) => new Date(Date.UTC(y, m, d));
  const addDays = (date, n) => new Date(date.getTime() + n * 86400000);
  const isWeekend = d => d.getUTCDay() === 0 || d.getUTCDay() === 6;

  function rulesFor(year) {
    const r = RULES[year];
    if (!r) throw new Error('Немає даних для ' + year + ' року');
    return r;
  }

  // Скільки платить ФОП. Для 3 групи потрібен дохід за квартал.
  // Повертає суми за місяць (1–2 група) або за квартал (3 група) і за рік.
  function taxes({ year = 2026, group, quarterIncome = 0, vat = false, payEsv = true }) {
    const r = rulesFor(year), g = r.groups[group];
    if (!g) throw new Error('Невідома група: ' + group);
    const esvQuarter = payEsv ? round2(r.esvMonthly * 3) : 0;
    if (group === 3) {
      const tax = round2(quarterIncome * (vat ? g.rateVat : g.rate));
      const military = round2(quarterIncome * g.militaryRate);
      const quarter = round2(tax + military + esvQuarter);
      return { period: 'quarter', tax, military, esv: esvQuarter, total: quarter, yearTotal: round2(quarter * 4) };
    }
    const monthTotal = round2(g.tax + g.militaryMonthly + (payEsv ? r.esvMonthly : 0));
    return {
      period: 'month', tax: g.tax, military: g.militaryMonthly, esv: payEsv ? r.esvMonthly : 0,
      total: monthTotal, yearTotal: round2(monthTotal * 12),
    };
  }

  // Використання річного ліміту доходу.
  function limit({ year = 2026, group, incomeYtd = 0 }) {
    const lim = rulesFor(year).groups[group].limit;
    const used = incomeYtd / lim;
    return {
      limit: lim,
      used: round2(used * 100),
      left: round2(Math.max(0, lim - incomeYtd)),
      status: used >= 1 ? 'over' : used >= 0.8 ? 'warn' : 'ok',
    };
  }

  // Найближчі строки сплати від дати `from` (включно), відсортовані за датою.
  // 1–2 група: ЄП і ВЗ щомісяця до 20 числа поточного місяця.
  // Усі групи: ЄСВ за квартал до 20 числа наступного місяця.
  // 3 група: декларація протягом 40 днів після кварталу, сплата ЄП і ВЗ протягом 10 днів після цього.
  function deadlines({ year = 2026, group, from, count = 4, quarterIncome = 0, vat = false, payEsv = true }) {
    const r = rulesFor(year), out = [];
    const start = ymd(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const t = taxes({ year, group, quarterIncome, vat, payEsv });
    const qNames = ['I', 'II', 'III', 'IV'];

    for (let y = start.getUTCFullYear() - 1; y <= start.getUTCFullYear() + 1; y++) {
      for (let q = 0; q < 4; q++) {
        const qEnd = ymd(y, q * 3 + 3, 0); // останній день кварталу
        if (payEsv) out.push({
          date: ymd(y, q * 3 + 3, 20),
          what: `ЄСВ за ${qNames[q]} квартал ${y}`,
          amount: round2(r.esvMonthly * 3),
        });
        if (group === 3) {
          const decl = addDays(qEnd, 40);
          out.push({ date: decl, what: `Декларація за ${qNames[q]} квартал ${y}`, amount: null });
          out.push({ date: addDays(decl, 10), what: `Єдиний податок і військовий збір за ${qNames[q]} квартал ${y}`, amount: round2(t.tax + t.military) });
        }
      }
      if (group !== 3) {
        for (let m = 0; m < 12; m++) {
          out.push({ date: ymd(y, m, 20), what: `Єдиний податок і військовий збір за ${monthName(m)} ${y}`, amount: round2(t.tax + t.military) });
        }
        out.push({ date: ymd(y, 2, 1), what: `Річна декларація за ${y - 1} рік`, amount: null });
      }
    }
    return out
      .filter(d => d.date >= start)
      .sort((a, b) => a.date - b.date)
      .slice(0, count)
      .map(d => ({ ...d, weekend: isWeekend(d.date), daysLeft: Math.round((d.date - start) / 86400000) }));
  }

  const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  const monthName = m => MONTHS[m];

  return { RULES, taxes, limit, deadlines };
});
