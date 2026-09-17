/* Lightweight pre-deploy checks for the static site. No network calls are made. */
const fs = require('fs');
const path = require('path');

const pages = fs.readdirSync('.').filter((name) => name.endsWith('.html')).sort();
const routes = new Set([
  '/', '/careers', '/404.html', '/public-sector', '/sectors', '/capabilities', '/about', '/contact',
  '/capability-statement', '/carbon-reduction', '/environmental-policy', '/equality-and-diversity',
  '/health-and-safety', '/modern-slavery', '/privacy', '/terms', '/why', '/china-sourcing',
  '/rfq', '/rfq/', '/request-a-quote', '/request-a-quote/',
  '/capability-statement.pdf', '/privacy.pdf', '/terms.pdf'
]);
const errors = [];
const localTarget = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return true;
  if (clean.startsWith('/assets/')) return fs.existsSync(clean.slice(1));
  if (routes.has(clean)) return true;
  if (clean.endsWith('.html')) return fs.existsSync(clean.slice(1));
  if (clean.startsWith('/') && fs.existsSync(clean.slice(1))) return true;
  return false;
};

for (const file of pages) {
  const source = fs.readFileSync(file, 'utf8');
  const requiredChecks = [
    /<title>[^<]+<\/title>/i,
    /<meta[^>]+name=["']description["']/i,
    /<main[^>]+id=["']main-content["']/i,
    /class=["']skip-link["']/i
  ];
  if (file !== '404.html') requiredChecks.push(/<link[^>]+rel=["']canonical["']/i);
  for (const required of requiredChecks) {
    if (!required.test(source)) errors.push(`${file}: missing ${required}`);
  }
  for (const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const target = match[1];
    if (target.startsWith('/') && !target.startsWith('//') && !localTarget(target)) errors.push(`${file}: missing local target ${target}`);
  }
  for (const image of source.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(image[0])) errors.push(`${file}: image is missing alt text`);
  }
  const ids = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${file}: duplicate id(s) ${[...new Set(duplicateIds)].join(', ')}`);
  if (/<form\b|data-netlify|netlify-honeypot|href=["']tel:|@gmail\.com/i.test(source)) errors.push(`${file}: obsolete public contact or sales content`);
  for (const match of source.matchAll(/href=["'](mailto:[^"']+)["']/gi)) {
    if (match[1].split('?')[0] !== 'mailto:sales@sorellon.com') errors.push(`${file}: unexpected email link ${match[1]}`);
  }
  for (const match of source.matchAll(/href=["']#([^"']+)["']/gi)) {
    if (!ids.includes(match[1])) errors.push(`${file}: missing fragment ${match[1]}`);
  }
  if (file === 'contact.html' && !source.includes('mailto:sales@sorellon.com')) errors.push('Contact email is missing');
}

const redirects = fs.readFileSync('_redirects', 'utf8').split('\n').map(line => line.trim().split(/\s+/));
for (const route of ['/rfq', '/rfq/', '/rfq.html', '/request-a-quote', '/request-a-quote/', '/request-a-quote.html']) {
  if (!redirects.some(rule => rule[0] === route && rule[1] === '/contact' && /^301!?$/.test(rule[2]))) errors.push(`Missing legacy contact redirect: ${route}`);
}
for (const [from, to, status] of redirects) {
  if (status === '200' && !to.includes('*') && !to.includes(':') && !fs.existsSync(path.join('.', to))) errors.push(`Missing rewrite target: ${from} -> ${to}`);
}

if (errors.length) {
  console.error(`Site checks failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Site checks passed: ${pages.length} HTML pages, local links, email contact and legacy redirects verified.`);
