# Data Primer Explorer

This repository is a self-contained static copy of the Data Primer Explorer. It can be served from a GitHub Pages project URL such as `https://USERNAME.github.io/REPOSITORY/` without changing asset paths.

## Project structure

- `index.html` — page structure and content
- `styles.css` — website styling and responsive layout
- `app.js` — dataset loading, full-metadata search, Theme filtering, cards, and detail dialog
- `translation.js` and `translation.css` — Google Translate integration and translation-control styling
- `data/datasets.json` — dataset file loaded by the website
- `data/Data Primer_10_3_2026.csv` — source inventory used for the current 142-record export
- `thumbnails/` — all local dataset thumbnails and fallback images
- `scripts/update_dataset.py` — optional helper for rebuilding `datasets.json` from a future CSV
- `.nojekyll` — tells GitHub Pages to serve the files directly

The website does not load data, images, JavaScript, or CSS from the former ChatGPT-hosted deployment. Google Translate remains an external service because the existing translation feature uses Google's whole-page translation widget and translation API.

## Update the dataset

The website reads `data/datasets.json`. To rebuild it from a new CSV while preserving existing thumbnail assignments:

```bash
python scripts/update_dataset.py path/to/updated-data-primer.csv
```

The CSV should retain the current column names. The helper represents every CSV row, preserves the `Contributor` field in the underlying JSON for metadata search, and keeps Contributor hidden from cards and detail views. Review the generated `data/datasets.json` before publishing.

If you edit `datasets.json` directly, keep each record's current field names. Search automatically covers every value in each record, including its full description and metadata.

## Add or replace thumbnails

1. Copy the image into `thumbnails/` without editing the source image.
2. In `data/datasets.json`, set that dataset's `thumbnail` value to a relative path such as `thumbnails/WorldClim_2_1.png`.
3. Keep the existing filename capitalization and extension exactly.

The card layout uses `object-fit: contain`, so the complete image remains visible without cropping or distortion.

## Test locally

Browsers block `fetch()` for local `file://` pages, so serve the repository with a small local web server from the repository root:

```bash
python -m http.server 8000
```

Open <http://localhost:8000/>. Verify search, Theme filtering, dataset-title detail dialogs, thumbnail links, and translation. Internet access is required for Google Translate and for external dataset links.

To test GitHub Pages subdirectory behavior locally, serve the directory that contains this repository folder and open the repository folder in the URL.

## Deploy with GitHub Pages

1. Create a GitHub repository.
2. Upload all files and folders from this project, including `.nojekyll`, to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch containing the files (usually `main`) and the `/(root)` folder, then save.
6. GitHub will provide a URL such as `https://USERNAME.github.io/REPOSITORY/`.

All internal runtime paths are relative, so the site works from a repository subdirectory. Dataset and thumbnail destination links remain the external URLs supplied in the Data Primer inventory.
