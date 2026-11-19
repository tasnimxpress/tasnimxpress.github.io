# tasnimxpress.github.io

Portfolio of **Tasnim (Tasnima Aktar)**, Analytics Engineer · Data Analyst. Live at https://tasnimxpress.github.io/

A plain static site (HTML, CSS, vanilla JavaScript, no build step, no chart libraries), hosted on GitHub Pages.

## Files

- `index.html`: page content
- `style.css`: all styles; dark theme tokens and the `--gap` section spacing live in `:root`
- `app.js`: every chart and diagram, drawn as SVG (how-I-work stages, Sankey, roadmap, timeline, sales chart, automation flow)
- `img/`: favicon set and project screenshots
- `Uploads/Product-Analysis.html`: notebook export linked from Selected work
- `Tasnima_Aktar_CV.pdf`: downloadable CV

## Common edits

- **Add a certificate:** append to `CREDENTIALS` in `app.js`; the roadmap re-flows (3 per row).
- **Edit a job:** change `JOBS` in `app.js`.
- **Edit off-the-clock activities:** change `groups` / `sub` inside `drawLife()` in `app.js`.
- After editing `app.js` or `style.css`, bump the `?v=` number on its `<script>` / `<link>` tag in `index.html` so browsers fetch the new file.

## Preview and deploy

```
python -m http.server 8080      # then open http://localhost:8080
git add -A && git commit -m "..." && git push    # GitHub Pages redeploys in about a minute
```
