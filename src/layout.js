// Shared page shell: head (SEO tags), header with navigation, footer.
const NAV = [
  ['/', 'Калькулятор'],
  ['/kalendar', 'Календар сплат'],
  ['/yesv', 'ЄСВ'],
  ['/limity', 'Ліміти'],
  ['/grupy', 'Яку групу обрати'],
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function layout({ path, title, description, body, scripts = [], jsonld = null, siteUrl = '' }) {
  const canonical = siteUrl ? `${siteUrl}${path === '/' ? '/' : path}` : '';
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === path ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">\n<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="uk_UA">
<meta property="og:site_name" content="ФОПчик">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta name="theme-color" content="#eceeea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e1412" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/styles.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="logo" href="/"><b>ФОП<span>чик</span></b><small>податки ФОП без нервів</small></a>
    <nav class="nav" aria-label="Розділи">${nav}</nav>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <nav aria-label="Розділи сайту">${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>
    <p>Розрахунки довідкові й не є податковою консультацією. Суми 2026 року розраховано з мінімальної зарплати 8647 грн і прожиткового мінімуму 3328 грн (Закон «Про Державний бюджет України на 2026 рік»). Пільги для окремих категорій не враховано. Реквізити й актуальні правила перевіряйте в Електронному кабінеті ДПС.</p>
    <p>© 2026 ФОПчик</p>
  </div>
</footer>
${scripts.map(s => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}

// FAQPage structured data from [question, answer] pairs.
function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

function faqHtml(items) {
  return `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}

module.exports = { layout, faqJsonLd, faqHtml, esc, NAV };
