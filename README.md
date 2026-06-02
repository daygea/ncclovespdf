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

## About the certificate number & verification
Each certificate gets a unique code (e.g. `NCC/PROC/CERT/ 29022C`) and a **QR
code** that links to the in-app verification page. Anyone can confirm a
certificate is genuine by scanning the QR, or by typing the code under the
"Verify a number" tab.

There are two modes:

**Local only (default).** With no backend configured, issued certificates are
saved to the browser's local storage. Uniqueness and verification are guaranteed
*on that device* — good for a single workstation, fully offline, no server.

**Shared registry (recommended for org-wide use).** Set `REGISTRY.url` near the
top of `js/app.js` to a Google Apps Script Web App URL and every issued
certificate is written to a shared Google Sheet. Numbers can then never collide
between machines, and any officer (or contractor) can verify any certificate
from any device via the QR or the code. The backend stores **only certificate
metadata** — number, contractor, amount, dates — never the documents, so the
"files never leave your device" promise is unaffected.

Set up the shared registry with the ready-made script in `server/Code.gs`
(step-by-step instructions are in the file's header — about 5 minutes). If the
backend is ever unreachable, issuing falls back to local storage automatically
and tells you so.

> The QR is drawn locally by a small library (`qrcode-generator`) loaded from a
> CDN; it only encodes the verification link, and no data is sent anywhere. If
> that script is blocked/offline, the certificate still issues fine — just
> without the QR image — and verification by typed code still works.

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
