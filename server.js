const express    = require('express');
const puppeteer  = require('puppeteer');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS — autorise les appels depuis GitHub Pages et Netlify ──
app.use(cors({
  origin: [
    'https://selfepargne.github.io',
    'https://simulateur-selfepargne.netlify.app',
    /\.github\.io$/,
    /\.netlify\.app$/,
    'http://localhost',
    'http://127.0.0.1'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '5mb' }));

// ── Healthcheck — pour Render ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-generator', version: '1.0.0' });
});

// ══════════════════════════════════════════════════════════════
// POST /generate-pdf
// Body : { html: '<html>...</html>', filename: 'bilan.pdf' }
// ══════════════════════════════════════════════════════════════
app.post('/generate-pdf', async (req, res) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Paramètre html manquant.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();

    // ── Charger le HTML complet avec toutes les ressources ──
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    // ── Attendre que les polices Google Fonts soient chargées ──
    await page.evaluateHandle('document.fonts.ready');

    // ── Attendre un délai supplémentaire pour SVG / graphiques ──
    await new Promise(r => setTimeout(r, 1500));

    // ── Générer le PDF en A4 ──
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    await browser.close();

    // ── Renvoyer le PDF en téléchargement ──
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
