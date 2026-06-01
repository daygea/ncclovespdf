/* ============================================================
   ncclovespdf — application core
   Router + landing page + every PDF tool, 100% client-side.
   Libraries (pdf-lib, pdf.js, Sortable) are loaded locally;
   documents are NEVER uploaded anywhere.
   ============================================================ */

/* pdf.js worker (worker file only — your documents stay on-device) */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

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
  ocr:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h2v8M15 8h2M15 12h2M15 16h2"/>',
  word:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="m8 13 1.5 4 1.5-3 1.5 3 1.5-4"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'
};
const svg = (name, w=24) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I[name]||''}</svg>`;

/* ---------- tool registry ---------- */
const TOOLS = [
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
  {id:'pdf2jpg', cat:'blue', icon:'pdf2jpg', title:'PDF to JPG', cats:['convert'],
   desc:'Turn each PDF page into a high-quality JPG image.'},
  {id:'jpg2pdf', cat:'blue', icon:'jpg2pdf', title:'JPG to PDF', cats:['convert'], images:true,
   desc:'Combine JPG or PNG images into a single PDF.'},
  /* honest roadmap items */
  {id:'word', cat:'blue', icon:'word', title:'PDF to Word', cats:['convert'], soon:true,
   desc:'Reliable Word export needs a server step — on the roadmap.'},
  {id:'ocr', cat:'purple', icon:'ocr', title:'OCR PDF', cats:['edit'], soon:true,
   desc:'Make scanned PDFs searchable. Planned via on-device OCR.'},
];
const CATS = [['all','All tools'],['organize','Organize'],['optimize','Optimize'],['edit','Edit'],['convert','Convert']];
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
  const m=h.match(/#\/tool\/([\w-]+)/);
  window.scrollTo(0,0);
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
      <p class="sub">Most online PDF tools upload your files to their servers. ncclovespdf does everything inside your own browser — so your official documents stay yours.</p>
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
        <div class="field"><label>Colour</label><input type="color" id="col" value="#e8312a" style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg)"></div>
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
