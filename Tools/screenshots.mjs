// Renders the web build in headless Chrome and saves docs/screenshots/*.png (phone size, 2x).
// Usage: node Tools/screenshots.mjs   (needs Google Chrome; set CHROME=/path/to/chrome elsewhere)
// The "saved" shot uses a made-up spot seeded into localStorage, never a real location.
import { execSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'docs/screenshots');
const web = mkdtempSync(join(tmpdir(), 'wmc-web-'));
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

execSync(`npx expo export --platform web --output-dir ${web}`, { cwd: root, stdio: 'inherit' });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  let f = join(web, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(f) || f.endsWith('/')) f = join(web, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' }).end(readFileSync(f));
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'wmc-chrome-'))}`, 'about:blank']);
const wsUrl = await new Promise((ok) => browser.stderr.on('data', (d) => { const m = /ws:\/\/\S+/.exec(d); if (m) ok(m[0]); }));
const port = new URL(wsUrl).port;
const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener('open', ok));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m.result); });
const send = (method, params = {}) => new Promise((ok) => { pending.set(++id, ok); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

async function shot(name, { dark = false, spot = null } = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
  await send('Page.navigate', { url });
  await sleep(1500);
  await evaluate(spot ? `localStorage.setItem('parking-spot', ${JSON.stringify(JSON.stringify(spot))})` : `localStorage.clear()`);
  await send('Page.reload');
  for (let i = 0; i < 50 && !(await evaluate(`document.body.innerText.includes('${spot ? 'Take me' : 'Save my'}')`)); i++) await sleep(200);
  await sleep(500);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, `${name}.png`), Buffer.from(data, 'base64'));
  console.log('saved', name);
}

mkdirSync(out, { recursive: true });
const spot = { lat: 40.7484, lng: -73.9857, savedAt: Date.now() - 47 * 60000, note: 'Level 3, spot B42' };
await shot('empty');
await shot('saved', { spot });
await shot('empty-dark', { dark: true });
await shot('saved-dark', { dark: true, spot });
ws.close();
browser.kill();
server.close();
