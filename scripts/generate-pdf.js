const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { createServer } = require('./preview');
(async () => {
 const server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await puppeteer.launch();
  const page=await browser.newPage();
  const route=process.env.CAP_PAGE || '/capability-statement';
  const response=await page.goto(`http://127.0.0.1:${server.address().port}${route}`,{waitUntil:'networkidle0'});
  if(!response.ok()) throw new Error('Document page failed to load');
  await page.emulateMediaType('print');
  const output=process.env.OUT_PDF || 'assets/policies/Sorellon-Capability-Statement.pdf';
  fs.mkdirSync(path.dirname(output),{recursive:true});
  await page.pdf({path:output,format:'A4',preferCSSPageSize:true,printBackground:true,tagged:true});
  console.log(`PDF written: ${output}`);
 } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
