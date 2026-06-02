/**
 * ncclovespdf — shared certificate registry backend (Google Apps Script)
 *
 * Stores ONLY certificate metadata (number, contractor, amount, dates).
 * No documents are ever uploaded or stored here.
 *
 * SETUP (about 5 minutes):
 *  1. Create a Google Sheet. Note its tab can stay "Sheet1" (we make our own).
 *  2. Extensions ▸ Apps Script. Delete any code, paste this file, Save.
 *  3. Deploy ▸ New deployment ▸ type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Deploy, authorise, and COPY the Web app URL (ends with /exec).
 *  4. In js/app.js set:  REGISTRY.url = 'PASTE_THE_/exec_URL_HERE';
 *  5. Commit & push. Done — issuing now writes to the sheet and the QR
 *     "Scan to verify" works from any device.
 */

var SHEET_NAME = 'certs';
var HEADERS = ['code','certNo','contractor','address','projectTitle',
               'issueDate','awardDate','deliveryDate','amount','amountWords','createdAt'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
function findRow_(sh, code) {
  code = String(code || '').toUpperCase().trim();
  var values = sh.getDataRange().getValues(); // includes header row
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase().trim() === code) return values[i];
  }
  return null;
}
function rowToRecord_(row) {
  var rec = {};
  for (var i = 0; i < HEADERS.length; i++) rec[HEADERS[i]] = row[i];
  return rec;
}

/* GET ?code=XXXX  -> verify a certificate */
function doGet(e) {
  var code = e && e.parameter ? e.parameter.code : '';
  if (!code) return json_({ found: false });
  var sh = sheet_();
  var row = findRow_(sh, code);
  if (!row) return json_({ found: false });
  return json_({ found: true, record: rowToRecord_(row) });
}

/* POST {action:'save', record:{...}}  -> register a new certificate */
function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'bad request' }); }

  if (data.action !== 'save' || !data.record) return json_({ ok: false, error: 'bad action' });
  var rec = data.record;
  var code = String(rec.code || '').toUpperCase().trim();
  if (!code) return json_({ ok: false, error: 'missing code' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // serialise writes so two officers can't grab the same number
  try {
    var sh = sheet_();
    if (findRow_(sh, code)) return json_({ ok: false, duplicate: true });
    sh.appendRow(HEADERS.map(function (h) { return rec[h] != null ? rec[h] : ''; }));
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
