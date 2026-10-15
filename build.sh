#!/bin/sh
# Builds the static site in public/ from src/page.html.
# SITE_URL (or Vercel's VERCEL_PROJECT_PRODUCTION_URL) sets canonical, Open Graph and sitemap URLs.
set -e
cd "$(dirname "$0")"
URL="${SITE_URL:-${VERCEL_PROJECT_PRODUCTION_URL:+https://$VERCEL_PROJECT_PRODUCTION_URL}}"
URL="${URL%/}"
TITLE="Калькулятор податків ФОП 2026"
DESC=$(sed -n 's/.*<meta name="description" content="\([^"]*\)".*/\1/p' src/page.html)

{
  printf '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n'
  printf '<meta property="og:type" content="website">\n<meta property="og:locale" content="uk_UA">\n'
  printf '<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n' "$TITLE" "$DESC"
  if [ -n "$URL" ]; then
    printf '<link rel="canonical" href="%s/">\n<meta property="og:url" content="%s/">\n' "$URL" "$URL"
  fi
  sed -n '1,/<\/style>/p' src/page.html | grep -v 'claude:viewport-fit-sides'
  printf '</head>\n<body>\n'
  sed -n '/<\/style>/,$p' src/page.html | tail -n +2
  printf '</body>\n</html>\n'
} > public/index.html

if [ -n "$URL" ]; then
  printf 'User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' "$URL" > public/robots.txt
  printf '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>%s/</loc><lastmod>%s</lastmod></url>\n</urlset>\n' "$URL" "$(date -u +%Y-%m-%d)" > public/sitemap.xml
else
  printf 'User-agent: *\nAllow: /\n' > public/robots.txt
  rm -f public/sitemap.xml
fi
echo "Built public/ (site URL: ${URL:-not set})"
