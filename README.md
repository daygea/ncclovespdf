# welovespdf

Every tool you need to work with PDFs — running **100% in your browser**.

This app was created so that third-party platforms are not used for manipulating
PDF documents, thereby keeping official/confidential documents off their servers.
Files are read and processed locally with WebAssembly (pdf-lib + pdf.js). Nothing
is ever uploaded.

App created by **Adedeji Kadri**.

## Tools included (all working, all client-side)
- **Job Completion Certificate** – fill a form, issue an official "Certificate of
  Final Completion" as **PDF and Word**, matching the approved NCC template
  (laid out for printing on letter-headed paper), with a unique searchable
  certificate number, automatic amount-in-words, and on-device verification.
- **Merge PDF** – combine files, reorder pages, optional CONFIDENTIAL watermark
- **Split PDF** – extract a page range, split into individual pages, or every N pages
- **Organize PDF** – reorder / rotate / delete pages then export
- **Rotate PDF** – rotate all or individual pages
- **Remove pages** – select pages to delete
- **Compress PDF** – re-render pages as optimised images (great for scans)
- **Page numbers** – position, format and start number
- **Watermark** – text, opacity, size, angle and colour
- **PDF to JPG** – export each page as a JPG
- **JPG to PDF** – combine images into one PDF

On the roadmap (need more than the browser alone does well): PDF→Word, OCR.

## About the certificate number
Each certificate gets a unique code (e.g. `NCC/PROC/CERT/ 29022C`). Issued
certificates are saved to this browser's local storage so the number can be
**verified later** under the "Verify a number" tab — fully offline, no server.

Because storage is per-browser, uniqueness and lookup are guaranteed *on that
device*. For a registry shared across the whole organisation (so any officer can
verify any certificate, and numbers can never collide between machines), point
the `saveRegistry` / `loadRegistry` functions in `js/app.js` at a small backend
— a free Google Apps Script + Sheet, Supabase, or Firebase all work and keep the
rest of the app unchanged.

## Run it
It's a static site — no build step. Open `index.html`, or host it free on
GitHub Pages / Netlify / Cloudflare Pages.

```
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Structure
```
index.html        # SPA shell (header, footer, mount point)
css/styles.css    # design system
js/app.js         # router + landing page + all tools
js/pdf-lib.min.js # create/modify PDFs (local)
js/pdf.min.js     # render PDFs to thumbnails/images (local)
js/Sortable.min.js# drag-to-reorder (local)
img/logo.png
```

> Note: `js/app.js` points pdf.js's *worker* file at a CDN (it's a script, not
> your documents). For a fully air-gapped deploy, download
> `pdf.worker.min.js` (v2.16.105) into `js/` and update `workerSrc` at the top
> of `app.js`.
