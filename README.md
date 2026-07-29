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

## Locking the certificate generator
Generating certificates is password-protected; **verifying** a certificate is
open to everyone (no password). The default password is **`NCC-PAC-2026`** —
change it before real use.

To set your own password:
1. Open the deployed site, press F12 for the console, and run
   `ncclovespdfHash('your new password')` — copy the printed hash.
2. Paste it into `GATE.passHash` near the top of `js/app.js`.
3. If you use the shared registry, set the **same** password in
   `server/Code.gs` (the `PASSWORD` variable) and re-deploy the Web App.

Two layers protect it:
- **The app gate** hides the generator behind the password. Because this is a
  static site, this is a *deterrent* — it keeps unauthorised staff out, but a
  technical user could bypass client-side code. Only the *hash* of the password
  is in the source, never the plaintext.
- **The backend check** is the real protection: the Apps Script refuses to
  register a certificate without the correct password, so even a UI bypass can't
  write to the shared registry. Use a strong password so the hash can't be
  guessed. Set `GATE.passHash` to `''` to remove the gate entirely.

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

## Install as an app (PWA) & offline use
The site is a Progressive Web App. On a phone or desktop Chrome/Edge you'll get
an "Install" prompt (or use the browser menu ▸ Install). Once installed it opens
in its own window and the app shell is cached, so the interface and the
pdf-lib–based tools work with no connection.

Full offline caveat: PDF *rendering* (page thumbnails, Edit, Crop previews) uses
the pdf.js **worker**, which is still loaded from a CDN. For 100% offline, download
`pdf.worker.min.js` (v2.16.105) into `js/`, change the `workerSrc` line at the top
of `js/app.js` to `js/pdf.worker.min.js`, and add that path to the `SHELL` list in
`sw.js`. The QR generator is also CDN-loaded (certificates still issue offline,
just without the QR image).

When you change app files, bump the `CACHE` name in `sw.js` (e.g. `welovepdf-v2`)
and the `?v=` tags in `index.html` so clients pick up the new version.

## New in this wave
- **Crop PDF** — drag a crop box on the page; the crop is applied to every page.
- **Fill Forms** — reads a PDF's interactive fields, fills them, and can flatten.

## Run it

## New in Wave 2
- **Sign PDF** — draw, type, or upload a signature; place, move and resize it on any page.
- **Scan to PDF** — capture pages with the device camera (or add photos), optional document mode, export a PDF. Camera needs HTTPS + permission; gallery upload always works.
- **OCR PDF** — read text from scanned pages with Tesseract.js (loaded from CDN on first use). Output editable Word, plain text, or a **searchable PDF** (an invisible, selectable text layer over the original image).
