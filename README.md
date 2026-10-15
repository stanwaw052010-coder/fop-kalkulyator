# ФОПчик — податки ФОП без нервів

Статичний сайт: калькулятор податків ФОП 1–3 групи, календар сплат, сторінки про ЄСВ, ліміти і вибір групи.

## Структура

- `public/engine.js` — усі розрахунки; суми року в `RULES`
- `src/pages.js` — тексти й структура сторінок (числа беруться з `engine.js`)
- `src/layout.js` — шапка, футер, SEO-теги, FAQ-розмітка
- `src/styles.css`, `src/app.js` (калькулятор), `src/past.js` (календар)
- `build.js` — збирає `public/*.html`, `sitemap.xml`, `robots.txt`
- `tests/` — `npm test`

## Локально

`npm start` → http://localhost:8095

## Vercel

Налаштування в `vercel.json` (збірка `node build.js`, папка `public`).
Змінна `SITE_URL=https://ваш-домен` вмикає canonical і sitemap.

## Щороку

Оновіть `RULES` у `public/engine.js` (МЗП, прожитковий мінімум, ліміти) і запустіть `npm test`.

Розрахунки довідкові й не є податковою консультацією.
