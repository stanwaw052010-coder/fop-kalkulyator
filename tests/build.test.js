const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, 'public', f), 'utf8');

test('build writes every page with title, description and canonical', () => {
  execFileSync('node', ['build.js'], { cwd: root, env: { ...process.env, SITE_URL: 'https://example.test' } });
  for (const [file, url] of [['index.html', '/'], ['kalendar.html', '/kalendar'], ['yesv.html', '/yesv'], ['limity.html', '/limity'], ['grupy.html', '/grupy']]) {
    const html = read(file);
    assert.match(html, /<title>[^<]{20,}<\/title>/, file);
    assert.match(html, /<meta name="description" content="[^"]{50,}"/, file);
    assert.ok(html.includes(`<link rel="canonical" href="https://example.test${url}">`), file);
    assert.ok(html.includes('"@type":"FAQPage"'), file);
  }
  const sitemap = read('sitemap.xml');
  assert.strictEqual((sitemap.match(/<loc>/g) || []).length, 5);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/example.test\/sitemap.xml/);
});

test('page numbers match the engine', () => {
  assert.ok(read('yesv.html').includes('1 902,34 грн'));
  assert.ok(read('limity.html').includes('1 444 049 грн'));
  assert.ok(read('grupy.html').includes('1 729,40 грн'));
});

test('calendar for 3rd group lists the Q3 2026 declaration and payment dates', () => {
  const html = read('kalendar.html');
  assert.ok(html.includes('data-date="2026-11-09"'));
  assert.ok(html.includes('data-date="2026-11-19"'));
});

test('build without SITE_URL drops canonical and sitemap', () => {
  const env = { ...process.env }; delete env.SITE_URL; delete env.VERCEL_PROJECT_PRODUCTION_URL;
  execFileSync('node', ['build.js'], { cwd: root, env });
  assert.ok(!read('index.html').includes('rel="canonical"'));
  assert.ok(!fs.existsSync(path.join(root, 'public', 'sitemap.xml')));
});
