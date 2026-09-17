const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rules = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n').filter(x => x.startsWith('/') && !x.startsWith('/*') && !x.includes('*')).map(x => x.trim().split(/\s+/));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.pdf':'application/pdf','.webmanifest':'application/manifest+json','.xml':'application/xml','.txt':'text/plain'};
function createServer() {
 return http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405, {'Content-Type':'text/plain', Allow:'GET, HEAD'});res.end('Method not allowed.');return;}
  let url; try {url = new URL(req.url,'http://localhost');} catch {res.writeHead(400);res.end();return;}
  let requested; try {requested=decodeURIComponent(url.pathname);} catch {res.writeHead(400);res.end();return;}
  let target=requested, status=200;
  const rule=rules.find(r=>r[0]===requested);
  if (rule) {if (rule[2].startsWith('301')) {res.writeHead(301,{Location:rule[1]+url.search});res.end();return;} target=rule[1];}
  if (target==='/') target='/index.html';
  // Serve only public site files, never repository metadata or installed dependencies.
  if (!(target.startsWith('/assets/') || /^\/[a-z0-9-]+\.(html|png|ico|svg|xml|txt)$/.test(target)) || target.split('/').some(x=>x.startsWith('.'))) target='/404.html',status=404;
  let file=path.resolve(root,'.'+target);
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) file=path.join(root,'404.html'),status=404;
  res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end(); else fs.createReadStream(file).pipe(res);
 });
}
if(require.main===module) {const port=Number(process.env.PORT || 4174);createServer().listen(port,'127.0.0.1',()=>console.log(`Sorellon preview: http://127.0.0.1:${port} (clean URLs supported)`));}
module.exports={createServer};
