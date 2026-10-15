// Page definitions. Numbers come from public/engine.js so text and calculator never disagree.
const Fop = require('../public/engine.js');
const { faqJsonLd, faqHtml, esc } = require('./layout.js');

const R = Fop.RULES[2026];
const G = R.groups;
const uah = n => n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ') + ' грн';
const uah0 = n => Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ') + ' грн';
const MON = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
const dmy = d => d.toISOString().slice(0, 10).split('-').reverse().join('.');

const t1 = Fop.taxes({ group: 1 }), t2 = Fop.taxes({ group: 2 });
const esvQ = Math.round(R.esvMonthly * 3 * 100) / 100;

// ---------- Home: calculator ----------
const homeFaq = [
  ['Скільки платить ФОП 1 групи у 2026 році?', `Єдиний податок ${uah(G[1].tax)} на місяць, військовий збір ${uah(G[1].militaryMonthly)} і ЄСВ ${uah(R.esvMonthly)}. Разом ${uah(t1.total)} на місяць, якщо ви не звільнені від ЄСВ.`],
  ['Скільки платить ФОП 2 групи у 2026 році?', `Єдиний податок ${uah(G[2].tax)}, військовий збір ${uah(G[2].militaryMonthly)} і ЄСВ ${uah(R.esvMonthly)}. Разом ${uah(t2.total)} на місяць.`],
  ['Скільки платить ФОП 3 групи?', `5% від доходу без ПДВ (або 3% для платників ПДВ), військовий збір 1% від доходу і ЄСВ ${uah(R.esvMonthly)} на місяць, тобто ${uah(esvQ)} за квартал.`],
  ['Коли сплачувати податки ФОП?', '1 і 2 група сплачують єдиний податок і військовий збір щомісяця до 20 числа. ЄСВ усі групи сплачують за квартал до 20 числа наступного місяця. 3 група подає декларацію протягом 40 днів після кварталу і сплачує податки протягом наступних 10 днів.'],
];

const home = {
  path: '/',
  title: 'Калькулятор податків ФОП 2026 — скільки платити на 1, 2, 3 групі | ФОПчик',
  description: 'Порахуйте єдиний податок, військовий збір і ЄСВ для ФОП 1, 2 чи 3 групи у 2026 році. Ліміт доходу і найближчі строки сплати з сумами.',
  scripts: ['/engine.js', '/app.js'],
  jsonld: faqJsonLd(homeFaq),
  body: `
<span class="kicker">Калькулятор · 2026</span>
<h1>Скільки платити ФОП цього кварталу</h1>
<p class="lede">Оберіть групу і введіть дохід. Покажемо суму до сплати, скільки лишилось до ліміту і коли платити.</p>

<div class="tool">
  <form class="form" id="calc" autocomplete="off" onsubmit="return false">
    <div class="q">
      <span class="label" id="gl">Група єдиного податку</span>
      <div class="groups" role="radiogroup" aria-labelledby="gl">
        <input type="radio" name="g" id="g1" value="1"><label for="g1"><b>1</b><span>ринок, побут</span></label>
        <input type="radio" name="g" id="g2" value="2"><label for="g2"><b>2</b><span>послуги, торгівля</span></label>
        <input type="radio" name="g" id="g3" value="3" checked><label for="g3"><b>3</b><span>будь-яка діяльність</span></label>
      </div>
    </div>
    <div class="q" id="qBox">
      <label class="label" for="q">Дохід за квартал</label>
      <div class="money"><input id="q" type="text" inputmode="decimal" value="150 000"><span>грн</span></div>
      <span class="hint">Податок 3 групи рахується від фактично отриманого доходу.</span>
    </div>
    <label class="check" id="vatBox"><input type="checkbox" id="vat"> Я платник ПДВ — ставка 3%</label>
    <div class="q">
      <label class="label" for="ytd">Дохід з початку року</label>
      <div class="money"><input id="ytd" type="text" inputmode="decimal" value="450 000"><span>грн</span></div>
      <span class="hint">Для перевірки річного ліміту.</span>
    </div>
    <label class="check"><input type="checkbox" id="esv" checked> Сплачую ЄСВ за себе</label>
    <p class="small" style="margin:0">Поля заповнено прикладом — введіть свої суми.</p>
  </form>

  <div>
    <section class="receipt" aria-live="polite" aria-label="Розрахунок">
      <div class="head"><span id="rTitle">Розрахунок</span><span>ФОПчик</span></div>
      <div class="lines" id="rLines"></div>
      <div class="total-row">
        <div class="total"><small id="rPer">До сплати</small><strong id="rTotal">—</strong><span class="year" id="rYear"></span></div>
        <div class="stamp" id="rStamp" hidden><span>найближча сплата</span><b id="rStampDate"></b></div>
      </div>
    </section>
    <div class="meter">
      <div class="top"><span>Річний ліміт доходу</span><span class="num" id="mText"></span></div>
      <div class="bar" id="mBar"><i></i></div>
      <span class="note" id="mNote"></span>
    </div>
  </div>
</div>

<h2>Найближчі строки</h2>
<ul class="dates" id="dates"></ul>
<p class="small" style="margin-top:12px">Якщо строк припадає на вихідний, безпечніше сплатити в останній робочий день перед ним. <a href="/kalendar">Повний календар на 2026 рік</a></p>

<div class="soon-box">
  <b>Нагадування в Telegram — готуємо</b>
  <p>Бот напише за 3 дні до кожного строку, підкаже точну суму і попередить, коли дохід наближається до ліміту.</p>
</div>

<h2>Питання та відповіді</h2>
${faqHtml(homeFaq)}
`,
};

// ---------- Calendar ----------
function calendarRows(group) {
  const all = Fop.deadlines({ group, from: new Date(Date.UTC(2026, 0, 1)), count: 60, quarterIncome: 0 })
    .filter(d => d.date.getUTCFullYear() === 2026);
  return all.map(d => {
    const amount = d.amount == null ? 'звіт' : (group === 3 && /Єдиний/.test(d.what) ? '5% + 1% від доходу' : uah(d.amount));
    return `<tr data-date="${d.date.toISOString().slice(0, 10)}"><td class="num">${dmy(d.date)}${d.weekend ? ' <span class="flag">вихідний</span>' : ''}</td><td>${esc(d.what)}</td><td class="r num">${amount}</td></tr>`;
  }).join('');
}

const calendarFaq = [
  ['До якого числа платити ЄСВ ФОП?', 'ЄСВ за себе ФОП сплачує щокварталу до 20 числа місяця, що настає за кварталом: до 20 квітня, 20 липня, 20 жовтня і 20 січня.'],
  ['Коли 3 група подає декларацію?', 'Протягом 40 календарних днів після закінчення кварталу. Податки за квартал сплачуються протягом 10 днів після граничного строку подання декларації.'],
  ['Коли 1 і 2 група подають декларацію?', 'Раз на рік, протягом 60 днів після закінчення року — орієнтовно до 1 березня. Єдиний податок і військовий збір сплачуються щомісяця до 20 числа.'],
];

const calendar = {
  path: '/kalendar',
  title: 'Календар сплати податків ФОП 2026: усі строки для 1, 2 і 3 групи | ФОПчик',
  description: 'Усі строки сплати єдиного податку, військового збору, ЄСВ і подання декларацій для ФОП 1, 2 і 3 групи у 2026 році.',
  scripts: ['/past.js'],
  jsonld: faqJsonLd(calendarFaq),
  body: `
<span class="kicker">Календар · 2026</span>
<h1>Календар сплати податків ФОП на 2026 рік</h1>
<p class="lede">Усі строки сплати і звітності, згруповані за групою єдиного податку. Минулі дати позначені сірим.</p>

<h2 id="g3">3 група</h2>
<p>Єдиний податок 5% (або 3% з ПДВ) і військовий збір 1% від доходу — щокварталу, після декларації. ЄСВ — ${uah(esvQ)} за квартал.</p>
<div class="table-wrap"><table><thead><tr><th>Строк</th><th>Що</th><th class="r">Сума</th></tr></thead><tbody>${calendarRows(3)}</tbody></table></div>

<h2 id="g2">2 група</h2>
<p>Щомісяця до 20 числа: єдиний податок ${uah(G[2].tax)} і військовий збір ${uah(G[2].militaryMonthly)}. ЄСВ — щокварталу.</p>
<div class="table-wrap"><table><thead><tr><th>Строк</th><th>Що</th><th class="r">Сума</th></tr></thead><tbody>${calendarRows(2)}</tbody></table></div>

<h2 id="g1">1 група</h2>
<p>Щомісяця до 20 числа: єдиний податок ${uah(G[1].tax)} і військовий збір ${uah(G[1].militaryMonthly)}. ЄСВ — щокварталу.</p>
<div class="table-wrap"><table><thead><tr><th>Строк</th><th>Що</th><th class="r">Сума</th></tr></thead><tbody>${calendarRows(1)}</tbody></table></div>

<h2>Питання та відповіді</h2>
${faqHtml(calendarFaq)}
<p style="margin-top:28px"><a class="cta-link" href="/">Порахувати свою суму →</a></p>
`,
};

// ---------- ЄСВ ----------
const esvFaq = [
  ['Скільки ЄСВ платить ФОП у 2026 році?', `Мінімальний ЄСВ — ${uah(R.esvMonthly)} на місяць (22% від мінімальної зарплати ${uah0(R.minWage)}), тобто ${uah(esvQ)} за квартал і ${uah(R.esvMonthly * 12)} за рік.`],
  ['Чи треба платити ЄСВ, якщо не було доходу?', 'Так, ФОП на єдиному податку сплачує мінімальний ЄСВ незалежно від наявності доходу, якщо не належить до категорій, звільнених від сплати ЄСВ за себе.'],
  ['Чи можна платити ЄСВ більше мінімуму?', 'Так, ФОП може самостійно сплатити ЄСВ у більшому розмірі — це збільшує страховий стаж і майбутню пенсію. Максимальна база — 20 мінімальних зарплат на місяць.'],
];

const esv = {
  path: '/yesv',
  title: `ЄСВ для ФОП у 2026 році: ${uah(R.esvMonthly)} на місяць, строки сплати | ФОПчик`,
  description: `Скільки ЄСВ платить ФОП у 2026 році, до якого числа сплачувати і як звітувати. Мінімальний внесок ${uah(R.esvMonthly)} на місяць.`,
  jsonld: faqJsonLd(esvFaq),
  body: `
<span class="kicker">ЄСВ · 2026</span>
<h1>ЄСВ для ФОП у 2026 році</h1>
<p class="lede">Єдиний соціальний внесок «за себе» — однаковий для 1, 2 і 3 групи. Рахується від мінімальної зарплати, а не від доходу.</p>

<div class="facts">
  <div><b>${uah(R.esvMonthly)}</b><span>на місяць, мінімум</span></div>
  <div><b>${uah(esvQ)}</b><span>за квартал</span></div>
  <div><b>${uah(R.esvMonthly * 12)}</b><span>за рік</span></div>
  <div><b>22%</b><span>від мінімальної зарплати ${uah0(R.minWage)}</span></div>
</div>

<h2>До якого числа платити</h2>
<p>ЄСВ сплачується щокварталу до 20 числа місяця, що настає за кварталом:</p>
<div class="table-wrap"><table><thead><tr><th>Квартал</th><th>Сплатити до</th><th class="r">Сума</th></tr></thead><tbody>
<tr><td>IV квартал 2025</td><td class="num">20.01.2026</td><td class="r num">${uah(esvQ)}</td></tr>
<tr><td>I квартал 2026</td><td class="num">20.04.2026</td><td class="r num">${uah(esvQ)}</td></tr>
<tr><td>II квартал 2026</td><td class="num">20.07.2026</td><td class="r num">${uah(esvQ)}</td></tr>
<tr><td>III квартал 2026</td><td class="num">20.10.2026</td><td class="r num">${uah(esvQ)}</td></tr>
<tr><td>IV квартал 2026</td><td class="num">20.01.2027</td><td class="r num">${uah(esvQ)}</td></tr>
</tbody></table></div>
<p class="small">Сплатити можна і раніше — наприклад, щомісяця. Головне, щоб уся сума за квартал надійшла до строку.</p>

<h2>Як звітувати</h2>
<p>Окремого звіту з ЄСВ ФОП на єдиному податку не подає: дані про ЄСВ входять у декларацію платника єдиного податку. 3 група подає її щокварталу, 1 і 2 група — раз на рік.</p>

<h2>Питання та відповіді</h2>
${faqHtml(esvFaq)}
<p style="margin-top:28px"><a class="cta-link" href="/">Порахувати всі податки разом →</a></p>
`,
};

// ---------- Ліміти ----------
const limFaq = [
  ['Що буде, якщо перевищити ліміт доходу ФОП?', 'Сума перевищення оподатковується за ставкою 15%. ФОП 1 і 2 групи мають перейти на 3 групу або загальну систему з наступного кварталу, ФОП 3 групи — на загальну систему.'],
  ['Від чого рахується ліміт?', `Ліміти прив'язані до мінімальної зарплати на 1 січня: 167 МЗП для 1 групи, 834 МЗП для 2 групи і 1167 МЗП для 3 групи. У 2026 році МЗП — ${uah0(R.minWage)}.`],
  ['Чи враховується дохід за весь рік?', 'Так, ліміт стосується доходу за календарний рік, з 1 січня по 31 грудня.'],
];

const limits = {
  path: '/limity',
  title: 'Ліміти доходу ФОП у 2026 році для 1, 2 і 3 групи | ФОПчик',
  description: `Ліміти доходу ФОП 2026: 1 група — ${uah0(G[1].limit)}, 2 група — ${uah0(G[2].limit)}, 3 група — ${uah0(G[3].limit)}. Що буде при перевищенні.`,
  jsonld: faqJsonLd(limFaq),
  body: `
<span class="kicker">Ліміти · 2026</span>
<h1>Ліміти доходу ФОП у 2026 році</h1>
<p class="lede">Скільки можна заробити за рік, щоб лишитись на своїй групі єдиного податку.</p>

<div class="facts">
  <div><b>${uah0(G[1].limit)}</b><span>1 група · 167 МЗП</span></div>
  <div><b>${uah0(G[2].limit)}</b><span>2 група · 834 МЗП</span></div>
  <div><b>${uah0(G[3].limit)}</b><span>3 група · 1167 МЗП</span></div>
</div>

<h2>Скільки це на місяць</h2>
<div class="table-wrap"><table><thead><tr><th>Група</th><th class="r">За рік</th><th class="r">У середньому на місяць</th></tr></thead><tbody>
${[1, 2, 3].map(g => `<tr><td>${g} група</td><td class="r num">${uah0(G[g].limit)}</td><td class="r num">${uah0(G[g].limit / 12)}</td></tr>`).join('')}
</tbody></table></div>

<h2>Що робити, якщо дохід наближається до ліміту</h2>
<ul class="plain">
  <li>Стежте за доходом з початку року — <a href="/">калькулятор</a> покаже, скільки лишилось.</li>
  <li>Якщо ви на 1 чи 2 групі і бачите, що перевищите ліміт, перейдіть на 3 групу заздалегідь: заяву подають не пізніше ніж за 15 днів до початку нового кварталу.</li>
  <li>Якщо перевищення вже сталося, сума понад ліміт оподатковується за ставкою 15%.</li>
</ul>

<h2>Питання та відповіді</h2>
${faqHtml(limFaq)}
`,
};

// ---------- Групи ----------
const groupsFaq = [
  ['Яку групу ФОП обрати для IT?', 'Для IT-послуг, які надаються компаніям і іноземним клієнтам, зазвичай обирають 3 групу: на 2 групі не можна надавати послуги підприємствам на загальній системі оподаткування.'],
  ['Чи можна ФОП 2 групи працювати з іноземними клієнтами?', 'Обмеження 2 групи стосуються покупців — вона може працювати лише з населенням і платниками єдиного податку. Для роботи з іноземними компаніями зазвичай потрібна 3 група.'],
  ['Скільки працівників можна мати?', '1 група — без найманих працівників, 2 група — до 10 працівників одночасно, 3 група — без обмежень.'],
];

const groups = {
  path: '/grupy',
  title: 'Яку групу ФОП обрати у 2026: порівняння 1, 2 і 3 групи | ФОПчик',
  description: 'Порівняння груп єдиного податку: хто може бути на 1, 2 і 3 групі, скільки платити у 2026 році, ліміти доходу і обмеження.',
  jsonld: faqJsonLd(groupsFaq),
  body: `
<span class="kicker">Групи · 2026</span>
<h1>Яку групу ФОП обрати</h1>
<p class="lede">Коротке порівняння трьох груп єдиного податку з сумами 2026 року.</p>

<div class="table-wrap"><table>
<thead><tr><th></th><th>1 група</th><th>2 група</th><th>3 група</th></tr></thead>
<tbody>
<tr><td>Для кого</td><td>Роздрібна торгівля на ринках, побутові послуги населенню</td><td>Послуги й торгівля для населення та платників єдиного податку</td><td>Будь-яка дозволена діяльність, зокрема IT й експорт послуг</td></tr>
<tr><td>Єдиний податок</td><td class="num">${uah(G[1].tax)} / міс</td><td class="num">${uah(G[2].tax)} / міс</td><td class="num">5% від доходу<br>(3% з ПДВ)</td></tr>
<tr><td>Військовий збір</td><td class="num">${uah(G[1].militaryMonthly)} / міс</td><td class="num">${uah(G[2].militaryMonthly)} / міс</td><td class="num">1% від доходу</td></tr>
<tr><td>ЄСВ</td><td class="num">${uah(R.esvMonthly)} / міс</td><td class="num">${uah(R.esvMonthly)} / міс</td><td class="num">${uah(R.esvMonthly)} / міс</td></tr>
<tr><td>Ліміт доходу</td><td class="num">${uah0(G[1].limit)}</td><td class="num">${uah0(G[2].limit)}</td><td class="num">${uah0(G[3].limit)}</td></tr>
<tr><td>Працівники</td><td>Без працівників</td><td>До 10 осіб</td><td>Без обмежень</td></tr>
<tr><td>Звітність</td><td>Декларація раз на рік</td><td>Декларація раз на рік</td><td>Декларація щокварталу</td></tr>
</tbody></table></div>

<h2>Коли яка група вигідніша</h2>
<p>На 3 групі податки залежать від доходу, а на 1 і 2 — фіксовані. 3 група вигідніша, коли дохід невеликий або нерівномірний; 2 група — коли дохід стабільно високий, а клієнти — населення або інші ФОП-єдинники.</p>
<p>Приклад: при доході 30 000 грн на місяць ФОП 3 групи сплатить 1 800 грн податків і збору (6%), а ФОП 2 групи — ${uah(G[2].tax + G[2].militaryMonthly)} незалежно від доходу. ЄСВ однаковий.</p>

<h2>Питання та відповіді</h2>
${faqHtml(groupsFaq)}
<p style="margin-top:28px"><a class="cta-link" href="/">Порахувати податки для своєї групи →</a></p>
`,
};

module.exports = [home, calendar, esv, limits, groups];
