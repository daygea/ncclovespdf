/**
 * ONE-TIME IMPORT of historical job-completion certificates into the shared
 * registry (the same Google Sheet used by Code.gs). Safe to re-run — records
 * whose code already exists are skipped.
 *
 * HOW TO USE
 *  1. Open the SAME Apps Script project that holds Code.gs.
 *  2. Click  +  ▸ Script,  name it  Import,  and paste this whole file.
 *  3. Paste your exported JSON between the  <<<PASTE  and  PASTE>>>  markers
 *     below (you can paste the ENTIRE phpMyAdmin export — it finds the table).
 *  4. Save, choose  importOldRecords  in the function dropdown, click  Run.
 *  5. View ▸ Logs (or Executions) shows how many were added / skipped.
 *
 * It uses sheet_() and HEADERS from Code.gs, so keep both files in the project.
 */

var EXPORT =
/* <<<PASTE your JSON below (replace the null), keep the surrounding brackets */
null
/* PASTE>>> */ ;

/* ---------- field mapping ---------- */
function importOldRecords(){
  var rows = tableData_(EXPORT);
  if (!rows.length){ Logger.log('No records found — did you paste the export into EXPORT?'); return; }

  var sh = sheet_();                     // from Code.gs
  var existing = {};
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) existing[String(vals[i][0]).toUpperCase().trim()] = true;

  var newRows = [], added = 0, skipped = 0;
  for (var r = 0; r < rows.length; r++){
    var o = rows[r];
    var code = String(o.reference || '').toUpperCase().trim();
    if (!code || existing[code]) { skipped++; continue; }
    existing[code] = true;

    var amt = parseAmount_(o.amount);
    var name = String(o.company_name || '').trim();
    var contractor = name ? (/^messrs/i.test(name) ? name.toUpperCase() : 'MESSRS ' + name.toUpperCase()) : '';

    var rec = {
      code: code,
      certNo: 'NCC/PROC/CERT/ ' + code,
      contractor: contractor,
      address: String(o.company_address || '').replace(/\s*\r?\n\s*/g, ', ').replace(/,\s*,/g, ',').replace(/\s{2,}/g,' ').replace(/^[,\s]+|[,\s]+$/g,'').trim(),
      projectTitle: String(o.project_title || '').replace(/\s{2,}/g,' ').toUpperCase().trim(),
      issueDate: formatDateLong_(o.issue_date),
      awardDate: formatDateLong_(o.award_date),
      deliveryDate: formatDateLong_(o.completion_date),
      amount: amt ? formatNaira_(amt.num) : '',
      amountWords: amt ? amountInWords_(amt.naira, amt.kobo) : '',
      createdAt: o.created_at || new Date().toISOString()
    };
    newRows.push(HEADERS.map(function(h){ return rec[h] != null ? rec[h] : ''; }));
    added++;
  }

  if (newRows.length){
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try { sh.getRange(sh.getLastRow() + 1, 1, newRows.length, HEADERS.length).setValues(newRows); }
    finally { lock.releaseLock(); }
  }
  Logger.log('Import complete. Added ' + added + ', skipped ' + skipped + ' (already present or no reference).');
}

/* Accepts the full phpMyAdmin export, a single {type:table} object, or a bare data array */
function tableData_(exp){
  if (!exp) return [];
  if (Array.isArray(exp)){
    for (var i = 0; i < exp.length; i++) if (exp[i] && exp[i].type === 'table' && exp[i].data) return exp[i].data;
    if (exp.length && exp[0] && exp[0].reference) return exp;   // bare data array
  } else if (exp.data){ return exp.data; }
  return [];
}

/* ---------- formatting helpers (match the app exactly) ---------- */
var _ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
var _TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function _two_(n){ if (n < 20) return _ONES[n]; var t = Math.floor(n/10), o = n%10; return _TENS[t] + (o ? ' ' + _ONES[o] : ''); }
function _three_(n){ var h = Math.floor(n/100), r = n%100, s = ''; if (h) s += _ONES[h] + ' Hundred'; if (r){ if (h) s += ' and '; s += _two_(r); } return s; }
function toWords_(num){
  num = Math.floor(num); if (num === 0) return 'Zero';
  var sc = ['','Thousand','Million','Billion','Trillion'], g = [], i = 0;
  while (num > 0){ var x = num % 1000; if (x) g.unshift(_three_(x) + (sc[i] ? ' ' + sc[i] : '')); num = Math.floor(num/1000); i++; }
  return g.join(', ');
}
function amountInWords_(naira, kobo){ var w = toWords_(naira) + ' Naira'; if (kobo > 0) w += ', ' + toWords_(kobo) + ' Kobo'; else w += ' Only'; return w; }
function parseAmount_(v){ var num = parseFloat(String(v).replace(/[^0-9.]/g,'')); if (isNaN(num)) return null; var naira = Math.floor(num + 1e-9); var kobo = Math.round((num - naira) * 100); return { num:num, naira:naira, kobo:kobo }; }
function formatNaira_(num){ var s = Number(num).toFixed(2).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return 'N' + s[0] + '.' + s[1]; }
var _DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var _MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function _ord_(d){ var v = d % 100, s = ['th','st','nd','rd']; return d + (s[(v-20)%10] || s[v] || s[0]); }
function formatDateLong_(ymd){
  if (!ymd) return '';
  var p = String(ymd).split(' ')[0].split('-'); if (p.length < 3) return '';
  var dt = new Date(+p[0], +p[1]-1, +p[2]); if (isNaN(dt.getTime())) return '';
  return _DAYS[dt.getDay()] + ' ' + _ord_(dt.getDate()) + ' of ' + _MONTHS[dt.getMonth()] + ' ' + dt.getFullYear();
}
