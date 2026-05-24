# pdf-generator

Backend Node.js + Puppeteer pour la génération PDF du simulateur retraite.

## Stack
- **Express** — serveur HTTP
- **Puppeteer** — rendu Chrome headless → PDF A4
- **Render** — hébergement

## Endpoint

### `POST /generate-pdf`

**Body JSON :**
```json
{
  "html": "<html>...</html>",
  "filename": "bilan-retraite-dupont.pdf"
}
```

**Réponse :** fichier PDF en téléchargement direct.

## Déploiement sur Render

1. Connecter ce repo à Render (Web Service)
2. **Build command :** `npm install`
3. **Start command :** `npm start`
4. **Node version :** 18+

## Développement local

```bash
npm install
node server.js
```

Serveur disponible sur `http://localhost:3000`.
