/**
 * welovepdf — shared certificate registry backend (Google Apps Script)
 * Stores ONLY certificate metadata. No documents are uploaded or stored here.
 * Verification (doGet) is open to everyone; registering (doPost) requires the password.
 * See the header of Import.gs for a one-time historical import.
 */
var SHEET_NAME = 'certs';
var HEADERS = ['code','certNo','contractor','address','projectTitle',
               'issueDate','awardDate','deliveryDate','amount','amountWords','createdAt'];

/* Password that authorises registering a certificate. Set this to the SAME
   password used in the app (js/app.js GATE). Change it before real use. */
var PASSWORD = 'NCC-PAC-2026';

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function findRow_(sh, code) {
  code = String(code || '').toUpperCase().trim();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) if (String(values[i][0]).toUpperCase().trim() === code) return values[i];
  return null;
}
function rowToRecord_(row) { var rec = {}; for (var i = 0; i < HEADERS.length; i++) rec[HEADERS[i]] = row[i]; return rec; }

/* GET ?code=XXXX  -> verify (open to all) */
function doGet(e) {
  var code = e && e.parameter ? e.parameter.code : '';
  if (!code) return json_({ found: false });
  var row = findRow_(sheet_(), code);
  return row ? json_({ found: true, record: rowToRecord_(row) }) : json_({ found: false });
}

/* POST {action:'save', record:{...}, password:'...'}  -> register (password required) */
function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad request' }); }
  if (String(data.password || '') !== PASSWORD) return json_({ ok: false, error: 'unauthorized' });
  if (data.action !== 'save' || !data.record) return json_({ ok: false, error: 'bad action' });
  var rec = data.record, code = String(rec.code || '').toUpperCase().trim();
  if (!code) return json_({ ok: false, error: 'missing code' });

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_();
    if (findRow_(sh, code)) return json_({ ok: false, duplicate: true });
    sh.appendRow(HEADERS.map(function (h) { return rec[h] != null ? rec[h] : ''; }));
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
