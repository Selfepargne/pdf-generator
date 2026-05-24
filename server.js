const express   = require('express');
const cors      = require('cors');
const puppeteer = require('puppeteer');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-generator', version: '1.0.0' });
});

app.post('/generate-pdf', async (req, res) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Paramètre html manquant.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 1500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    await browser.close();

    const pdfFilename = filename || 'bilan-retraite.pdf';
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename}"`,
      'Content-Length':      pdfBuffer.length
    });

    res.end(pdfBuffer);

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('[pdf-generator] Erreur Puppeteer :', err.message);
    res.status(500).json({ error: 'Erreur lors de la génération PDF.', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[pdf-generator] Serveur démarré sur le port ${PORT}`);
});
