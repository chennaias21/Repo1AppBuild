// Dev tool: renders the app icon + splash PNGs (needs Playwright + Chromium: `npm i -D playwright`).
// Output goes to resources/ (input for @capacitor/assets) and public/ (PWA icons).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('resources', { recursive: true });
mkdirSync('public', { recursive: true });

const GRAD = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5bf0"/><stop offset="1" stop-color="#9a7cff"/></linearGradient>`;
// Rupee mark: two bars + sloped leg, drawn as paths so no font is needed.
const MARK = (c = '#fff') => `
  <g fill="none" stroke="${c}" stroke-width="64" stroke-linecap="round" stroke-linejoin="round">
    <path d="M300 330 H724"/><path d="M300 470 H724"/>
    <path d="M330 330 H450 C610 330 620 560 450 560 H330 L650 800"/>
  </g>`;
const svg = (inner, w = 1024, h = 1024, vb = '0 0 1024 1024') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}"><defs>${GRAD}</defs>${inner}</svg>`;

const items = [
  ['resources/icon-only.png', 1024, 1024, svg(`<rect width="1024" height="1024" fill="url(#g)"/>${MARK()}`), false],
  ['resources/icon-background.png', 1024, 1024, svg(`<rect width="1024" height="1024" fill="url(#g)"/>`), false],
  // foreground: mark scaled into the adaptive-icon safe zone (centre ~60%)
  ['resources/icon-foreground.png', 1024, 1024, svg(`<g transform="translate(512 512) scale(0.78) translate(-512 -512)">${MARK()}</g>`), true],
  ['public/icon-512.png', 512, 512, svg(`<rect width="1024" height="1024" fill="url(#g)"/>${MARK()}`, 512, 512), false],
  ['public/icon-192.png', 192, 192, svg(`<rect width="1024" height="1024" fill="url(#g)"/>${MARK()}`, 192, 192), false],
];
const splash = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><defs>${GRAD}</defs>
  <rect width="2732" height="2732" fill="${bg}"/>
  <g transform="translate(1366 1180)"><rect x="-240" y="-240" width="480" height="480" rx="140" fill="url(#g)"/>
    <g transform="translate(-240 -240) scale(0.46875)">${MARK()}</g></g>
  <text x="1366" y="1660" text-anchor="middle" font-family="Inter, Roboto, 'Segoe UI', 'DejaVu Sans', sans-serif" font-weight="800" font-size="118" fill="#f2f3f8">Rupee Routine</text>
  <text x="1366" y="1780" text-anchor="middle" font-family="Inter, Roboto, 'Segoe UI', 'DejaVu Sans', sans-serif" font-weight="600" font-size="64" fill="#a396ff">Money Made Simple</text></svg>`;
items.push(['resources/splash.png', 2732, 2732, splash('#0a0a0f'), false]);
items.push(['resources/splash-dark.png', 2732, 2732, splash('#0a0a0f'), false]);

const browser = await chromium.launch();
for (const [file, w, h, markup, transparent] of items) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await page.screenshot({ path: file, omitBackground: transparent });
  await page.close();
  console.log('wrote', file);
}
await browser.close();
