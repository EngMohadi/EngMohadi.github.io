# Mohammad Abdelhadi — Remote GIS Portfolio (Business V2)

Premium, conversion-focused, English-only portfolio website for a Remote GIS Consultant / Geomatics Engineer. Built as a static site (no build step) with a dark geospatial theme, targeting remote work, freelance contracts, consulting, and international GIS / Web GIS projects.

Content source of truth: `Mohammad_Abdelhadi_GIS_Remote_Work_Portfolio_EN.docx` (all copy, metrics, case studies, and gallery images were extracted from it).

## Structure

| File / folder | Purpose |
|---|---|
| `index.html` | Single-page portfolio: hero, remote value, service packages, UAV processing service, case studies, proof metrics, gallery, process, why-hire-me, project inquiry form |
| `styles.css` | Premium dark theme (CSS variables, glassmorphism cards, grid overlay, responsive, RTL support) |
| `app.js` | Rendering engine, EN/AR language switch, gallery filters, lightbox, inquiry form logic, obfuscated contact actions |
| `locales/en.js`, `locales/ar.js` | All visible site text per language — edit these to change content |
| `.env.example` | Placeholder env vars for a future backend that would truly hide contact details |
| `assets/images/work/` | 36 web-optimized project images extracted from the Word portfolio |
| `assets/downloads/` | Downloadable portfolio DOCX (replace with a PDF for smaller size if desired) |
| `demo.html`, `demo.js`, `demo.css` | Sample-data live dashboard demo (legacy styling) |
| `profile.html` | Printable professional profile (legacy styling) |
| `case-studies/` | Legacy standalone case-study pages (superseded by in-page case studies; kept for old links) |
| `legacy.css` | Old stylesheet kept only for the legacy sub-pages above |

## Editing content and translations

All visible text lives in `locales/en.js` (English) and `locales/ar.js` (Arabic). Each file is one object with the same structure (`hero`, `valueCards`, `services`, `uav`, `caseStudies`, `proofMetrics`, `galleryCaptions`, `processSteps`, `whyItems`, `contact.form`, …). Edit the matching key in both files — no HTML changes needed. The language toggle in the header switches EN (LTR) / AR (RTL) and remembers the choice in localStorage; English is the default.

## Contact privacy

- The phone number and email are never displayed in the UI and are not stored as plain text in the code; they are base64-encoded (reversed) in `app.js` and decoded only when a visitor clicks a contact button.
- This defeats casual scraping, but true hiding requires a backend or serverless function — see `.env.example` for the variables such a backend would use.
- To enable the "Send via Telegram" button, set your public Telegram username in `CONTACT.telegramUser` inside `app.js`; it stays hidden while empty.
- The inquiry form validates input, then opens WhatsApp / Telegram / the visitor's email app with the composed message. Nothing is stored on the site.

## Run locally

Any static server works, e.g.:

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

## Deploy (GitHub Pages)

```bash
git init && git add . && git commit -m "Premium remote GIS portfolio"
git remote add origin <your-repo-url>
git push -u origin main
```

Then enable GitHub Pages (Settings → Pages → deploy from `main` branch, root folder). Update `canonical`, `og:url`, and `sitemap.xml` URLs if the site is served from a different domain.

## Privacy and data safety

- Email and WhatsApp links are assembled at runtime from separated parts (reduces casual scraping only — a static site cannot fully hide contact details).
- The contact form opens the visitor's email app; nothing is stored on the site.
- Do not commit raw GIS data (`.shp`, `.geojson`, `.gpkg`, `.tif`, …) — already blocked by `.gitignore`.
- Before publishing new screenshots, review them for EXIF/GPS metadata, exact coordinates, personal information, and restricted infrastructure details.
- Gallery carries the note: "For confidentiality reasons, some visuals may use masked or sample data."

## Licensing

Code may be licensed under MIT only if the owner explicitly agrees. Images, maps, GIS outputs, dashboard screenshots, and municipal documentation are All Rights Reserved.
