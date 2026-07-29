/* ============================================================
   welovepdf — application core
   Router + landing page + every PDF tool, 100% client-side.
   Libraries (pdf-lib, pdf.js, Sortable) are loaded locally;
   documents are NEVER uploaded anywhere.
   ============================================================ */


/* pdf.js worker (worker file only — your documents stay on-device) */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

/* ============================================================
   GENERATOR PASSWORD GATE  (declared first so it is always
   initialized before anything can reference it)
   Generating (and viewing the generator form) requires a password.
   Verifying a certificate is always open to everyone.

   passHash below is the SHA-256 of the password — the plaintext is
   NOT stored in the code. Default password is "NCC-PAC-2026".

   To set your OWN password: open this site, open the browser console
   (F12) and run:   ncclovespdfHash('your new password')
   then paste the printed hash into GATE.passHash and also set the
   same password in server/Code.gs (PASSWORD) if you use the shared
   registry. Set passHash to '' to remove the gate entirely.

   NOTE: a client-side check is a deterrent, not strong security —
   the real protection is the password check in the backend, which
   refuses to register a certificate without the correct password.
   ============================================================ */
var GATE = { passHash: '2fa9df2fe61de377c7396f534151d7b16e7e61f3b5398d04133e19a7d8333d49' };
var GATE_KEY='ncc_gen_ok';
async function sha256Hex(str){
  const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str)));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
window.ncclovespdfHash = async (pw)=>{ const h=await sha256Hex(pw); console.log('SHA-256:', h); return h; };
function gateRequired(){ return !!GATE.passHash; }
function gateUnlocked(){ return !gateRequired() || sessionStorage.getItem(GATE_KEY)==='1'; }
function gatePassword(){ return sessionStorage.getItem('ncc_gen_pw')||''; }
async function gateTry(pw){
  const h=await sha256Hex(pw);
  if(h===GATE.passHash){ try{ sessionStorage.setItem(GATE_KEY,'1'); sessionStorage.setItem('ncc_gen_pw',pw); }catch(e){} return true; }
  return false;
}
function gateLock(){ try{ sessionStorage.removeItem(GATE_KEY); sessionStorage.removeItem('ncc_gen_pw'); }catch(e){} }

/* ---------- tiny icon set (stroke, currentColor) ---------- */
const I = {
  merge:'<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6 6 6m-6-6v4a2 2 0 0 1-2 2H3m18 6v4a2 2 0 0 1-2 2h-4m6-6-6 6m6-6h-4a2 2 0 0 0-2 2v4"/>',
  split:'<path d="M12 3v18M5 8 3 12l2 4m14-8 2 4-2 4"/>',
  compress:'<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4m11-5v4a1 1 0 0 1-1 1h-4M9 9l3 3 3-3M9 15l3-3 3 3" stroke-linecap="round" stroke-linejoin="round"/>',
  organize:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  rotate:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
  remove:'<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/>',
  pagenumbers:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 17h3M14 17l1.5-3 1.5 3"/>',
  watermark:'<path d="M12 3s6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 6-10 6-10Z"/>',
  pdf2jpg:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  jpg2pdf:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6M9 17h6"/>',
  word:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="m8 13 1.5 4 1.5-3 1.5 3 1.5-4"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  certificate:'<path d="M5 3h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-6"/><path d="M8 7h8M8 10.5h6"/><circle cx="8" cy="17.5" r="3.2"/><path d="M5.7 19.8 4.5 23l3.5-1.4L11.5 23l-1.2-3.2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  doc:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  cursor:'<path d="m4 3 6.5 16 2.3-6.7L19.5 10 4 3Z"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  pen:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.5 7.5"/>'
};
const svg = (name, w=24) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I[name]||''}</svg>`;

/* ---------- tool registry ---------- */
const TOOLS = [
  {id:'word', cat:'blue', icon:'word', title:'PDF to Word', cats:['convert'],
   desc:'Extract the text from a PDF into an editable Word document.'},
  {id:'merge', cat:'red', icon:'merge', title:'Merge PDF', cats:['organize'],
   desc:'Combine PDFs in the order you want into one document.'},
  {id:'split', cat:'red', icon:'split', title:'Split PDF', cats:['organize'],
   desc:'Extract page ranges or break a PDF into separate files.'},
  {id:'organize', cat:'red', icon:'organize', title:'Organize PDF', cats:['organize'],
   desc:'Reorder, rotate and delete pages, then export your PDF.'},
  {id:'rotate', cat:'red', icon:'rotate', title:'Rotate PDF', cats:['organize'],
   desc:'Rotate pages the way you need — one, some, or all.'},
  {id:'remove', cat:'red', icon:'remove', title:'Remove pages', cats:['organize'],
   desc:'Delete the pages you don’t want and keep the rest.'},
  {id:'compress', cat:'green', icon:'compress', title:'Compress PDF', cats:['optimize'],
   desc:'Shrink file size — great for scanned and image-heavy PDFs.'},
  {id:'pagenumbers', cat:'amber', icon:'pagenumbers', title:'Page numbers', cats:['edit'],
   desc:'Add page numbers with your choice of position and style.'},
  {id:'watermark', cat:'purple', icon:'watermark', title:'Watermark', cats:['edit'],
   desc:'Stamp text over your PDF — opacity, angle and position.'},
  {id:'editpdf', cat:'purple', icon:'edit', title:'Edit PDF', cats:['edit'],
   desc:'Add text, images and freehand drawing on top of your PDF, then save.'},
  {id:'pdf2jpg', cat:'blue', icon:'pdf2jpg', title:'PDF to JPG', cats:['convert'],
   desc:'Turn each PDF page into a high-quality JPG image.'},
  {id:'jpg2pdf', cat:'blue', icon:'jpg2pdf', title:'JPG to PDF', cats:['convert'], images:true,
   desc:'Combine JPG or PNG images into a single PDF.'},
   {id:'certificate', cat:'slate', icon:'certificate', title:'Job Completion Certificate', cats:['create'], form:true,
 desc:'Fill a short form and issue an official Certificate of Final Completion as PDF and Word, with a unique searchable number.'},
];
const CATS = [['all','All tools'],['create','Create'],['organize','Organize'],['optimize','Optimize'],['edit','Edit'],['convert','Convert']];
const getTool = id => TOOLS.find(t=>t.id===id);

/* ---------- helpers ---------- */
const app = () => document.getElementById('app');
const fmtSize = b => b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB';
function loader(on,msg='Working…'){
  let el=document.getElementById('loaderOverlay');
  if(on){ if(!el){el=document.createElement('div');el.id='loaderOverlay';document.body.appendChild(el);}
    el.innerHTML=`<div class="loader-container"><div class="loader"></div><p>${msg}</p></div>`;}
  else if(el){el.remove();}
}

/* ---------- router ---------- */
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
function route(){
  const h=location.hash||'#/';
  window.scrollTo(0,0);
  const v=h.match(/^#\/verify\/(.+)$/);
  if(v){ renderCertificate(getTool('certificate'), decodeURIComponent(v[1])); return; }
  const m=h.match(/#\/tool\/([\w-]+)/);
  if(m && getTool(m[1])) renderTool(m[1]);
  else renderHome();
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function renderHome(){
  const cards = TOOLS.map(t=>`
    <button class="card c-${t.cat}" data-cats="${t.cats.join(' ')}" onclick="location.hash='#/tool/${t.id}'">
      ${t.soon?'<span class="tag soon">Soon</span>':''}
      <span class="ic">${svg(t.icon)}</span>
      <h3>${t.title}</h3><p>${t.desc}</p>
    </button>`).join('');

  app().innerHTML = `
  <section class="hero">
    <div class="wrap">
      <span class="eyebrow">🔒 100% in your browser</span>
      <h1>Every tool you need to work with <span class="swap">PDFs</span></h1>
      <p class="lead">Merge, split, compress, rotate, watermark and convert your documents — free, fast, and effortless. All the everyday PDF jobs in one place.</p>
      <span class="privacy-pill">${svg('shield',17)} Your files are processed on your device and never uploaded</span>
    </div>
  </section>

  <div class="wrap">
    <div class="filters" id="filters">
      ${CATS.map((c,i)=>`<button class="chip ${i===0?'active':''}" data-cat="${c[0]}">${c[1]}</button>`).join('')}
    </div>
    <div class="grid" id="grid">${cards}</div>
  </div>

  <section class="band">
    <div class="wrap">
      <h2>The PDF toolkit built for confidential documents</h2>
      <p class="sub">Most online PDF tools upload your files to their servers. welovepdf does everything inside your own browser — so your official documents stay yours.</p>
      <div class="three">
        <div class="feat"><div class="fic">${svg('shield',22)}</div><h4>Truly private</h4><p>Files are read and processed locally with WebAssembly. Nothing is sent to any server — close the tab and it’s gone.</p></div>
        <div class="feat"><div class="fic">${svg('bolt',22)}</div><h4>Instant &amp; free</h4><p>No upload, no queue, no account. Work runs at full local speed with no usage limits or hidden paywalls.</p></div>
        <div class="feat"><div class="fic">${svg('smile',22)}</div><h4>Genuinely simple</h4><p>Drag, drop, done. Every tool follows the same clean flow, on desktop or mobile.</p></div>
      </div>
    </div>
  </section>`;

  // category filtering
  document.querySelectorAll('#filters .chip').forEach(chip=>{
    chip.onclick=()=>{
      document.querySelectorAll('#filters .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      const cat=chip.dataset.cat;
      document.querySelectorAll('#grid .card').forEach(card=>{
        card.style.display = (cat==='all'||card.dataset.cats.split(' ').includes(cat)) ? '' : 'none';
      });
    };
  });
}

/* ============================================================
   TOOL WORKSPACE
   ============================================================ */
let S = null; // active tool state

function renderTool(id){
  const t=getTool(id);
  S = { tool:t, pages:[], images:[], outputs:[] };

  if(t.soon){ renderSoon(t); return; }
  if(t.form){ renderCertificate(t); return; }
  if(t.id==='editpdf'){ renderEdit(t); return; }

  const accept = t.images ? 'image/jpeg,image/png' : 'application/pdf';
  app().innerHTML = `
  <section class="tool"><div class="wrap">
    <span class="back" onclick="location.hash='#/'">${svg('back',18)} All tools</span>
    <div class="tool-head">
      <span class="ic c-${t.cat}" style="background:var(--${t.cat}-soft);color:var(--${t.cat})">${svg(t.icon,30)}</span>
      <h1>${t.title}</h1><p>${t.desc}</p>
    </div>

    <div class="dropzone" id="drop">
      <div class="upic">${svg('upload',30)}</div>
      <div class="big">Drop ${t.images?'images':'PDF files'} here</div>
      <div class="small">or click to browse — files stay on your device</div>
      <button class="btn-red" id="pick">Select ${t.images?'images':'PDF files'}</button>
      <input type="file" id="file" accept="${accept}" multiple hidden>
    </div>

    <div class="work" id="work">
      <div class="panel">
        <button class="btn-add" id="addmore">＋ Add more files</button>
        <div class="toolbar" id="toolbar"></div>
        <div class="thumbs" id="thumbs"></div>
        <div class="empty-note" id="empty" style="display:none">No pages yet.</div>
      </div>
      <aside class="sidebar"><div class="panel" id="options"></div></aside>
    </div>

    <div class="result" id="result">
      <div class="done">${svg('check',38)}</div>
      <h2 id="rTitle">Done!</h2>
      <p id="rText"></p>
      <div id="rDownloads"></div>
      <button class="again" onclick="location.reload()">↻ Start over</button>
    </div>
  </div></section>`;

  // wiring
  const drop=document.getElementById('drop'), input=document.getElementById('file');
  document.getElementById('pick').onclick=()=>input.click();
  document.getElementById('addmore').onclick=()=>input.click();
  drop.onclick=e=>{ if(e.target.id==='drop'||e.target.classList.contains('upic')||e.target.classList.contains('big')||e.target.classList.contains('small')) input.click(); };
  ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));
  input.addEventListener('change',e=>{handleFiles(e.target.files); input.value='';});

  buildOptions(t);
}

function renderSoon(t){
  app().innerHTML=`
  <section class="tool"><div class="wrap">
    <span class="back" onclick="location.hash='#/'">${svg('back',18)} All tools</span>
    <div class="tool-head">
      <span class="ic" style="background:var(--${t.cat}-soft);color:var(--${t.cat})">${svg(t.icon,30)}</span>
      <h1>${t.title}</h1><p>${t.desc}</p>
    </div>
    <div class="result on" style="max-width:560px">
      <div class="done" style="background:var(--bg-tint);color:var(--muted)">${svg(t.icon,38)}</div>
      <h2>Coming soon</h2>
      <p>This one needs more than the browser can do well on its own — we’d rather ship it right than ship it broken. In the meantime, the tools below all work fully offline today.</p>
      <a class="dlbtn" style="background:var(--red);box-shadow:none" href="#/">Browse working tools</a>
    </div>
  </div></section>`;
}

/* ---------- load files into state ---------- */
async function handleFiles(fileList){
  const files=[...fileList];
  if(!files.length) return;
  loader(true,'Reading files…');
  try{
    if(S.tool.images){
      for(const f of files){
        if(!/image\/(jpeg|png)/.test(f.type)) continue;
        const dataUrl=await readAsDataURL(f);
        S.images.push({file:f,dataUrl,name:f.name});
      }
    }else{
      for(const f of files){
        if(f.type!=='application/pdf') continue;
        const buf=await f.arrayBuffer();
        const pdf=await pdfjsLib.getDocument({data:buf.slice(0)}).promise;
        for(let i=0;i<pdf.numPages;i++){
          const page=await pdf.getPage(i+1);
          const vp=page.getViewport({scale:0.5});
          const canvas=document.createElement('canvas');
          canvas.width=vp.width; canvas.height=vp.height;
          await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
          S.pages.push({file:f, pageIndex:i, imgSrc:canvas.toDataURL(), rotation:0, selected:false});
        }
      }
    }
  }catch(err){ alert('Sorry, a file could not be read: '+err.message); }
  loader(false);
  document.getElementById('drop').style.display='none';
  document.getElementById('work').classList.add('on');
  S.tool.images ? renderImages() : renderPages();
}
const readAsDataURL = f => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});

/* ---------- thumbnail rendering (PDF page tools) ---------- */
function renderPages(){
  const wrap=document.getElementById('thumbs'); if(!wrap) return;
  const f=S.tool.features;
  wrap.innerHTML='';
  if(!S.pages.length){document.getElementById('empty').style.display='block';return;}
  document.getElementById('empty').style.display='none';

  S.pages.forEach((p,idx)=>{
    const d=document.createElement('div');
    d.className='pthumb'+(p.selected?' sel':'');
    d.dataset.index=idx;
    d.innerHTML=`
      <img src="${p.imgSrc}" style="transform:rotate(${p.rotation}deg)">
      <div class="pnum">Page ${idx+1}</div>
      <div class="pc">
        ${f.rotate?`<button class="iconbtn" title="Rotate">${svg('rotate',13)}</button>`:''}
        ${f.remove?`<button class="iconbtn warn" title="Delete">✕</button>`:''}
      </div>`;
    const btns=d.querySelectorAll('.iconbtn');
    if(f.rotate&&btns[0]) btns[0].onclick=e=>{e.stopPropagation(); p.rotation=(p.rotation+90)%360; renderPages();};
    if(f.remove){ const db=btns[f.rotate?1:0]; if(db) db.onclick=e=>{e.stopPropagation(); S.pages.splice(idx,1); renderPages();}; }
    if(f.select){ d.style.cursor='pointer'; d.onclick=()=>{p.selected=!p.selected; renderPages();}; }
    wrap.appendChild(d);
  });

  if(S._sortable){ try{S._sortable.destroy();}catch(e){} S._sortable=null; }
  if(f.reorder && window.Sortable){
    S._sortable=new Sortable(wrap,{animation:160,ghostClass:'ghost',dragClass:'dragging',onEnd:()=>{
      const order=[...wrap.querySelectorAll('.pthumb')].map(el=>S.pages[+el.dataset.index]);
      S.pages=order; renderPages();
    }});
  }
}

/* ---------- image rendering (JPG→PDF) ---------- */
function renderImages(){
  const wrap=document.getElementById('thumbs'); if(!wrap) return;
  wrap.innerHTML='';
  document.getElementById('toolbar').innerHTML='';
  S.images.forEach((im,idx)=>{
    const d=document.createElement('div'); d.className='pthumb'; d.dataset.index=idx;
    d.innerHTML=`<img src="${im.dataUrl}"><div class="pnum">${idx+1}</div>
      <div class="pc"><button class="iconbtn warn" title="Remove">✕</button></div>`;
    d.querySelector('.iconbtn').onclick=e=>{e.stopPropagation();S.images.splice(idx,1);renderImages();};
    wrap.appendChild(d);
  });
  if(window.Sortable) new Sortable(wrap,{animation:160,ghostClass:'ghost',onEnd:()=>{
    const order=[...wrap.querySelectorAll('.pthumb')].map(el=>S.images[+el.dataset.index]);
    S.images=order; renderImages();
  }});
}

/* ---------- toolbar (bulk actions for page tools) ---------- */
function setToolbar(html){ const t=document.getElementById('toolbar'); if(t) t.innerHTML=html; }

/* ============================================================
   OPTIONS PANEL + PROCESSORS (per tool)
   ============================================================ */
function buildOptions(t){
  const o=document.getElementById('options');
  const proc = b => `<button class="btn-primary" id="go">${b}</button>`;

  switch(t.id){
    /* ---- MERGE ---- */
    case 'merge':
      t.features={reorder:true,rotate:true,remove:true,select:false};
      o.innerHTML=`<h3>Merge options</h3><p class="hint">Drag pages to reorder. Add as many PDFs as you like.</p>
        <div class="field"><label><input type="checkbox" id="wm"> Stamp “CONFIDENTIAL” watermark</label></div>
        ${proc('Merge PDF')}`;
      go(async()=>{
        const wm=document.getElementById('wm').checked;
        const out=await PDFLib.PDFDocument.create();
        let font; if(wm) font=await out.embedFont(PDFLib.StandardFonts.HelveticaBold);
        await copyPagesInto(out, S.pages, wm?font:null);
        finish([await pdfBlob(out,'merged.pdf')],`Merged ${S.pages.length} page(s) into one PDF.`);
      });
      break;

    /* ---- ORGANIZE (same engine, single doc focus) ---- */
    case 'organize':
      t.features={reorder:true,rotate:true,remove:true,select:false};
      o.innerHTML=`<h3>Organize</h3><p class="hint">Reorder by dragging, rotate or delete pages, then export.</p>${proc('Export PDF')}`;
      go(async()=>{ const out=await PDFLib.PDFDocument.create(); await copyPagesInto(out,S.pages);
        finish([await pdfBlob(out,'organized.pdf')],`Exported ${S.pages.length} page(s).`); });
      break;

    /* ---- ROTATE ---- */
    case 'rotate':
      t.features={reorder:false,rotate:true,remove:false,select:false};
      setToolbarLater(`<button class="tb" data-r="left">↺ Rotate all left</button><button class="tb" data-r="right">↻ Rotate all right</button>`);
      o.innerHTML=`<h3>Rotate</h3><p class="hint">Use the buttons above to rotate every page, or rotate pages individually.</p>${proc('Apply &amp; download')}`;
      attachToolbar(dir=>{ const step=dir==='right'?90:270; S.pages.forEach(p=>p.rotation=(p.rotation+step)%360); renderPages(); });
      go(async()=>{ const out=await PDFLib.PDFDocument.create(); await copyPagesInto(out,S.pages);
        finish([await pdfBlob(out,'rotated.pdf')],'Rotation applied to all pages.'); });
      break;

    /* ---- REMOVE PAGES ---- */
    case 'remove':
      t.features={reorder:false,rotate:false,remove:true,select:true};
      o.innerHTML=`<h3>Remove pages</h3><p class="hint">Click pages to select them, or use the ✕ button. Selected pages will be deleted.</p>${proc('Delete selected &amp; download')}`;
      go(async()=>{
        const keep=S.pages.filter(p=>!p.selected);
        if(!keep.length){alert('That would remove every page.');return;}
        const removed=S.pages.length-keep.length;
        const out=await PDFLib.PDFDocument.create(); await copyPagesInto(out,keep);
        finish([await pdfBlob(out,'cleaned.pdf')],`Removed ${removed||0} page(s); kept ${keep.length}.`);
      });
      break;

    /* ---- SPLIT ---- */
    case 'split':
      t.features={reorder:false,rotate:false,remove:false,select:false};
      o.innerHTML=`<h3>Split options</h3>
        <div class="field"><label>Mode</label>
          <div class="seg" id="mode">
            <button class="on" data-m="range">Range</button>
            <button data-m="each">Each page</button>
            <button data-m="every">Every N</button>
          </div></div>
        <div class="field" id="rangeF"><label>Page range(s)</label>
          <input type="text" id="ranges" placeholder="e.g. 1-3, 5, 8-10">
          <p class="hint" style="margin-top:6px">Extract these pages into one PDF.</p></div>
        <div class="field" id="everyF" style="display:none"><label>Pages per file</label>
          <input type="number" id="n" value="1" min="1"></div>
        ${proc('Split PDF')}`;
      let mode='range';
      document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{
        document.querySelectorAll('#mode button').forEach(x=>x.classList.remove('on'));
        b.classList.add('on'); mode=b.dataset.m;
        document.getElementById('rangeF').style.display = mode==='range'?'':'none';
        document.getElementById('everyF').style.display = mode==='every'?'':'none';
      });
      go(async()=>{
        const total=S.pages.length, outs=[];
        if(mode==='range'){
          const idxs=parseRanges(document.getElementById('ranges').value,total);
          if(!idxs.length){alert('Enter a valid range, e.g. 1-3, 5');return;}
          const out=await PDFLib.PDFDocument.create();
          await copyPagesInto(out, idxs.map(i=>S.pages[i]));
          outs.push(await pdfBlob(out,'extract.pdf'));
        }else{
          const groupSize = mode==='each'?1:Math.max(1,+document.getElementById('n').value||1);
          for(let start=0,part=1;start<total;start+=groupSize,part++){
            const slice=S.pages.slice(start,start+groupSize);
            const out=await PDFLib.PDFDocument.create();
            await copyPagesInto(out,slice);
            outs.push(await pdfBlob(out,`part-${part}.pdf`));
          }
        }
        finish(outs, outs.length>1?`Split into ${outs.length} files.`:'Pages extracted.');
      });
      break;

    /* ---- COMPRESS ---- */
    case 'compress':
      t.features={reorder:false,rotate:false,remove:true,select:false};
      o.innerHTML=`<h3>Compress</h3>
        <p class="hint">Best for scanned or image-heavy PDFs. Pages are re-rendered as optimised images.</p>
        <div class="field"><label>Quality</label>
          <div class="range-row"><input type="range" id="q" min="30" max="92" value="62"><b id="qv">62%</b></div>
          <p class="hint" style="margin-top:6px">Lower = smaller file. Higher = sharper.</p></div>
        ${proc('Compress PDF')}`;
      { const q=document.getElementById('q'); q.oninput=()=>document.getElementById('qv').textContent=q.value+'%'; }
      go(async()=>{
        const quality=(+document.getElementById('q').value)/100;
        const scale = quality<0.5?1.1:1.6;
        const out=await PDFLib.PDFDocument.create();
        for(const p of S.pages){
          const {dataUrl,w,h}=await rasterize(p,scale,quality);
          const img=await out.embedJpg(dataUrl);
          const page=out.addPage([w,h]);
          page.drawImage(img,{x:0,y:0,width:w,height:h});
        }
        const blob=await pdfBlob(out,'compressed.pdf');
        finish([blob], `Compressed to ${blob.sizeLabel}.`);
      });
      break;

    /* ---- PAGE NUMBERS ---- */
    case 'pagenumbers':
      t.features={reorder:true,rotate:false,remove:false,select:false};
      o.innerHTML=`<h3>Page numbers</h3>
        <div class="field"><label>Position</label>
          <select id="pos">
            <option value="bc">Bottom centre</option><option value="br">Bottom right</option>
            <option value="bl">Bottom left</option><option value="tc">Top centre</option>
            <option value="tr">Top right</option><option value="tl">Top left</option>
          </select></div>
        <div class="field"><label>Format</label>
          <select id="fmt"><option value="n">1, 2, 3</option><option value="np">Page 1</option><option value="nofn">1 of N</option></select></div>
        <div class="field"><label>Start at</label><input type="number" id="start" value="1" min="0"></div>
        ${proc('Add page numbers')}`;
      go(async()=>{
        const pos=document.getElementById('pos').value, fmt=document.getElementById('fmt').value, start=+document.getElementById('start').value||1;
        const out=await PDFLib.PDFDocument.create(); await copyPagesInto(out,S.pages);
        const font=await out.embedFont(PDFLib.StandardFonts.Helvetica);
        const pgs=out.getPages(), N=pgs.length;
        pgs.forEach((pg,i)=>{
          const {width,height}=pg.getSize();
          let txt = fmt==='np'?`Page ${start+i}` : fmt==='nofn'?`${start+i} of ${start+N-1}` : `${start+i}`;
          const size=11, tw=font.widthOfTextAtSize(txt,size), m=28;
          const xs={l:m, c:(width-tw)/2, r:width-tw-m}, ys={t:height-m, b:m};
          const x=xs[pos[1]], y=ys[pos[0]];
          pg.drawText(txt,{x,y,size,font,color:PDFLib.rgb(0.2,0.2,0.2)});
        });
        finish([await pdfBlob(out,'numbered.pdf')],`Added numbers to ${N} page(s).`);
      });
      break;

    /* ---- WATERMARK ---- */
    case 'watermark':
      t.features={reorder:false,rotate:false,remove:false,select:false};
      o.innerHTML=`<h3>Watermark</h3>
        <div class="field"><label>Text</label><input type="text" id="wt" value="CONFIDENTIAL"></div>
        <div class="field"><label>Opacity</label><div class="range-row"><input type="range" id="op" min="5" max="80" value="30"><b id="opv">30%</b></div></div>
        <div class="field"><label>Size</label><div class="range-row"><input type="range" id="sz" min="20" max="120" value="55"><b id="szv">55</b></div></div>
        <div class="field"><label>Angle</label>
          <div class="seg" id="ang"><button class="on" data-a="45">Diagonal</button><button data-a="0">Flat</button></div></div>
        <div class="field"><label>Colour</label><input type="color" id="col" value="#0b57b8" style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg)"></div>
        ${proc('Add watermark')}`;
      bindRange('op','opv','%'); bindRange('sz','szv','');
      let ang=45; document.querySelectorAll('#ang button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#ang button').forEach(x=>x.classList.remove('on'));b.classList.add('on');ang=+b.dataset.a;});
      go(async()=>{
        const txt=document.getElementById('wt').value||'WATERMARK';
        const op=(+document.getElementById('op').value)/100, size=+document.getElementById('sz').value;
        const c=hexRgb(document.getElementById('col').value);
        const out=await PDFLib.PDFDocument.create(); await copyPagesInto(out,S.pages);
        const font=await out.embedFont(PDFLib.StandardFonts.HelveticaBold);
        out.getPages().forEach(pg=>{
          const {width,height}=pg.getSize();
          const tw=font.widthOfTextAtSize(txt,size);
          pg.drawText(txt,{x:width/2-tw/2, y:height/2-size/2, size, font,
            color:PDFLib.rgb(c.r,c.g,c.b), opacity:op, rotate:PDFLib.degrees(ang)});
        });
        finish([await pdfBlob(out,'watermarked.pdf')],'Watermark applied to every page.');
      });
      break;

    /* ---- PDF TO JPG ---- */
    case 'pdf2jpg':
      t.features={reorder:false,rotate:true,remove:true,select:false};
      o.innerHTML=`<h3>PDF to JPG</h3>
        <div class="field"><label>Resolution</label>
          <div class="seg" id="res"><button data-s="1.5">Standard</button><button class="on" data-s="2">High</button><button data-s="3">Max</button></div></div>
        <div class="field"><label>Quality</label><div class="range-row"><input type="range" id="jq" min="50" max="98" value="90"><b id="jqv">90%</b></div></div>
        ${proc('Convert to JPG')}`;
      bindRange('jq','jqv','%');
      let scale=2; document.querySelectorAll('#res button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#res button').forEach(x=>x.classList.remove('on'));b.classList.add('on');scale=+b.dataset.s;});
      go(async()=>{
        const quality=(+document.getElementById('jq').value)/100, outs=[];
        for(let i=0;i<S.pages.length;i++){
          const {dataUrl}=await rasterize(S.pages[i],scale,quality);
          const blob=dataURLtoBlob(dataUrl); blob.sizeLabel=fmtSize(blob.size);
          blob.dlName=`page-${i+1}.jpg`;
          outs.push(blob);
        }
        finish(outs,`Converted ${outs.length} page(s) to JPG.`);
      });
      break;

    /* ---- JPG TO PDF ---- */
    case 'jpg2pdf':
      o.innerHTML=`<h3>JPG to PDF</h3>
        <div class="field"><label>Page size</label>
          <select id="ps"><option value="fit">Fit to image</option><option value="a4">A4</option><option value="letter">US Letter</option></select></div>
        <div class="field"><label>Orientation</label>
          <div class="seg" id="ori"><button class="on" data-o="auto">Auto</button><button data-o="portrait">Portrait</button><button data-o="landscape">Landscape</button></div></div>
        <div class="field"><label>Margin (pt)</label><input type="number" id="mg" value="0" min="0"></div>
        ${proc('Convert to PDF')}`;
      let ori='auto'; document.querySelectorAll('#ori button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#ori button').forEach(x=>x.classList.remove('on'));b.classList.add('on');ori=b.dataset.o;});
      go(async()=>{
        if(!S.images.length){alert('Add at least one image.');return;}
        const ps=document.getElementById('ps').value, mg=+document.getElementById('mg').value||0;
        const out=await PDFLib.PDFDocument.create();
        const sizes={a4:[595,842],letter:[612,792]};
        for(const im of S.images){
          const bytes=await im.file.arrayBuffer();
          const img = /png/i.test(im.file.type) ? await out.embedPng(bytes) : await out.embedJpg(bytes);
          let pw,ph;
          if(ps==='fit'){ pw=img.width+mg*2; ph=img.height+mg*2; }
          else{ let s=sizes[ps]; if(ori==='landscape'||(ori==='auto'&&img.width>img.height)) s=[s[1],s[0]]; [pw,ph]=s; }
          const page=out.addPage([pw,ph]);
          const aw=pw-mg*2, ah=ph-mg*2, r=Math.min(aw/img.width,ah/img.height);
          const w=img.width*r, h=img.height*r;
          page.drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});
        }
        finish([await pdfBlob(out,'images.pdf')],`Combined ${S.images.length} image(s) into a PDF.`);
      });
      break;

    /* ---- PDF TO WORD ---- */
    case 'word':
      t.features={reorder:true,rotate:false,remove:true,select:false};
      o.innerHTML=`<h3>PDF to Word</h3>
        <p class="hint">Pulls the text out of your PDF into an editable Word document. Works best on text-based PDFs (reports, letters, contracts). Scanned or image-only PDFs have no text layer to read — those need OCR.</p>
        <div class="field"><label><input type="checkbox" id="wHead" checked> Detect headings (larger text becomes bold)</label></div>
        <div class="field"><label><input type="checkbox" id="wBreak" checked> Keep a page break between PDF pages</label></div>
        ${proc('Convert to Word')}`;
      go(async()=>{
        const detectHead=document.getElementById('wHead').checked;
        const pageBreak=document.getElementById('wBreak').checked;
        const model=[]; let totalChars=0;
        for(const p of S.pages){
          const pdf=await getDoc(p.file);
          const page=await pdf.getPage(p.pageIndex+1);
          const paras=await extractParagraphs(page, detectHead);
          paras.forEach(x=>totalChars+=x.text.length);
          model.push(paras);
        }
        if(totalChars < 5){
          alert('No selectable text was found in this PDF.\n\nIt looks like a scanned or image-only document, so there is no text layer to convert. Turning that into Word needs OCR, which isn’t available yet.');
          return;
        }
        const blob=buildWordDoc(model,{pageBreak});
        finish([blob], `Extracted text from ${S.pages.length} page(s) into an editable Word document.`);
      });
      break;
  }
}

/* ---------- option/toolbar helpers ---------- */
function go(fn){ const b=document.getElementById('go'); if(b) b.onclick=async()=>{ try{ loader(true,'Processing…'); await fn(); }catch(e){ console.error(e); alert('Something went wrong: '+e.message); } finally{ loader(false); } }; }
function bindRange(id,out,suf){ const r=document.getElementById(id); if(r) r.oninput=()=>document.getElementById(out).textContent=r.value+suf; }
let _tbHandler=null;
function setToolbarLater(html){ setTimeout(()=>{ const tb=document.getElementById('toolbar'); if(tb) tb.innerHTML=html; },0); }
function attachToolbar(handler){ _tbHandler=handler; }
document.addEventListener('click',e=>{ const tb=e.target.closest('#toolbar .tb'); if(tb&&_tbHandler) _tbHandler(tb.dataset.r); });

/* ---------- pdf-lib helpers ---------- */
async function copyPagesInto(out, pageObjs, wmFont){
  // group source pages by file so each file is loaded once
  const byFile=new Map();
  for(const p of pageObjs){ if(!byFile.has(p.file)) byFile.set(p.file, await PDFLib.PDFDocument.load(await p.file.arrayBuffer())); }
  for(const p of pageObjs){
    const src=byFile.get(p.file);
    const [copied]=await out.copyPages(src,[p.pageIndex]);
    const baseRot = copied.getRotation().angle||0;
    copied.setRotation(PDFLib.degrees((baseRot+(p.rotation||0))%360));
    out.addPage(copied);
    if(wmFont){ const {width,height}=copied.getSize();
      copied.drawText('CONFIDENTIAL',{x:width/4,y:height/2,size:50,font:wmFont,color:PDFLib.rgb(0.8,0.1,0.1),opacity:0.3,rotate:PDFLib.degrees(45)}); }
  }
}
async function pdfBlob(doc,name){ const bytes=await doc.save(); const blob=new Blob([bytes],{type:'application/pdf'}); blob.dlName=name; blob.sizeLabel=fmtSize(blob.size); return blob; }

/* render a stored page to a JPEG dataURL at a given scale (source PDFs cached) */
const _docCache=new WeakMap();
async function getDoc(file){
  if(_docCache.has(file)) return _docCache.get(file);
  const buf=await file.arrayBuffer();
  const doc=await pdfjsLib.getDocument({data:buf.slice(0)}).promise;
  _docCache.set(file,doc); return doc;
}
async function rasterize(pageObj, scale, quality){
  const pdf=await getDoc(pageObj.file);
  const page=await pdf.getPage(pageObj.pageIndex+1);
  const rot=(page.rotate + (pageObj.rotation||0))%360;
  const vp=page.getViewport({scale,rotation:rot});
  const canvas=document.createElement('canvas');
  canvas.width=Math.floor(vp.width); canvas.height=Math.floor(vp.height);
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport:vp}).promise;
  return {dataUrl:canvas.toDataURL('image/jpeg',quality), w:vp.width, h:vp.height};
}

/* ---------- PDF → Word: text extraction & rebuild ---------- */
/* Reconstruct paragraphs from a PDF page's text layer using pdf.js.
   Groups text items into lines by vertical position, then lines into
   paragraphs by the vertical gap between them; optionally flags larger
   text as headings. Returns [{text, heading}]. */
async function extractParagraphs(page, detectHead){
  const vp=page.getViewport({scale:1});
  const tc=await page.getTextContent();
  const items=[];
  for(const it of tc.items){
    if(typeof it.str!=='string' || it.str==='') continue;
    const m=pdfjsLib.Util.transform(vp.transform, it.transform);
    const size=Math.hypot(m[2],m[3]) || 10;
    items.push({x:m[4], y:m[5], size, str:it.str, width:(it.width||0)});
  }
  return reconstructParagraphs(items, detectHead);
}

/* Pure reconstruction: items [{x,y,size,str,width}] -> [{text,heading}].
   y is top-down (after the viewport transform). Kept separate from the
   pdf.js call so the grouping logic can be tested in isolation. */
function reconstructParagraphs(items, detectHead){
  if(!items || !items.length) return [];

  // group into lines by vertical position
  items=items.slice().sort((a,b)=> a.y-b.y || a.x-b.x);
  const lines=[]; let cur=null;
  for(const it of items){
    if(cur && Math.abs(it.y-cur.y) <= Math.max(cur.size,it.size)*0.6){ cur.items.push(it); }
    else { cur={y:it.y, size:it.size, items:[it]}; lines.push(cur); }
  }

  // build text + dominant size for each line
  const built=[];
  for(const ln of lines){
    ln.items.sort((a,b)=>a.x-b.x);
    let text='', prevRight=null, maxSize=0;
    for(const it of ln.items){
      maxSize=Math.max(maxSize, it.size);
      if(prevRight!==null){
        const gap=it.x-prevRight;
        if(gap > it.size*0.3 && !/\s$/.test(text) && !/^\s/.test(it.str)) text+=' ';
      }
      text+=it.str; prevRight=it.x+it.width;
    }
    text=text.replace(/\s+/g,' ').trim();
    if(text) built.push({y:ln.y, size:maxSize, text});
  }
  if(!built.length) return [];

  // median body size for heading detection
  const sizes=built.map(b=>b.size).slice().sort((a,b)=>a-b);
  const median=sizes[Math.floor(sizes.length/2)] || 10;

  // group lines into paragraphs by vertical gaps
  const paras=[]; let p=null, prevY=null, prevSize=median, prevWasHeading=false;
  for(const ln of built){
    const heading = detectHead && ln.size >= median*1.35 && ln.text.length < 120;
    const gap = prevY===null ? 0 : (ln.y - prevY);
    if(heading){
      paras.push({text:ln.text, heading:true}); p=null; prevWasHeading=true;
    } else {
      const startNew = p===null || prevWasHeading || gap > prevSize*1.9;
      if(startNew){ p={text:ln.text, heading:false}; paras.push(p); }
      else { p.text += ' ' + ln.text; }
      prevWasHeading=false;
    }
    prevY=ln.y; prevSize=ln.size;
  }
  return paras;
}

/* Build an editable Word (.doc) file from the extracted model.
   HTML-based Word document — opens in MS Word / Google Docs and can be
   re-saved as .docx. No external libraries, fully offline. */
function buildWordDoc(model, opts){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const parts=[];
  model.forEach((paras,pi)=>{
    const breakFirst = pi>0 && opts.pageBreak;
    if(!paras.length){ parts.push('<p'+(breakFirst?' class="pb"':'')+'>&nbsp;</p>'); return; }
    paras.forEach((p,idx)=>{
      const cls=[]; if(p.heading) cls.push('h'); if(breakFirst && idx===0) cls.push('pb');
      parts.push(`<p${cls.length?' class="'+cls.join(' ')+'"':''}>${esc(p.text)}</p>`);
    });
  });
  const html=`<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Converted document</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
@page Section1 { size:21cm 29.7cm; margin:2.2cm; }
div.Section1 { page:Section1; }
body{ font-family:'Calibri','Segoe UI',Arial,sans-serif; font-size:11pt; color:#1a1a1a; line-height:1.4; }
p{ margin:0 0 8pt; }
p.h{ font-size:14pt; font-weight:bold; margin:14pt 0 6pt; }
p.pb{ page-break-before:always; margin:0; }
</style></head>
<body><div class="Section1">
${parts.join('\n')}
</div></body></html>`;
  const blob=new Blob(['\ufeff'+html],{type:'application/msword'});
  blob.dlName='converted.doc'; blob.sizeLabel=fmtSize(blob.size);
  return blob;
}

/* ---------- result UI ---------- */
function finish(outputs, message){
  S.outputs=outputs;
  document.getElementById('work').classList.remove('on');
  const r=document.getElementById('result'); r.classList.add('on');
  document.getElementById('rText').textContent=message;
  const box=document.getElementById('rDownloads'); box.innerHTML='';
  if(outputs.length===1){
    const o=outputs[0], url=URL.createObjectURL(o);
    box.innerHTML=`<a class="dlbtn" href="${url}" download="${o.dlName}">${svg('dl',20)} Download ${o.dlName} <span style="opacity:.8;font-weight:600">· ${o.sizeLabel}</span></a>`;
  }else{
    const a=document.createElement('a'); a.className='dlbtn'; a.style.marginBottom='16px';
    a.innerHTML=`${svg('dl',20)} Download all (${outputs.length})`;
    a.onclick=()=>outputs.forEach((o,i)=>setTimeout(()=>downloadBlob(o),i*250));
    box.appendChild(a);
    const list=document.createElement('div'); list.className='list-files'; list.style.marginTop='18px';
    outputs.forEach(o=>{ const url=URL.createObjectURL(o);
      const row=document.createElement('div'); row.className='fitem';
      row.innerHTML=`<span class="fi-ic">${svg('dl',18)}</span><span class="fi-name">${o.dlName}</span><span class="fi-size">${o.sizeLabel}</span>`;
      const dl=document.createElement('a'); dl.href=url; dl.download=o.dlName; dl.className='iconbtn'; dl.title='Download'; dl.innerHTML='↓';
      row.appendChild(dl); list.appendChild(row);
    });
    box.appendChild(list);
  }
}
function downloadBlob(blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=blob.dlName; document.body.appendChild(a); a.click(); a.remove(); }
function dataURLtoBlob(dataUrl){ const [h,b]=dataUrl.split(','); const mime=h.match(/:(.*?);/)[1]; const bin=atob(b); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i); return new Blob([arr],{type:mime}); }

/* ---------- misc parsers ---------- */
function parseRanges(str,total){
  const set=new Set();
  (str||'').split(',').forEach(part=>{
    part=part.trim(); if(!part) return;
    const m=part.match(/^(\d+)\s*-\s*(\d+)$/);
    if(m){ let a=+m[1],b=+m[2]; if(a>b)[a,b]=[b,a]; for(let i=a;i<=b;i++) if(i>=1&&i<=total)set.add(i-1); }
    else{ const n=+part; if(n>=1&&n<=total)set.add(n-1); }
  });
  return [...set].sort((a,b)=>a-b);
}
function hexRgb(hex){ const n=parseInt(hex.slice(1),16); return {r:((n>>16)&255)/255,g:((n>>8)&255)/255,b:(n&255)/255}; }

/* ============================================================
   JOB COMPLETION CERTIFICATE GENERATOR
   Generates an official "Certificate of Final Completion" as
   PDF (pdf-lib) and Word (.doc), with a unique searchable
   certificate number. Records are kept in this browser's local
   storage so a number can be verified later — entirely offline.
   ============================================================ */

const ISSUER = {
  name:'Nigerian Communications Commission',
  address:'Plot 423 Aguiyi Ironsi Street, Maitama, Abuja',
  signerRole:'Head, Procurement Department',
  signerFor:'For: Executive Vice Chairman / CEO',
  prefix:'NCC/PROC/CERT/'
};
const REG_KEY='ncc_cert_registry';

/* ============================================================
   SHARED CERTIFICATE REGISTRY (optional backend)
   Paste your Google Apps Script Web App URL below to turn on a
   shared, cross-device registry + public verification. Leave it
   empty and the app keeps working with a per-browser registry.
   The backend stores ONLY certificate metadata (number, contractor,
   amount, dates) — never the documents themselves.
   ============================================================ */
const REGISTRY = {
  url: 'https://script.google.com/macros/s/AKfycbwQ05wjR_ZZ14SLwJY1_va7SVGhJOtC2vgg0nUkluerDS_LKueh1qxT7_Y5qsZk0LEkfA/exec'   // e.g. 'https://script.google.com/macros/s/XXXXXXXX/exec'
};
const registryEnabled = () => !!(REGISTRY.url && /^https?:\/\//.test(REGISTRY.url));

function recordFrom(d){
  return { certNo:d.certNo, code:d.certTail, contractor:d.contractor, address:d.contractorAddress,
    projectTitle:d.projectTitle, issueDate:d.issueDateText, awardDate:d.awardText,
    deliveryDate:d.deliverText, amount:d.amountText, amountWords:d.amountWords,
    createdAt:new Date().toISOString() };
}
function localLookup(code){
  code=normTail(code); const reg=loadRegistry();
  return Object.values(reg).find(r=>(r.code||'').toUpperCase()===code || (r.certNo||'').toUpperCase().endsWith(code))||null;
}
/* save: returns {ok, shared} or {duplicate:true} or {degraded:true,...} */
async function registrySave(record){
  const reg=loadRegistry();
  if(registryEnabled()){
    try{
      const r=await fetch(REGISTRY.url,{ method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},  // text/plain avoids a CORS preflight
        body:JSON.stringify({action:'save', record, password:gatePassword()}) });
      const j=await r.json();
      if(j && j.ok){ reg[record.certNo]=record; saveRegistry(reg); return {ok:true, shared:true}; }
      if(j && j.duplicate){ return {duplicate:true}; }
      if(j && j.error==='unauthorized'){ return {unauthorized:true}; }
    }catch(e){ /* network/CORS issue — fall back to local below */ }
    if(reg[record.certNo]) return {duplicate:true};
    reg[record.certNo]=record; saveRegistry(reg); return {ok:true, shared:false, degraded:true};
  }
  if(reg[record.certNo]) return {duplicate:true};
  reg[record.certNo]=record; saveRegistry(reg); return {ok:true, shared:false};
}
/* lookup: returns {rec, shared} */
async function registryLookup(code){
  code=normTail(code);
  if(registryEnabled()){
    try{
      const u=REGISTRY.url+(REGISTRY.url.includes('?')?'&':'?')+'code='+encodeURIComponent(code);
      const r=await fetch(u); const j=await r.json();
      if(j && j.found && j.record) return {rec:j.record, shared:true};
      if(j && j.found===false){ const l=localLookup(code); return l?{rec:l, shared:false}:{rec:null, shared:true}; }
    }catch(e){ /* fall back to local */ }
  }
  return {rec:localLookup(code), shared:false};
}

/* ----- verification URL + QR (QR via qrcode-generator if present) ----- */
function verifyUrlFor(code){ return location.origin + location.pathname + '#/verify/' + encodeURIComponent(normTail(code)); }
function qrCanvas(text, px){
  if(typeof window.qrcode!=='function') return null;
  try{
    const qr=window.qrcode(0,'M'); qr.addData(String(text)); qr.make();
    const n=qr.getModuleCount(), m=4, tot=n+m*2;
    const cell=Math.max(2, Math.floor((px||220)/tot)), size=cell*tot;
    const c=document.createElement('canvas'); c.width=size; c.height=size;
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,size,size); x.fillStyle='#000';
    for(let r=0;r<n;r++) for(let col=0;col<n;col++) if(qr.isDark(r,col)) x.fillRect((col+m)*cell,(r+m)*cell,cell,cell);
    return { dataUrl:c.toDataURL('image/png'), size };
  }catch(e){ return null; }
}

/* ----- number-to-words (Naira & Kobo) ----- */
const _ONES=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const _TENS=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function _two(n){ if(n<20) return _ONES[n]; const t=Math.floor(n/10),o=n%10; return _TENS[t]+(o?' '+_ONES[o]:''); }
function _three(n){ const h=Math.floor(n/100), r=n%100; let s=''; if(h)s+=_ONES[h]+' Hundred'; if(r){ if(h)s+=' and '; s+=_two(r); } return s; }
function toWords(num){
  num=Math.floor(num); if(num===0) return 'Zero';
  const scales=['','Thousand','Million','Billion','Trillion']; const groups=[]; let i=0;
  while(num>0){ const g=num%1000; if(g) groups.unshift(_three(g)+(scales[i]?' '+scales[i]:'')); num=Math.floor(num/1000); i++; }
  return groups.join(', ');
}
function amountInWords(naira,kobo){
  let w=toWords(naira)+' Naira';
  if(kobo>0) w+=', '+toWords(kobo)+' Kobo';
  else w+=' Only';
  return w;
}
function parseAmount(str){
  const clean=String(str||'').replace(/[^0-9.]/g,'');
  if(clean==='') return null;
  const num=parseFloat(clean); if(isNaN(num)) return null;
  const naira=Math.floor(num+1e-9); const kobo=Math.round((num-naira)*100);
  return {num,naira,kobo};
}
function formatNaira(num){ return 'N'+Number(num).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

/* ----- long date formatting: "Tuesday 26th of May 2026" ----- */
const _DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const _MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function ordinal(d){ const v=d%100; const s=['th','st','nd','rd']; return d+(s[(v-20)%10]||s[v]||s[0]); }
function formatDateLong(date){ if(!date||isNaN(date)) return ''; return `${_DAYS[date.getDay()]} ${ordinal(date.getDate())} of ${_MONTHS[date.getMonth()]} ${date.getFullYear()}`; }
function dateFromInput(v){ if(!v) return null; const [y,m,d]=v.split('-').map(Number); if(!y||!m||!d) return null; return new Date(y,m-1,d); }

/* ----- local registry (per browser) ----- */
function loadRegistry(){ try{ return JSON.parse(localStorage.getItem(REG_KEY)||'{}'); }catch(e){ return {}; } }
function saveRegistry(r){ try{ localStorage.setItem(REG_KEY,JSON.stringify(r)); }catch(e){} }
function genCertId(){
  const reg=loadRegistry();
  const used=new Set(Object.keys(reg).map(k=>k.split('/').pop().trim().toUpperCase()));
  let id, guard=0;
  do{
    const tail=String(Date.now()).slice(-5);                 // 5 digits
    const letter=String.fromCharCode(65+Math.floor(Math.random()*26));
    id=tail+letter; guard++;
  }while(used.has(id) && guard<50);
  return id;
}

/* ----- collect + format the form into a single data object ----- */
function readCertForm(){
  const g=id=>document.getElementById(id);
  const nameRaw=(g('cName').value||'').trim();
  const contractor = nameRaw ? (/^messrs/i.test(nameRaw)?nameRaw:('MESSRS '+nameRaw)).toUpperCase() : '';
  const amt=parseAmount(g('cAmount').value);
  const award=dateFromInput(g('cAward').value);
  const deliver=dateFromInput(g('cDeliver').value);
  const issue=new Date();
  const tail=(g('cCertNo').value||'').trim();
  const verifyUrl=tail?verifyUrlFor(tail):'';
  const qr=tail?qrCanvas(verifyUrl,220):null;
  return {
    contractor,
    contractorRaw:nameRaw,
    contractorAddress:(g('cAddr').value||'').trim(),
    certTail:tail,
    certNo:ISSUER.prefix+' '+tail,
    verifyUrl,
    qrDataUrl:qr?qr.dataUrl:'',
    issueDate:issue,
    issueDateText:formatDateLong(issue),
    projectTitle:(g('cTitle').value||'').trim().toUpperCase(),
    awardDate:award, awardText:formatDateLong(award),
    deliverDate:deliver, deliverText:formatDateLong(deliver),
    amount:amt,
    amountText:amt?formatNaira(amt.num):'',
    amountWords:amt?amountInWords(amt.naira,amt.kobo):''
  };
}
function validateCert(d){
  const miss=[];
  if(!d.contractorRaw) miss.push('Contractor name');
  if(!d.contractorAddress) miss.push('Contractor address');
  if(!d.certTail) miss.push('Certificate number');
  if(!d.projectTitle) miss.push('Project title');
  if(!d.awardDate) miss.push('Contract award date');
  if(!d.deliverDate) miss.push('Delivery date');
  if(!d.amount) miss.push('Contract amount');
  return miss;
}

/* ============================================================
   View
   ============================================================ */
function renderCertificate(t, deepCode){
  const locked = !gateUnlocked();

  const lockInner = `
      <div class="panel gate-panel">
        <div class="gate-lock">${svg('shield',34)}</div>
        <h3>Password required</h3>
        <p class="hint">Certificate generation is restricted. Enter the password to continue — anyone can still verify a certificate under the <b>Verify a number</b> tab.</p>
        <div class="field"><label>Password</label>
          <input type="password" id="gatePw" placeholder="Enter password" autocomplete="off"></div>
        <button class="btn-primary" id="gateGo">Unlock</button>
        <p class="hint" id="gateErr" style="color:var(--red);margin-top:10px"></p>
      </div>`;

  const formInner = `
      <div class="panel">
        <h3>Certificate details</h3>
        <p class="hint">Issued by ${ISSUER.name}. ${registryEnabled()?'Numbers are checked against the shared registry and verifiable from any device.':'Stored on this device — enable the shared registry for org-wide verification.'}</p>

        <div class="field"><label>Contractor name</label>
          <input type="text" id="cName" placeholder="e.g. Jamitan Tech Limited"></div>
        <div class="field"><label>Contractor address</label>
          <input type="text" id="cAddr" placeholder="e.g. Suite A3, No 1 Kumasi Crescent, Wuse 2, Abuja"></div>

        <div class="field"><label>Certificate number</label>
          <div class="certno-row">
            <span class="certno-prefix">${ISSUER.prefix}</span>
            <input type="text" id="cCertNo" readonly>
            <button class="iconbtn" id="regenId" title="Generate a new unique number">${svg('rotate',14)}</button>
          </div>
          <p class="hint" style="margin-top:6px">Auto-generated and unique — used to verify the certificate later.</p>
        </div>

        <div class="field"><label>Issue date</label>
          <input type="text" id="cIssue" readonly>
          <p class="hint" style="margin-top:6px">Set automatically to today.</p></div>

        <div class="field"><label>Project title</label>
          <input type="text" id="cTitle" placeholder="e.g. Renewal of ArcGIS Annual Software Enhancement"></div>

        <div class="field"><div class="row">
          <div style="flex:1"><label>Contract award date</label><input type="date" id="cAward"></div>
          <div style="flex:1"><label>Delivery date</label><input type="date" id="cDeliver"></div>
        </div></div>

        <div class="field"><label>Contract amount (₦)</label>
          <input type="text" id="cAmount" placeholder="e.g. 61,529,022.50" inputmode="decimal">
          <p class="hint" id="amtWords" style="margin-top:6px"></p></div>

        <div class="row" style="gap:10px">
          <button class="btn-primary" id="dlPdf" style="flex:1">${svg('doc',18)} Download PDF</button>
          <button class="btn-primary" id="dlWord" style="flex:1;background:var(--blue);box-shadow:0 8px 22px rgba(44,123,229,.28)">${svg('word',18)} Download Word</button>
        </div>
        <p class="hint" style="text-align:center;margin-top:10px">Both files match the approved template and leave space at the top and bottom for your pre-printed letter-headed paper.</p>
        <p class="hint" id="saveNote" style="text-align:center;margin-top:8px"></p>
        <p style="text-align:center;margin-top:10px"><button class="linklike" id="gateLockBtn">🔒 Lock generator</button></p>
      </div>

      <div class="preview-wrap">
        <div class="preview-label">Live preview</div>
        <div id="certPreview" class="cert-paper"></div>
      </div>`;

  app().innerHTML=`
  <section class="tool"><div class="wrap">
    <span class="back" onclick="location.hash='#/'">${svg('back',18)} All tools</span>
    <div class="tool-head">
      <span class="ic" style="background:var(--slate-soft);color:var(--slate)">${svg('certificate',30)}</span>
      <h1>${t.title}</h1><p>${t.desc}</p>
    </div>

    <div class="seg" id="certTabs" style="max-width:360px;margin:0 auto 26px">
      <button class="on" data-t="gen">Generate</button>
      <button data-t="verify">Verify a number</button>
    </div>

    <div id="genView" class="${locked?'gate-wrap':'cert-layout'}">${locked?lockInner:formInner}</div>

    <div id="verifyView" style="display:none;max-width:620px;margin:0 auto">
      <div class="panel">
        <h3>Verify a certificate</h3>
        <p class="hint">Enter a certificate number (full or just the unique code), or scan the QR on the document.</p>
        <div class="field"><div class="certno-row">
          <span class="certno-prefix">${svg('search',16)}</span>
          <input type="text" id="vInput" placeholder="e.g. 43624C or NCC/PROC/CERT/ 43624C">
          <button class="iconbtn" id="vGo" title="Search">→</button>
        </div></div>
        <div id="vResult"></div>
        <div id="vRecent"></div>
      </div>
    </div>
  </div></section>`;

  // tab switching
  document.querySelectorAll('#certTabs button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#certTabs button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    const v=b.dataset.t;
    document.getElementById('genView').style.display = v==='gen'?'':'none';
    document.getElementById('verifyView').style.display = v==='verify'?'':'none';
    if(v==='verify') renderRecent();
  });

  if(locked){
    const go=async()=>{
      const pw=document.getElementById('gatePw').value;
      if(await gateTry(pw)){ renderCertificate(t, deepCode); }
      else { document.getElementById('gateErr').textContent='Incorrect password. Please try again.'; }
    };
    document.getElementById('gateGo').onclick=go;
    document.getElementById('gatePw').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
  } else {
    // init values
    document.getElementById('cCertNo').value=genCertId();
    document.getElementById('cIssue').value=formatDateLong(new Date());
    document.getElementById('regenId').onclick=()=>{ document.getElementById('cCertNo').value=genCertId(); updatePreview(); };

    // live preview + amount words
    ['cName','cAddr','cTitle','cAward','cDeliver','cAmount','cCertNo'].forEach(id=>{
      document.getElementById(id).addEventListener('input',updatePreview);
    });
    document.getElementById('cAmount').addEventListener('input',()=>{
      const a=parseAmount(document.getElementById('cAmount').value);
      document.getElementById('amtWords').textContent = a ? amountInWords(a.naira,a.kobo) : '';
    });

    document.getElementById('dlPdf').onclick=()=>issueCertificate('pdf');
    document.getElementById('dlWord').onclick=()=>issueCertificate('word');
    document.getElementById('gateLockBtn').onclick=()=>{ gateLock(); renderCertificate(t); };
    updatePreview();
  }

  // verify (always available)
  document.getElementById('vGo').onclick=doVerify;
  document.getElementById('vInput').addEventListener('keydown',e=>{ if(e.key==='Enter') doVerify(); });

  // deep link from a QR scan: #/verify/<code>
  if(deepCode){
    document.querySelector('#certTabs button[data-t="verify"]').click();
    const vi=document.getElementById('vInput'); vi.value=deepCode; doVerify();
  }
}

/* ----- certificate HTML body (shared by preview + Word) ----- */
function certBodyHTML(d){
  const row=(l,v,b)=>`<div class="c-row"><span class="c-lbl">${l}:</span><span class="c-val${b?' b':''}">${v||'<span class="ph">—</span>'}</span></div>`;
  return `
    <div class="c-letterhead">letterhead area (printed on paper)</div>
    <h1 class="c-title">Certificate of Final Completion</h1>
    <div class="c-rows">
      ${row('Issued By', ISSUER.name, true)}
      ${row('Address', ISSUER.address, false)}
      ${row('Contractor', d.contractor, false)}
      ${row('Address', d.contractorAddress, false)}
      ${row('Certificate No', d.certNo, false)}
      ${row('Issue Date', d.issueDateText, false)}
      ${row('Project Title', d.projectTitle, false)}
      ${row('Contract Award Date', d.awardText, false)}
    </div>
    <div class="c-certify">
      <p>Under the terms of the above mentioned contract,</p>
      <p>We certify the service was satisfactorily delivered on</p>
      <p class="b">${d.deliverText||'—'}</p>
    </div>
    <div class="c-sumline"><span>The Overall Contract Sum was:</span><b>${d.amountText||'—'}</b></div>
    <p class="c-words">(${d.amountWords||'—'})</p>
    <div class="c-sign">
      <div class="c-sigline"></div>
      <p class="c-role">Head, Procurement Department</p>
      <p class="c-for">For: Executive Vice Chairman / CEO</p>
    </div>
    ${d.qrDataUrl?`<div class="c-verify"><img src="${d.qrDataUrl}" alt="Verification QR code"><div class="c-vtext"><b>Scan to verify</b><br>${d.certNo}</div></div>`:''}`;
}
function updatePreview(){
  const d=readCertForm();
  document.getElementById('certPreview').innerHTML=certBodyHTML(d);
}

/* ----- issue: validate, register (shared/local), download ----- */
async function issueCertificate(kind){
  let d=readCertForm();
  const miss=validateCert(d);
  if(miss.length){ alert('Please complete:\n• '+miss.join('\n• ')); return; }

  loader(true, registryEnabled()?'Registering certificate…':'Saving certificate…');
  let res, tries=0;
  try{
    res=await registrySave(recordFrom(d));
    while(res && res.duplicate && tries<6){
      document.getElementById('cCertNo').value=genCertId(); tries++;
      d=readCertForm();
      res=await registrySave(recordFrom(d));
    }
  }catch(e){ loader(false); alert('Could not register the certificate: '+e.message); return; }

  if(res && res.duplicate){ loader(false); alert('Could not allocate a unique number — please try again.'); return; }
  if(res && res.unauthorized){ loader(false); gateLock(); alert('The registry rejected the password. Please re-enter it.'); renderCertificate(getTool('certificate')); return; }

  try{
    if(kind==='pdf'){ const blob=await buildCertPdf(d); downloadNamed(blob,`certificate-${d.certTail}.pdf`); }
    else { const blob=buildCertDoc(d); downloadNamed(blob,`certificate-${d.certTail}.doc`); }
  }catch(e){ console.error(e); alert('Could not build the document: '+e.message); }
  finally{ loader(false); }

  updatePreview();
  const note=document.getElementById('saveNote');
  if(res && res.shared) note.innerHTML=`✓ Registered in the shared registry as <b>${d.certNo}</b> — verifiable from any device.`;
  else if(res && res.degraded) note.innerHTML=`✓ Saved as <b>${d.certNo}</b>. The shared registry was unreachable, so it was stored on this device only.`;
  else note.innerHTML=`✓ Saved &amp; verifiable as <b>${d.certNo}</b> on this device.`;
}
function downloadNamed(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }

/* ============================================================
   PDF builder (pdf-lib, Times family). Designed to print on
    letter-headed paper: the logo/header and the footer block
   are left blank (top & bottom margins) so the pre-printed
   letterhead shows through.
   ============================================================ */
async function buildCertPdf(d){
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const doc=await PDFDocument.create();
  const page=doc.addPage([595.28,841.89]); // A4
  const { width:W, height:H }=page.getSize();
  const reg=await doc.embedFont(StandardFonts.TimesRoman);
  const bold=await doc.embedFont(StandardFonts.TimesRomanBold);
  const ink=rgb(0.12,0.12,0.17);
  const cx=W/2;
  const center=(txt,font,size,y,color=ink)=>{ const w=font.widthOfTextAtSize(txt,size); page.drawText(txt,{x:cx-w/2,y,size,font,color}); };

  // ~3.5cm top margin reserved for the pre-printed letterhead/logo
  let y=H-150;
  center('Certificate of Final Completion',bold,24,y); y-=46;

  // label : value rows (value column fixed so values align)
  const Lx=70, Vx=235, ls=12.5, LH=16;
  const rows=[
    ['Issued By', ISSUER.name, true],
    ['Address', ISSUER.address, false],
    ['Contractor', d.contractor, false],
    ['Address', d.contractorAddress, false],
    ['Certificate No', d.certNo, false],
    ['Issue Date', d.issueDateText, false],
    ['Project Title', d.projectTitle, false],
    ['Contract Award Date', d.awardText, false]
  ];
  for(const [l,v,b] of rows){
    page.drawText(l+':',{x:Lx,y,size:ls,font:reg,color:ink});
    const after=drawWrapped(page, v||'—', {x:Vx,y,size:ls,font:(b?bold:reg),color:ink,maxWidth:W-Vx-60,lineHeight:LH});
    y=after-22;
  }

  y-=26;
  center('Under the terms of the above mentioned contract,',reg,12.5,y); y-=22;
  center('We certify the service was satisfactorily delivered on',reg,12.5,y); y-=22;
  center(d.deliverText||'—',bold,12.5,y); y-=46;

  // contract sum: label + amount, the pair centred with a gap
  const sumLabel='The Overall Contract Sum was:', gap=46;
  const lw=reg.widthOfTextAtSize(sumLabel,12.5), aw=bold.widthOfTextAtSize(d.amountText||'—',13.5);
  const sx=cx-(lw+gap+aw)/2;
  page.drawText(sumLabel,{x:sx,y,size:12.5,font:reg,color:ink});
  page.drawText(d.amountText||'—',{x:sx+lw+gap,y,size:13.5,font:bold,color:ink}); y-=24;

  // amount in words: bold, centred, wrapped
  y=centerWrapped(page,'('+(d.amountWords||'—')+')',{y,size:12.5,font:bold,color:ink,maxWidth:W-150,lineHeight:18,cx}); y-=72;

  // signature block, centred
  const sigW=210;
  page.drawLine({start:{x:cx-sigW/2,y},end:{x:cx+sigW/2,y},thickness:1,color:ink}); y-=18;
  center(ISSUER.signerRole,reg,12,y); y-=18;
  center(ISSUER.signerFor,reg,11,y);

  // verification QR (bottom-left), if available
  if(d.qrDataUrl){
    try{
      const png=await doc.embedPng(dataURLtoBytes(d.qrDataUrl));
      const qs=64, qx=70, qy=92;
      page.drawImage(png,{x:qx,y:qy,width:qs,height:qs});
      page.drawText('Scan to verify',{x:qx+qs+10,y:qy+qs-22,size:9,font:bold,color:ink});
      page.drawText(d.certNo,{x:qx+qs+10,y:qy+qs-36,size:9,font:reg,color:ink});
    }catch(e){ /* QR optional */ }
  }

  const bytes=await doc.save();
  return new Blob([bytes],{type:'application/pdf'});
}

/* left-aligned word wrap; returns baseline y of the last line drawn */
function drawWrapped(page,text,{x,y,size,font,color,maxWidth,lineHeight}){
  const words=String(text).split(/\s+/); let line='';
  const flush=()=>{ if(line){ page.drawText(line,{x,y,size,font,color}); y-=lineHeight; line=''; } };
  for(const w of words){
    const test=line?line+' '+w:w;
    if(font.widthOfTextAtSize(test,size)>maxWidth && line){ flush(); line=w; }
    else line=test;
  }
  flush();
  return y+lineHeight;
}

/* centred word wrap; returns baseline y of the last line drawn */
function centerWrapped(page,text,{y,size,font,color,maxWidth,lineHeight,cx}){
  const words=String(text).split(/\s+/), lines=[]; let line='';
  for(const w of words){ const t=line?line+' '+w:w; if(font.widthOfTextAtSize(t,size)>maxWidth && line){ lines.push(line); line=w; } else line=t; }
  if(line) lines.push(line);
  for(const ln of lines){ const w=font.widthOfTextAtSize(ln,size); page.drawText(ln,{x:cx-w/2,y,size,font,color}); y-=lineHeight; }
  return y+lineHeight;
}

/* ============================================================
   Word (.doc) builder — HTML that MS Word / Google Docs open
   and that can be re-saved as .docx. No external libraries.
   ============================================================ */
function buildCertDoc(d){
  const esc=s=>String(s||'—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const trow=(l,v,b)=>`<tr><td class="lbl">${l}:</td><td class="val">${b?'<b>'+esc(v)+'</b>':esc(v)}</td></tr>`;
  const html=`<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Certificate ${esc(d.certNo)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
/* top & bottom margins leave room for the pre-printed letterhead */
@page Section1 { size:21cm 29.7cm; margin:3.6cm 2.3cm 3cm 2.3cm; }
div.Section1 { page:Section1; }
body{ font-family:'Times New Roman',serif; color:#1a1a22; font-size:12pt; }
.title{ text-align:center; font-size:23pt; font-weight:bold; margin:0 0 22pt; }
table.rows{ border-collapse:collapse; margin:0 0 6pt; }
table.rows td{ padding:3pt 0; vertical-align:top; font-size:12pt; }
td.lbl{ width:5.2cm; }
td.val.b{ font-weight:bold; }
.certify{ text-align:center; line-height:1.6; margin:22pt 0; font-size:12pt; }
.sum{ text-align:center; margin:16pt 0 2pt; font-size:12.5pt; }
.words{ text-align:center; font-weight:bold; font-size:12pt; margin:0; }
.sign{ text-align:center; margin-top:52pt; }
.sigline{ width:6cm; border-top:1px solid #1a1a22; margin:0 auto 6pt; font-size:1pt; line-height:1pt; }
.signtext{ margin:0; font-size:12pt; line-height:1.5; }
</style></head>
<body><div class="Section1">
  <p class="title">Certificate of Final Completion</p>
  <table class="rows">
    ${trow('Issued By',ISSUER.name,true)}
    ${trow('Address',ISSUER.address,false)}
    ${trow('Contractor',d.contractor,false)}
    ${trow('Address',d.contractorAddress,false)}
    ${trow('Certificate No',d.certNo,false)}
    ${trow('Issue Date',d.issueDateText,false)}
    ${trow('Project Title',d.projectTitle,false)}
    ${trow('Contract Award Date',d.awardText,false)}
  </table>
  <p class="certify">Under the terms of the above mentioned contract,<br>We certify the service was satisfactorily delivered on<br><b>${esc(d.deliverText)}</b></p>
  <p class="sum">The Overall Contract Sum was:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>${esc(d.amountText)}</b></p>
  <p class="words">(${esc(d.amountWords)})</p>
  <div class="sign">
    <p class="sigline">&nbsp;</p>
    <p class="signtext">${esc(ISSUER.signerRole)}<br>${esc(ISSUER.signerFor)}</p>
  </div>
  ${d.qrDataUrl?`<table style="margin-top:16pt;border-collapse:collapse"><tr>
    <td style="width:1.9cm;vertical-align:middle"><img src="${d.qrDataUrl}" style="width:1.7cm;height:1.7cm"></td>
    <td style="font-size:9pt;color:#333;vertical-align:middle"><b>Scan to verify</b><br>${esc(d.certNo)}</td>
  </tr></table>`:''}
</div></body></html>`;
  return new Blob(['\ufeff'+html],{type:'application/msword'});
}

/* ============================================================
   Verify / recent
   ============================================================ */
function normTail(input){ const s=String(input||'').trim(); return (s.includes('/')?s.split('/').pop():s).trim().toUpperCase(); }
async function doVerify(){
  const tail=normTail(document.getElementById('vInput').value);
  const box=document.getElementById('vResult');
  if(!tail){ box.innerHTML=''; return; }
  box.innerHTML='<p class="hint" style="margin:8px 2px">Checking…</p>';
  let rec=null, shared=false;
  try{ const r=await registryLookup(tail); rec=r.rec; shared=r.shared; }catch(e){}
  if(!rec){
    box.innerHTML=`<div class="verify-card not"><b>No matching certificate found.</b><p>${registryEnabled()
      ? 'This number isn’t in the registry. Check the code and try again.'
      : 'This number wasn’t issued in this browser. Without the shared registry enabled, certificates can only be verified on the device that created them.'}</p></div>`;
    return;
  }
  box.innerHTML=`<div class="verify-card ok">
    <div class="vc-h">${svg('check',20)} Verified certificate ${shared?'<span class="vc-badge">shared registry</span>':'<span class="vc-badge local">this device</span>'}</div>
    <table class="vc-t">
      <tr><td>Certificate No</td><td><b>${rec.certNo||(ISSUER.prefix+' '+(rec.code||tail))}</b></td></tr>
      <tr><td>Contractor</td><td>${rec.contractor||'—'}</td></tr>
      <tr><td>Project</td><td>${rec.projectTitle||'—'}</td></tr>
      <tr><td>Issued</td><td>${rec.issueDate||'—'}</td></tr>
      <tr><td>Delivered</td><td>${rec.deliveryDate||'—'}</td></tr>
      <tr><td>Contract sum</td><td>${rec.amount||'—'}</td></tr>
    </table>
  </div>`;
}
function renderRecent(){
  const reg=loadRegistry();
  const items=Object.values(reg).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,6);
  const el=document.getElementById('vRecent'); if(!el) return;
  if(!items.length){ el.innerHTML=`<p class="hint" style="margin-top:18px">No certificates issued on this device yet.</p>`; return; }
  el.innerHTML=`<p class="hint" style="margin:22px 0 8px">Recently issued on this device</p>`+
    items.map(r=>`<div class="fitem"><span class="fi-ic">${svg('certificate',18)}</span>
      <span class="fi-name">${r.code} — ${r.contractor}</span>
      <span class="fi-size">${r.issueDate}</span></div>`).join('');
}

/* ============================================================
   EDIT PDF — add text, images and freehand drawing onto a PDF,
   then flatten the changes with pdf-lib. Fully client-side.
   Annotation positions are stored as ratios of the displayed
   page, so they map cleanly to PDF points at save time.
   ============================================================ */
let ED=null;

function renderEdit(t){
  ED={ file:null, bytes:null, pdf:null, numPages:0, pageIndex:0, scale:1,
       ann:{}, mode:'select', color:'#0b57b8', fsRatio:0.028, penRatio:0.004, selectedId:null, uid:0 };

  app().innerHTML=`
  <section class="tool"><div class="wrap">
    <span class="back" onclick="location.hash='#/'">${svg('back',18)} All tools</span>
    <div class="tool-head">
      <span class="ic" style="background:var(--purple-soft);color:var(--purple)">${svg('edit',30)}</span>
      <h1>${t.title}</h1><p>${t.desc}</p>
    </div>

    <div class="dropzone" id="drop">
      <div class="upic">${svg('upload',30)}</div>
      <div class="big">Drop a PDF here</div>
      <div class="small">or click to browse — your file stays on your device</div>
      <button class="btn-red" id="pick">Select PDF file</button>
      <input type="file" id="file" accept="application/pdf" hidden>
    </div>

    <div id="editor" class="editor" style="display:none">
      <div class="ed-toolbar">
        <div class="ed-modes" id="edModes">
          <button class="ed-mode on" data-m="select" title="Select / move">${svg('cursor',18)}</button>
          <button class="ed-mode" data-m="text" title="Add text"><b style="font-family:Georgia,serif">T</b></button>
          <button class="ed-mode" data-m="image" title="Add image">${svg('image',18)}</button>
          <button class="ed-mode" data-m="draw" title="Draw">${svg('pen',18)}</button>
        </div>
        <label class="ed-color">Colour <input type="color" id="edColor" value="#0b57b8"></label>
        <span class="ed-ctl" id="edTextCtl" style="display:none">Size
          <button class="iconbtn" id="fsDown">−</button><button class="iconbtn" id="fsUp">+</button></span>
        <span class="ed-ctl" id="edPenCtl" style="display:none">Pen
          <input type="range" id="penRange" min="1" max="14" value="3" style="accent-color:var(--red)"></span>
        <button class="iconbtn warn" id="edDelete" title="Delete selected">✕</button>
        <span class="ed-spacer"></span>
        <span class="ed-pages"><button class="iconbtn" id="prevPg">‹</button><span id="pgInfo">1 / 1</span><button class="iconbtn" id="nextPg">›</button></span>
        <button class="btn-red" id="edSave">${svg('dl',16)} Save PDF</button>
      </div>
      <div class="ed-stagewrap" id="edStageWrap">
        <div class="ed-stage" id="edStage">
          <canvas id="edCanvas"></canvas>
          <div id="edOverlay" class="ed-overlay"></div>
        </div>
      </div>
      <p class="hint ed-hint" id="edHint">Pick a tool, then click on the page. Drag the ▦ handle to move, the ◢ corner to resize an image.</p>
    </div>
  </div></section>`;

  const drop=document.getElementById('drop'), input=document.getElementById('file');
  document.getElementById('pick').onclick=()=>input.click();
  drop.onclick=e=>{ if(e.target.id==='drop'||e.target.classList.contains('upic')||e.target.classList.contains('big')||e.target.classList.contains('small')) input.click(); };
  ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>edLoad(e.dataTransfer.files[0]));
  input.addEventListener('change',e=>{ edLoad(e.target.files[0]); input.value=''; });

  // toolbar wiring
  document.getElementById('edModes').addEventListener('click',e=>{
    const b=e.target.closest('.ed-mode'); if(!b) return;
    setMode(b.dataset.m);
  });
  document.getElementById('edColor').addEventListener('input',e=>{
    ED.color=e.target.value;
    const a=edSelected(); if(a && (a.type==='text'||a.type==='draw')){ a.color=ED.color; edRenderOverlay(); }
  });
  document.getElementById('fsUp').onclick=()=>edFontStep(1.15);
  document.getElementById('fsDown').onclick=()=>edFontStep(1/1.15);
  document.getElementById('penRange').addEventListener('input',e=>{ ED.penRatio=(+e.target.value)/750; });
  document.getElementById('edDelete').onclick=deleteSelected;
  document.getElementById('prevPg').onclick=()=>gotoPage(-1);
  document.getElementById('nextPg').onclick=()=>gotoPage(1);
  document.getElementById('edSave').onclick=saveEdit;
  window.addEventListener('resize', edResizeDebounced);
}

let _edResizeT=null;
function edResizeDebounced(){ if(!ED||!ED.pdf) return; clearTimeout(_edResizeT); _edResizeT=setTimeout(()=>edRenderPage(),180); }

async function edLoad(file){
  if(!file || file.type!=='application/pdf'){ alert('Please choose a PDF file.'); return; }
  loader(true,'Opening PDF…');
  try{
    ED.file=file;
    ED.bytes=await file.arrayBuffer();
    ED.pdf=await pdfjsLib.getDocument({data:ED.bytes.slice(0)}).promise;
    ED.numPages=ED.pdf.numPages; ED.pageIndex=0; ED.ann={};
    document.getElementById('drop').style.display='none';
    document.getElementById('editor').style.display='block';
    await edRenderPage();
  }catch(e){ console.error(e); alert('Could not open this PDF: '+e.message); }
  finally{ loader(false); }
}

function setMode(m){
  ED.mode=m;
  document.querySelectorAll('#edModes .ed-mode').forEach(b=>b.classList.toggle('on', b.dataset.m===m));
  updateCtls();
  const ov=document.getElementById('edOverlay');
  if(ov) ov.style.cursor = (m==='text'?'text': m==='draw'?'crosshair': m==='image'?'copy':'default');
  if(m==='image'){ edPickImage(); setMode('select'); }
}
/* show the Text-size control whenever you're in Text mode OR a text item is selected;
   show the Pen control in Draw mode */
function updateCtls(){
  const a=edSelected();
  const showText = ED.mode==='text' || (a && a.type==='text');
  const t=document.getElementById('edTextCtl'); if(t) t.style.display = showText ? 'inline-flex':'none';
  const p=document.getElementById('edPenCtl'); if(p) p.style.display = ED.mode==='draw' ? 'inline-flex':'none';
}

async function edRenderPage(){
  const page=await ED.pdf.getPage(ED.pageIndex+1);
  const wrap=document.getElementById('edStageWrap');
  const avail=Math.min((wrap.clientWidth||900)-2, 920);
  const base=page.getViewport({scale:1});
  ED.scale=Math.max(0.2, avail/base.width);
  const vp=page.getViewport({scale:ED.scale});
  const canvas=document.getElementById('edCanvas');
  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.floor(vp.width*dpr); canvas.height=Math.floor(vp.height*dpr);
  canvas.style.width=vp.width+'px'; canvas.style.height=vp.height+'px';
  const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,vp.width,vp.height);
  await page.render({canvasContext:ctx,viewport:vp}).promise;
  const ov=document.getElementById('edOverlay');
  ov.style.width=vp.width+'px'; ov.style.height=vp.height+'px';
  document.getElementById('pgInfo').textContent=(ED.pageIndex+1)+' / '+ED.numPages;
  document.getElementById('prevPg').disabled=ED.pageIndex===0;
  document.getElementById('nextPg').disabled=ED.pageIndex>=ED.numPages-1;
  // (re)bind overlay pointer handler
  ov.onpointerdown=edOverlayDown;
  edRenderOverlay();
}

function gotoPage(d){
  const n=ED.pageIndex+d; if(n<0||n>=ED.numPages) return;
  ED.pageIndex=n; ED.selectedId=null; edRenderPage();
}

function edList(){ return ED.ann[ED.pageIndex] || (ED.ann[ED.pageIndex]=[]); }
function edSelected(){ return edList().find(a=>a.id===ED.selectedId)||null; }
function selectAnn(id){
  ED.selectedId=id;
  const ov=document.getElementById('edOverlay');
  if(ov){
    ov.querySelectorAll('.ed-ann').forEach(el=>el.classList.toggle('sel', +el.dataset.id===id));
    ov.querySelectorAll('.ed-draw-layer polyline').forEach(pl=>pl.classList.toggle('sel', +pl.getAttribute('data-id')===id));
  }
  syncControls();
}
function syncControls(){
  const a=edSelected();
  if(a && a.color){ const c=document.getElementById('edColor'); if(c) c.value=a.color; }
  updateCtls();
}
function deleteSelected(){
  const l=edList(); const i=l.findIndex(a=>a.id===ED.selectedId);
  if(i>=0){ l.splice(i,1); ED.selectedId=null; edRenderOverlay(); updateCtls(); }
}
function edFontStep(f){
  const a=edSelected();
  if(a && a.type==='text'){
    a.fsRatio=Math.min(0.2, Math.max(0.008, a.fsRatio*f));
    const ov=document.getElementById('edOverlay');
    const tx=ov && ov.querySelector('.ed-ann[data-id="'+a.id+'"] .ed-text');
    if(tx && ov) tx.style.fontSize=(a.fsRatio*ov.clientHeight)+'px';
  } else {
    ED.fsRatio=Math.min(0.2, Math.max(0.008, ED.fsRatio*f));
  }
}

function edRel(e){
  const ov=document.getElementById('edOverlay'); const r=ov.getBoundingClientRect();
  return { W:r.width, H:r.height, x:e.clientX-r.left, y:e.clientY-r.top, ov };
}
function edOverlayDown(e){
  if(e.target.closest('.ed-ann')) return; // handled by the annotation
  const {W,H,x,y}=edRel(e);
  if(ED.mode==='text'){ addText(x/W, y/H); }
  else if(ED.mode==='draw'){ startStroke(e); }
  else { selectAnn(null); }
}

function addText(xr,yr){
  const a={id:++ED.uid, type:'text', x:Math.max(0,xr), y:Math.max(0,yr), text:'Text', fsRatio:ED.fsRatio, color:ED.color};
  edList().push(a); ED.selectedId=a.id; setMode('select'); edRenderOverlay();
  setTimeout(()=>{ const el=document.querySelector(`.ed-ann[data-id="${a.id}"] .ed-text`); if(el){ el.focus(); document.execCommand&&document.execCommand('selectAll',false,null); } },0);
}
function edPickImage(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/png,image/jpeg';
  inp.onchange=async()=>{
    const f=inp.files[0]; if(!f) return;
    const dataUrl=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f);});
    const im=new Image(); im.onload=()=>{
      const ov=document.getElementById('edOverlay'); const W=ov.clientWidth, H=ov.clientHeight;
      let w=Math.min(W*0.4, im.width); let h=w*(im.height/im.width);
      if(h>H*0.4){ h=H*0.4; w=h*(im.width/im.height); }
      const a={id:++ED.uid, type:'image', x:(W-w)/2/W, y:(H-h)/2/H, w:w/W, h:h/H, dataUrl, ar:im.width/im.height};
      edList().push(a); ED.selectedId=a.id; edRenderOverlay();
    };
    im.src=dataUrl;
  };
  inp.click();
}

function edRenderOverlay(){
  const ov=document.getElementById('edOverlay'); if(!ov) return;
  const W=ov.clientWidth, H=ov.clientHeight;
  ov.innerHTML='';
  const NS='http://www.w3.org/2000/svg';
  const svgEl=document.createElementNS(NS,'svg');
  svgEl.setAttribute('class','ed-draw-layer'); svgEl.setAttribute('width',W); svgEl.setAttribute('height',H);
  ov.appendChild(svgEl);

  edList().forEach(a=>{
    if(a.type==='draw'){
      const pl=document.createElementNS(NS,'polyline');
      pl.setAttribute('data-id', a.id);
      pl.setAttribute('points', a.points.map(p=>`${(p[0]*W).toFixed(1)},${(p[1]*H).toFixed(1)}`).join(' '));
      pl.setAttribute('fill','none'); pl.setAttribute('stroke',a.color);
      pl.setAttribute('stroke-width', Math.max(1,a.sizeRatio*H)); pl.setAttribute('stroke-linecap','round'); pl.setAttribute('stroke-linejoin','round');
      if(a.id===ED.selectedId) pl.classList.add('sel');
      pl.style.pointerEvents='stroke';
      pl.addEventListener('pointerdown',ev=>{ if(ED.mode==='select'){ ev.stopPropagation(); selectAnn(a.id); } });
      svgEl.appendChild(pl);
      return;
    }
    const el=document.createElement('div');
    el.className='ed-ann '+a.type+(a.id===ED.selectedId?' sel':'');
    el.dataset.id=a.id;
    el.style.left=(a.x*W)+'px'; el.style.top=(a.y*H)+'px';
    if(a.type==='text'){
      const tx=document.createElement('div'); tx.className='ed-text'; tx.contentEditable='true'; tx.spellcheck=false;
      tx.style.fontSize=(a.fsRatio*H)+'px'; tx.style.color=a.color; tx.textContent=a.text;
      tx.addEventListener('input',()=>{ a.text=tx.innerText; });
      tx.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); if(ED.mode==='select') selectAnn(a.id); });
      el.appendChild(tx);
    } else {
      el.style.width=(a.w*W)+'px'; el.style.height=(a.h*H)+'px';
      const img=document.createElement('img'); img.src=a.dataUrl; img.draggable=false; el.appendChild(img);
      const rz=document.createElement('span'); rz.className='ed-handle'; rz.title='Resize';
      rz.addEventListener('pointerdown',ev=>startResize(ev,a,el)); el.appendChild(rz);
      // images can be dragged from anywhere on the body
      el.addEventListener('pointerdown',ev=>{ if(ED.mode==='select' && !ev.target.classList.contains('ed-handle') && !ev.target.classList.contains('ed-move')) startDrag(ev,a,el); });
    }
    const mv=document.createElement('span'); mv.className='ed-move'; mv.title='Move'; mv.textContent='▦';
    mv.addEventListener('pointerdown',ev=>startDrag(ev,a,el));
    el.appendChild(mv);
    ov.appendChild(el);
  });
}

/* drag (move handle) */
function startDrag(e,a,el){
  e.preventDefault(); e.stopPropagation(); selectAnn(a.id);
  const ov=document.getElementById('edOverlay'); const r=ov.getBoundingClientRect();
  const startX=e.clientX, startY=e.clientY, x0=a.x*r.width, y0=a.y*r.height;
  const move=ev=>{
    let nx=x0+(ev.clientX-startX), ny=y0+(ev.clientY-startY);
    nx=Math.max(0,Math.min(nx, r.width-8)); ny=Math.max(0,Math.min(ny, r.height-8));
    a.x=nx/r.width; a.y=ny/r.height; el.style.left=nx+'px'; el.style.top=ny+'px';
  };
  const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
  window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
}
/* resize (image corner, keeps aspect) */
function startResize(e,a,el){
  e.preventDefault(); e.stopPropagation(); selectAnn(a.id);
  const ov=document.getElementById('edOverlay'); const r=ov.getBoundingClientRect();
  const startX=e.clientX, w0=a.w*r.width, ar=a.ar||(w0/(a.h*r.height));
  const move=ev=>{
    let nw=Math.max(24, w0+(ev.clientX-startX)); let nh=nw/ar;
    if(a.x*r.width+nw>r.width) nw=r.width-a.x*r.width, nh=nw/ar;
    if(a.y*r.height+nh>r.height) nh=r.height-a.y*r.height, nw=nh*ar;
    a.w=nw/r.width; a.h=nh/r.height; el.style.width=nw+'px'; el.style.height=nh+'px';
  };
  const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
  window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
}
/* freehand stroke */
function startStroke(e){
  const ov=document.getElementById('edOverlay'); const r=ov.getBoundingClientRect();
  const W=r.width, H=r.height;
  const a={id:++ED.uid, type:'draw', color:ED.color, sizeRatio:ED.penRatio, points:[[ (e.clientX-r.left)/W, (e.clientY-r.top)/H ]]};
  edList().push(a);
  // live-update a single polyline rather than rebuilding the whole overlay each move
  const NS='http://www.w3.org/2000/svg';
  let svgEl=ov.querySelector('.ed-draw-layer');
  if(!svgEl){ svgEl=document.createElementNS(NS,'svg'); svgEl.setAttribute('class','ed-draw-layer'); svgEl.setAttribute('width',W); svgEl.setAttribute('height',H); ov.insertBefore(svgEl, ov.firstChild); }
  const pl=document.createElementNS(NS,'polyline');
  pl.setAttribute('data-id',a.id); pl.setAttribute('fill','none'); pl.setAttribute('stroke',a.color);
  pl.setAttribute('stroke-width', Math.max(1,a.sizeRatio*H)); pl.setAttribute('stroke-linecap','round'); pl.setAttribute('stroke-linejoin','round');
  svgEl.appendChild(pl);
  const paint=()=>pl.setAttribute('points', a.points.map(p=>`${(p[0]*W).toFixed(1)},${(p[1]*H).toFixed(1)}`).join(' '));
  paint();
  const move=ev=>{ a.points.push([ (ev.clientX-r.left)/W, (ev.clientY-r.top)/H ]); paint(); };
  const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
    if(a.points.length<2){ edList().pop(); pl.remove(); } };
  window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
}

function dataURLtoBytes(dataUrl){ const b=atob(dataUrl.split(',')[1]); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i); return a; }

async function saveEdit(){
  const any=Object.values(ED.ann).some(l=>l&&l.length);
  if(!any){ alert('Add some text, an image or a drawing first.'); return; }
  loader(true,'Saving PDF…');
  try{
    const bytes=await applyEditsToPdf(ED.bytes, ED.ann);
    downloadNamed(new Blob([bytes],{type:'application/pdf'}), 'edited.pdf');
    document.getElementById('edHint').textContent='✓ Saved. Your edited PDF has been downloaded.';
  }catch(e){ console.error(e); alert('Could not save the PDF: '+e.message); }
  finally{ loader(false); }
}

/* Pure: apply annotations (ratio-based) onto the source PDF bytes.
   Kept separate from the DOM so the coordinate maths can be tested. */
async function applyEditsToPdf(srcBytes, ann){
  const out=await PDFLib.PDFDocument.load(srcBytes);
  const font=await out.embedFont(PDFLib.StandardFonts.Helvetica);
  const pages=out.getPages();
  const imgCache=new Map();
  for(const key of Object.keys(ann)){
    const list=ann[key]; if(!list||!list.length) continue;
    const page=pages[+key]; if(!page) continue;
    const {width:pw,height:ph}=page.getSize();
    for(const a of list){
      if(a.type==='text'){
        const fs=Math.max(4,a.fsRatio*ph); const c=hexRgb(a.color); const col=PDFLib.rgb(c.r,c.g,c.b);
        const xPt=a.x*pw, topPt=a.y*ph;
        String(a.text||'').split('\n').forEach((ln,i)=>{
          if(ln) page.drawText(ln,{x:xPt, y:ph-topPt-fs*0.8-i*fs*1.2, size:fs, font, color:col});
        });
      } else if(a.type==='image'){
        let emb=imgCache.get(a.dataUrl);
        if(!emb){ const by=dataURLtoBytes(a.dataUrl); emb=/^data:image\/png/i.test(a.dataUrl)?await out.embedPng(by):await out.embedJpg(by); imgCache.set(a.dataUrl,emb); }
        const w=a.w*pw,h=a.h*ph,x=a.x*pw,y=ph-(a.y*ph)-h;
        page.drawImage(emb,{x,y,width:w,height:h});
      } else if(a.type==='draw'){
        const c=hexRgb(a.color); const col=PDFLib.rgb(c.r,c.g,c.b); const lw=Math.max(0.6,a.sizeRatio*ph);
        for(let i=1;i<a.points.length;i++){
          const p0=a.points[i-1], p1=a.points[i];
          page.drawLine({start:{x:p0[0]*pw,y:ph-p0[1]*ph}, end:{x:p1[0]*pw,y:ph-p1[1]*ph}, thickness:lw, color:col, lineCap:PDFLib.LineCapStyle.Round});
        }
      }
    }
  }
  return await out.save();
}
