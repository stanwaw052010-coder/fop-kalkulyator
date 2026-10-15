#!/usr/bin/env node
// Builds the static site into public/: one HTML file per page (Vercel cleanUrls serves /kalendar from kalendar.html),
// copies styles and scripts, writes robots.txt and sitemap.xml.
// SITE_URL (or Vercel's VERCEL_PROJECT_PRODUCTION_URL) sets canonical URLs and the sitemap.
const fs = require('fs');
const path = require('path');
const { layout } = require('./src/layout.js');
const pages = require('./src/pages.js');

const root = __dirname;
const out = path.join(root, 'public');
const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = (process.env.SITE_URL || (prod ? `https://${prod}` : '')).replace(/\/$/, '');

for (const p of pages) {
  const file = p.path === '/' ? 'index.html' : p.path.slice(1) + '.html';
  fs.writeFileSync(path.join(out, file), layout({ ...p, siteUrl }));
}

fs.copyFileSync(path.join(root, 'src/styles.css'), path.join(out, 'styles.css'));
fs.copyFileSync(path.join(root, 'src/app.js'), path.join(out, 'app.js'));
fs.copyFileSync(path.join(root, 'src/past.js'), path.join(out, 'past.js'));

const today = new Date().toISOString().slice(0, 10);
if (siteUrl) {
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  fs.writeFileSync(path.join(out, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(p => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    '\n</urlset>\n');
} else {
  fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  fs.rmSync(path.join(out, 'sitemap.xml'), { force: true });
}
console.log(`Built ${pages.length} pages into public/ (site URL: ${siteUrl || 'not set'})`);
