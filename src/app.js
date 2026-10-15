// Calculator page behaviour. Uses window.Fop from engine.js.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const uah = n => n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' грн';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MON = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dmy = d => d.toISOString().slice(0, 10).split('-').reverse().join('.');

  // "150 000", "150000,50", "150 000.50" → number
  function num(id) {
    const v = parseFloat($(id).value.replace(/[\s ]/g, '').replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : 0;
  }
  function pretty(id) {
    const v = num(id);
    $(id).value = v ? v.toLocaleString('uk-UA', { maximumFractionDigits: 2 }) : '';
  }

  const line = (label, value) => `<div class="line"><span>${label}</span><span class="dots"></span><span class="num">${uah(value)}</span></div>`;

  function render() {
    const group = +document.querySelector('input[name=g]:checked').value;
    const vat = $('vat').checked, payEsv = $('esv').checked, quarterIncome = num('q');
    $('qBox').hidden = group !== 3;
    $('vatBox').hidden = group !== 3;

    const t = Fop.taxes({ group, quarterIncome, vat, payEsv });
    const quarter = t.period === 'quarter';
    $('rTitle').textContent = quarter ? 'Розрахунок · квартал' : 'Розрахунок · місяць';
    $('rLines').innerHTML =
      line(group === 3 ? `Єдиний податок ${vat ? 3 : 5}%` : 'Єдиний податок', t.tax) +
      line(group === 3 ? 'Військовий збір 1%' : 'Військовий збір', t.military) +
      (payEsv ? line(quarter ? 'ЄСВ за 3 місяці' : 'ЄСВ', t.esv) : '');
    $('rPer').textContent = quarter ? 'Разом за квартал' : 'Разом щомісяця';
    $('rTotal').textContent = uah(t.total);
    $('rYear').textContent = `≈ ${uah(t.yearTotal)} за рік`;

    const list = Fop.deadlines({ group, from: today, count: 5, quarterIncome, vat, payEsv });
    const nextPay = list.find(d => d.amount != null);
    $('rStamp').hidden = !nextPay;
    if (nextPay) $('rStampDate').textContent = dmy(nextPay.date);

    const l = Fop.limit({ group, incomeYtd: num('ytd') });
    $('mText').textContent = `${l.used.toLocaleString('uk-UA')}% з ${uah(l.limit)}`;
    $('mBar').className = 'bar ' + l.status;
    $('mBar').firstElementChild.style.width = Math.min(100, l.used) + '%';
    const note = $('mNote');
    note.className = 'note ' + l.status;
    note.textContent = l.status === 'over' ? 'Ліміт перевищено: сума понад ліміт оподатковується за ставкою 15%, потрібно змінити групу.'
      : l.status === 'warn' ? `Лишилось ${uah(l.left)}. Варто заздалегідь спланувати перехід на іншу групу.`
      : `Лишилось ${uah(l.left)}.`;

    $('dates').innerHTML = list.map(d => {
      const when = d.daysLeft === 0 ? 'сьогодні' : `через ${d.daysLeft} дн.`;
      return `<li class="${d.daysLeft <= 7 ? 'soon' : ''}">
        <span class="day"><b>${String(d.date.getUTCDate()).padStart(2, '0')}</b><span>${MON[d.date.getUTCMonth()]} ${d.date.getUTCFullYear()}</span></span>
        <span class="what">${esc(d.what)}${d.weekend ? '<span class="flag">вихідний</span>' : ''}<small>${when}</small></span>
        <span class="sum">${d.amount == null ? 'звіт' : uah(d.amount)}</span></li>`;
    }).join('');
  }

  const form = $('calc');
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  ['q', 'ytd'].forEach(id => $(id).addEventListener('blur', () => { pretty(id); render(); }));
  render();
})();
