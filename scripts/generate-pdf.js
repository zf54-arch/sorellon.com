// scripts/generate-pdf.js — non-blocking HTML→PDF export
const { spawn } = require("child_process");
const puppeteer = require("puppeteer");

const PORT = process.env.PDF_PORT || 4321;
const PUBLISH_DIR = process.env.PUBLISH_DIR || ".";              // where your .html files live
const PAGE_PATH   = process.env.CAP_PAGE || "/capability-statement.html";
const OUT_PATH    = process.env.OUT_PDF || "assets/policies/Sorellon-Capability-Statement.pdf";

(async () => {
  const server = spawn(process.platform === "win32" ? "npx.cmd" : "npx",
    ["http-server", PUBLISH_DIR, "-p", String(PORT), "-c-1", "--silent"],
    { stdio: "pipe" }
  );
  await new Promise(r => setTimeout(r, 1200));

  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.emulateMediaType("screen");
    await page.goto(`http://localhost:${PORT}${PAGE_PATH}`, { waitUntil: "networkidle0", timeout: 120000 });

    await page.addStyleTag({ content: `
      @page { size: A4; margin: 14mm 14mm 16mm 14mm; }
      .navbar .btn { display:none !important; }
      .hero-illustration { display:none !important; }
    `});

    await page.pdf({
      path: OUT_PATH,
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "14mm", bottom: "16mm", left: "14mm" }
    });

    await browser.close();
    console.log("✅ PDF written →", OUT_PATH);
  } catch (err) {
    console.warn("⚠️ PDF generation skipped:", err.message);
  } finally {
    server.kill();
  }
})();
