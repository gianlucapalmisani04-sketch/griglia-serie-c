/* ============================================================
   Griglia Serie C — logica del sito
   ============================================================ */
'use strict';
const CFG = window.CONFIG || {};
const DEMO = !(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
const LS_KEY = 'grigliaSerieC_demo_v1';
let sb = null, DB = null, isAdmin = false, view = 'griglia', charts = [];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('on'),2200); }
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

/* ---------------- Coordinate città (distanze) ---------------- */
const COORD = {
 'Bari':[41.117,16.872],'Monopoli':[40.951,17.298],'Polignano a Mare':[40.996,17.220],'Mola di Bari':[41.060,17.088],
 'Molfetta':[41.200,16.598],'Barletta':[41.320,16.283],'Andria':[41.227,16.296],'Trani':[41.277,16.416],'Bisceglie':[41.241,16.502],
 'Corato':[41.153,16.413],'Altamura':[40.827,16.553],'Gravina in Puglia':[40.819,16.420],'Bitonto':[41.108,16.690],'Modugno':[41.083,16.783],
 'Triggiano':[41.066,16.925],'Noicattaro':[41.034,16.990],'Conversano':[40.968,17.113],'Putignano':[40.851,17.122],'Gioia del Colle':[40.799,16.923],
 'Acquaviva delle Fonti':[40.896,16.843],'Casamassima':[40.957,16.919],'Castellana Grotte':[40.887,17.166],'Fasano':[40.834,17.360],
 'Locorotondo':[40.755,17.326],'Alberobello':[40.784,17.237],'Noci':[40.792,17.127],'Giovinazzo':[41.186,16.671],'Terlizzi':[41.131,16.545],
 'Ruvo di Puglia':[41.115,16.487],'Santeramo in Colle':[40.794,16.757],'Valenzano':[41.044,16.885],'Capurso':[41.047,16.920],'Adelfia':[41.003,16.871],
 'Rutigliano':[41.010,17.005],'Turi':[40.915,17.020],'Canosa di Puglia':[41.222,16.066],'Margherita di Savoia':[41.371,16.150],
 'Trinitapoli':[41.358,16.087],'San Ferdinando di Puglia':[41.300,16.070],'Spinazzola':[40.966,16.090],'Minervino Murge':[41.084,16.077],
 'Foggia':[41.462,15.544],'San Severo':[41.686,15.379],'Cerignola':[41.266,15.894],'Manfredonia':[41.625,15.910],'Lucera':[41.506,15.336],
 'San Giovanni Rotondo':[41.705,15.727],'Brindisi':[40.632,17.936],'Mesagne':[40.558,17.808],'Ostuni':[40.729,17.578],
 'Francavilla Fontana':[40.531,17.585],'Ceglie Messapica':[40.646,17.516],'San Vito dei Normanni':[40.656,17.707],'Carovigno':[40.707,17.659],
 'Oria':[40.498,17.641],'Latiano':[40.553,17.720],'San Pietro Vernotico':[40.488,17.997],'Cisternino':[40.742,17.425],'Torre Santa Susanna':[40.467,17.740],
 'Lecce':[40.353,18.172],'Monteroni di Lecce':[40.325,18.098],'Nardò':[40.179,18.031],'Galatina':[40.175,18.170],'Gallipoli':[40.056,17.992],
 'Copertino':[40.270,18.050],'Maglie':[40.118,18.298],'Casarano':[40.010,18.162],'Tricase':[39.930,18.355],'Squinzano':[40.437,18.039],
 'Surbo':[40.394,18.135],'Galatone':[40.150,18.073],'Lequile':[40.305,18.141],'Taranto':[40.464,17.247],'Martina Franca':[40.705,17.337],
 'Grottaglie':[40.536,17.432],'Massafra':[40.587,17.112],'Manduria':[40.401,17.634],'Castellaneta':[40.629,16.938],'Ginosa':[40.577,16.757],
 'Mottola':[40.634,17.037],'Crispiano':[40.604,17.231],'Sava':[40.403,17.556]
};
const normCity = c => { if(!c) return ''; const k=Object.keys(COORD).find(x=>x.toLowerCase()===String(c).trim().toLowerCase()); return k||String(c).trim(); };
function km(a,b){
  const A=COORD[normCity(a)], B=COORD[normCity(b)]; if(!A||!B) return null;
  const R=6371, r=Math.PI/180, dLa=(B[0]-A[0])*r, dLo=(B[1]-A[1])*r;
  const h=Math.sin(dLa/2)**2+Math.cos(A[0]*r)*Math.cos(B[0]*r)*Math.sin(dLo/2)**2;
  return Math.round(2*R*Math.asin(Math.sqrt(h))*1.25); // ×1.25 ≈ percorso stradale
}

/* ---------------- Voti e fasce ---------------- */
const FASCE = [
  {max:7.4, cls:'f1', nome:'Migliorabile'},
  {max:7.7, cls:'f2', nome:'Sotto lo standard'},
  {max:8.2, cls:'f3', nome:'Standard'},
  {max:8.5, cls:'f4', nome:'Sopra lo standard'},
  {max:8.8, cls:'f5', nome:'Di qualità'},
];
const fascia = v => (v==null||v==='') ? null : FASCE.find(f=>+v<=f.max+1e-9) || FASCE[4];
const VOTI = []; for(let v=72; v<=88; v++) VOTI.push((v/10).toFixed(1));
const fmtV = v => v==null||v===''||isNaN(v) ? '–' : (+v).toFixed(2).replace(/0$/,'').replace('.',',');

/* ---------------- Fasi ---------------- */
const FASI = {
  andata:{nome:'Andata', pre:'A', ord:1}, ritorno:{nome:'Ritorno', pre:'R', ord:2},
  quarti:{nome:'Playoff – Quarti', pre:'QF', ord:3}, playout1:{nome:'Playout – Semifinali', pre:'PO', ord:3},
  semifinali:{nome:'Playoff – Semifinali', pre:'SF', ord:4}, playout2:{nome:'Playout – Finale', pre:'POF', ord:4},
  finale:{nome:'Playoff – Finale', pre:'F', ord:5}, spareggio:{nome:'Spareggio', pre:'SP', ord:6},
};

/* ---------------- Accesso ai dati ---------------- */
const arb = id => DB.arbitri.find(a=>a.id===id);
const oss = id => DB.osservatori.find(o=>o.id===id);
const sq  = id => DB.squadre.find(s=>s.id===id);
const nomeArb = (id,short) => { const a=arb(id); if(!a) return ''; return short ? `${a.cognome} ${a.nome[0]}.` : `${a.cognome} ${a.nome}`; };
const nomeOss = id => oss(id)?.nome || '';
const ossCognome = id => (oss(id)?.nome||'').split(' ').slice(0,-1).join(' ') || (oss(id)?.nome||'');
const nomeSq = id => sq(id)?.nome || id;
const sigla = id => (sq(id)?.nome||id).replace('Eurobasket Foggia','EUR FG').replace('CUS Foggia','CUS FG').replace('AP Monopoli','AP MON').replace('Seagulls Monopoli','SEAG MON').toUpperCase().slice(0,9);
const partita = g => `${nomeSq(g.casa)} – ${nomeSq(g.ospite)}`;
const partitaBreve = g => `${sigla(g.casa)}–${sigla(g.ospite)}`;
const cittaSq = id => sq(id)?.citta || '';
const fmtData = d => { if(!d) return ''; const [y,m,dd]=d.split('-'); const gg=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][new Date(d+'T12:00').getDay()]; return `${gg} ${dd}/${m}`; };
const oggi = () => new Date().toISOString().slice(0,10);

function lunedi(d){ const x=new Date(d+'T12:00'); const g=(x.getDay()+6)%7; x.setDate(x.getDate()-g); return x.toISOString().slice(0,10); }
/** Turni = giornate di campionato o weekend di playoff, in ordine cronologico */
function turni(){
  const map = new Map();
  for(const g of DB.gare){
    const f = FASI[g.fase] || {pre:'?',nome:g.fase,ord:9};
    const key = (g.fase==='andata'||g.fase==='ritorno') ? `${f.pre}${g.giornata}` : `${f.pre}-${lunedi(g.data)}`;
    if(!map.has(key)) map.set(key,{key, fase:g.fase, label:(g.fase==='andata'||g.fase==='ritorno')?`${f.pre}${g.giornata}`:`${f.pre} ${fmtData(lunedi(g.data)).slice(4)}`, nome:(g.fase==='andata'||g.fase==='ritorno')?`${g.giornata}ª ${f.nome.toLowerCase()}`:`${f.nome} (sett. ${fmtData(lunedi(g.data)).slice(4)})`, gare:[], data:g.data, dataMax:g.data});
    const t = map.get(key); t.gare.push(g);
    if(g.data < t.data) t.data = g.data; if(g.data > t.dataMax) t.dataMax = g.data;
  }
  const arr=[...map.values()].sort((a,b)=>a.data.localeCompare(b.data) || a.key.localeCompare(b.key));
  arr.forEach((t,i)=>{ t.idx=i; t.gare.sort((a,b)=>(a.data+a.ora).localeCompare(b.data+b.ora)||a.numero-b.numero); t.compilato=t.gare.some(g=>g.a1||g.a2); });
  return arr;
}
const garaDiArbitro = (t,id) => t.gare.find(g=>g.a1===id||g.a2===id);
const collega = (g,id) => g.a1===id ? g.a2 : g.a1;
function votoDi(g,id){ const v = g.a1===id ? g.voto1 : g.a2===id ? g.voto2 : null; return v==null||v==='' ? null : +v; }

/* ---------------- Caricamento / salvataggio ---------------- */
function migra(d){
  const s = clone(window.SEED);
  if(!d || !d.arbitri) return s;
  d.impostazioni = Object.assign({}, s.impostazioni, d.impostazioni||{});
  d.osservatori ||= []; d.squadre ||= []; d.gare ||= [];
  return d;
}
async function carica(){
  if(DEMO){ let d=null; try{ d=JSON.parse(lsGet(LS_KEY)||'null'); }catch(e){} DB=migra(d); return; }
  const { data, error } = await sb.from('griglia').select('contenuto,aggiornato').eq('id',1).maybeSingle();
  if(error){ console.error(error); toast('Errore di caricamento dati'); DB=migra(null); return; }
  DB = migra(data?.contenuto); DB._agg = data?.aggiornato;
}
let saveTimer=null, saving=false;
function salva(){ clearTimeout(saveTimer); setStato('Salvataggio…'); saveTimer=setTimeout(salvaOra, 600); }
async function salvaOra(){
  const d = clone(DB); delete d._agg;
  if(DEMO){ lsSet(LS_KEY, JSON.stringify(d)); setStato('Salvato (demo)'); return; }
  saving=true;
  const { error } = await sb.from('griglia').upsert({id:1, contenuto:d});
  saving=false;
  if(error){ console.error(error); setStato('Errore salvataggio'); toast('Non salvato: '+error.message); }
  else { DB._agg=new Date().toISOString(); setStato('Salvato ✓'); }
}
function setStato(t){ const el=$('#stato'); el.textContent=t; el.className='pill'+(isAdmin?' admin':''); }

/* ---------------- Login ---------------- */
async function initAuth(){
  if(DEMO){ isAdmin=true; $('#btnLogin').classList.add('hide'); return; }
  const { data } = await sb.auth.getSession(); isAdmin = !!data.session;
  sb.auth.onAuthStateChange((_e,s)=>{ const was=isAdmin; isAdmin=!!s; if(was!==isAdmin){ aggiornaAdminUI(); render(); } });
}
function aggiornaAdminUI(){
  document.querySelectorAll('.adminOnly').forEach(el=>el.classList.toggle('hide',!isAdmin));
  $('#btnLogin').textContent = isAdmin ? 'Esci' : 'Accedi';
  setStato(DEMO ? 'Modalità demo' : isAdmin ? 'Amministratore' : 'Sola lettura');
  if(!isAdmin && view==='gestione') view='griglia';
}
$('#btnLogin').onclick = async () => {
  if(isAdmin){ await sb.auth.signOut(); toast('Disconnesso'); return; }
  $('#lgErr').textContent=''; $('#dlgLogin').showModal();
};
$('#formLogin').onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email:$('#lgEmail').value.trim(), password:$('#lgPwd').value });
  if(error){ $('#lgErr').textContent='Accesso non riuscito: controlla email e password.'; return; }
  $('#dlgLogin').close(); toast('Accesso effettuato');
};
$('#btnTema').onclick = () => {
  const r=document.documentElement; const dark = r.dataset.theme ? r.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark'; lsSet('tema', r.dataset.theme); render();
};
if(lsGet('tema')) document.documentElement.dataset.theme = lsGet('tema');

/* ---------------- Navigazione ---------------- */
$('#nav').onclick = e => { const b=e.target.closest('button'); if(!b) return; view=b.dataset.v; lsSet('vista',view); render(); };
function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
  charts.forEach(c=>c.destroy()); charts=[];
  const m=$('#main');
  const banner = DEMO ? `<div class="banner"><b>Modalità demo:</b> i dati vengono salvati solo in questo browser. Per pubblicare il sito con i dati condivisi completa la configurazione di Supabase in <code>config.js</code>.</div>` : '';
  const V = {griglia:vGriglia, giornate:vGiornate, previsione:vPrevisione, riepilogo:vRiepilogo, stats:vStats, matrice:vMatrice, gestione:vGestione}[view] || vGriglia;
  m.innerHTML = banner; const c=document.createElement('div'); m.appendChild(c); V(c);
}

/* ============================================================
   VISTA: GRIGLIA (come il vecchio Excel)
   ============================================================ */
let filtroGriglia = lsGet('filtroGriglia') || 'tutte';
function vGriglia(c){
  const T = turni().filter(t => filtroGriglia==='tutte' || (filtroGriglia==='po' ? !['andata','ritorno'].includes(t.fase) : t.fase===filtroGriglia));
  const me = DB.impostazioni.mioArbitro;
  const arbs = [...DB.arbitri].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  let h = `<div class="card"><div class="row" style="justify-content:space-between">
    <div><h2>Griglia designazioni</h2><p class="desc" style="margin:0">Ogni cella: partita, osservatore e voto. Il colore segue la fascia del voto. ${isAdmin?'<b>Tocca una cella o un’intestazione per modificare.</b>':''}</p></div>
    <div class="row">${['tutte:Tutte','andata:Andata','ritorno:Ritorno','po:Playoff/Playout'].map(x=>{const [k,l]=x.split(':');return `<button class="btn small ${filtroGriglia===k?'primary':''}" data-fg="${k}">${l}</button>`}).join('')}</div>
  </div>
  <div class="legend" style="margin:12px 0">${FASCE.map(f=>`<span class="${f.cls}">${f.nome}</span>`).join('')}<span class="seg" style="background:var(--surface2)">Senza voto</span><span style="background:var(--rest);color:var(--muted)">Riposo</span></div>`;
  if(!T.length){
    h += `<p class="muted">Nessuna gara in questa fase per ora. ${isAdmin?'Le gare di playoff/playout si aggiungono dalla sezione Gestione, quando saranno note.':'Le gare compariranno quando saranno inserite.'}</p></div>`;
    c.innerHTML=h;
    c.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{filtroGriglia=b.dataset.fg; lsSet('filtroGriglia',filtroGriglia); render();});
    return;
  }
  h += `<div class="tablewrap"><table class="grid"><thead><tr><th class="ref">Arbitro</th>${T.map(t=>`<th title="${esc(t.nome)}" ${isAdmin?`data-turno="${t.key}" style="cursor:pointer"`:''}>${esc(t.label)}<div class="small muted" style="font-weight:400">${fmtData(t.data).slice(4)}</div></th>`).join('')}<th class="num">Gare</th><th class="num">Oss.</th></tr></thead><tbody>`;
  for(const a of arbs){
    let ng=0, no=0;
    h += `<tr class="${a.id===me?'me':''}"><td class="ref">${esc(a.cognome)} ${esc(a.nome.split(' ')[0])}${a.esordiente?' <span class="pill" title="Esordiente in Serie C">E</span>':''}</td>`;
    for(const t of T){
      const g = garaDiArbitro(t,a.id);
      if(g){
        ng++; if(g.oss) no++;
        const v = votoDi(g,a.id), f = fascia(v);
        const cls = f ? f.cls : 'seg';
        const tip = `${partita(g)} · ${fmtData(g.data)} ${g.ora}\nCollega: ${nomeArb(collega(g,a.id))||'—'}\nOsservatore: ${nomeOss(g.oss)||'nessuno'}${v!=null?`\nVoto: ${fmtV(v)} (${f.nome})`:''}`;
        h += `<td><span class="cell ${cls} ${isAdmin?'click':''}" data-gid="${g.id}" title="${esc(tip)}"><b>${esc(partitaBreve(g))}</b><span class="o">${g.oss?esc(ossCognome(g.oss)):'<i>no oss.</i>'}${v!=null?' · '+fmtV(v):''}</span></span></td>`;
      } else {
        h += `<td>${t.compilato ? '<span class="cell rest">RIPOSO</span>' : '<span class="cell"></span>'}</td>`;
      }
    }
    h += `<td class="num"><b>${ng}</b></td><td class="num">${no}</td></tr>`;
  }
  h += `<tr><td class="ref muted small">Designati / osservati</td>${T.map(t=>{const d=t.gare.reduce((s,g)=>s+(g.a1?1:0)+(g.a2?1:0),0);const o=t.gare.filter(g=>g.oss).length;return `<td class="small muted" style="text-align:center;padding:6px">${d} / ${o}</td>`}).join('')}<td></td><td></td></tr>`;
  h += `</tbody></table></div></div>`;
  c.innerHTML = h;
  c.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{filtroGriglia=b.dataset.fg; lsSet('filtroGriglia',filtroGriglia); render();});
  if(isAdmin){
    c.querySelectorAll('.cell[data-gid]').forEach(el=>el.onclick=()=>apriGara(el.dataset.gid));
    c.querySelectorAll('th[data-turno]').forEach(el=>el.onclick=()=>{ turnoSel=el.dataset.turno; view='giornate'; render(); });
  }
}

/* ============================================================
   FORM GARA (usato in Giornate e nel popup)
   ============================================================ */
function opzioni(list, sel, vuoto='—'){ return `<option value="">${vuoto}</option>` + list.map(([v,l])=>`<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(l)}</option>`).join(''); }
function avvisiGara(g, T){
  const out=[]; const t = T.find(x=>x.gare.includes(g)); if(!t) return out;
  for(const id of [g.a1,g.a2].filter(Boolean)){
    const a=arb(id); if(!a) continue;
    if(t.gare.filter(x=>x.a1===id||x.a2===id).length>1) out.push(`${a.cognome}: designato due volte nella stessa giornata`);
    const vincoli = vincoliArbitro(id, t, T);
    for(const s of [g.casa,g.ospite]) if(vincoli.recenti.has(s)) out.push(`${a.cognome}: ha già arbitrato ${nomeSq(s)} nelle ultime ${DB.impostazioni.finestra} giornate`);
    if(cittaVietata(a,g)) out.push(`${a.cognome}: squadra della propria città (${a.citta})`);
  }
  if(g.a1 && g.a1===g.a2) out.push('Stesso arbitro inserito due volte');
  return out;
}
function formGara(g, T){
  const arbOpts = [...DB.arbitri].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(a=>[a.id,`${a.cognome} ${a.nome}`]);
  const ossOpts = DB.osservatori.map(o=>[o.id,o.nome]);
  const votoOpts = VOTI.map(v=>[v,`${v.replace('.',',')} · ${fascia(v).nome}`]);
  const dis = isAdmin ? '' : 'disabled';
  const av = avvisiGara(g,T);
  return `<div class="match" data-gid="${g.id}">
    <div class="head"><div><div class="teams">${esc(partita(g))}</div>
      <div class="meta">Gara ${g.numero||'—'} · ${fmtData(g.data)} ore ${esc(g.ora||'')} · ${esc(g.campo||'')} (${esc(cittaSq(g.casa))})</div></div>
      ${isAdmin?`<div class="row small"><input type="date" data-k="data" value="${esc(g.data)}" title="Data (per posticipi)"><input type="time" data-k="ora" value="${esc(g.ora)}"></div>`:''}</div>
    <div class="fields">
      <label class="f">1° arbitro<select data-k="a1" ${dis}>${opzioni(arbOpts,g.a1)}</select></label>
      <label class="f">Voto 1° arb.<select data-k="voto1" ${dis}>${opzioni(votoOpts,g.voto1==null?'':(+g.voto1).toFixed(1))}</select></label>
      <label class="f">2° arbitro<select data-k="a2" ${dis}>${opzioni(arbOpts,g.a2)}</select></label>
      <label class="f">Voto 2° arb.<select data-k="voto2" ${dis}>${opzioni(votoOpts,g.voto2==null?'':(+g.voto2).toFixed(1))}</select></label>
      <label class="f">Osservatore<select data-k="oss" ${dis}>${opzioni(ossOpts,g.oss,'Nessuno')}</select></label>
      <label class="f">Note<input type="text" data-k="note" value="${esc(g.note)}" ${dis} placeholder="${isAdmin?'es. risultato, episodi…':''}"></label>
    </div>
    ${av.length?`<div class="small" style="color:var(--warn)">⚠ ${av.map(esc).join(' · ')}</div>`:''}
  </div>`;
}
function collegaForm(root, after){
  root.addEventListener('change', e=>{
    const el=e.target; const box=el.closest('.match'); if(!box||!el.dataset.k||!isAdmin) return;
    const g=DB.gare.find(x=>x.id===box.dataset.gid); const k=el.dataset.k;
    let v=el.value; if(k==='voto1'||k==='voto2') v = v===''?null:+v;
    g[k]=v; salva(); after && after(g);
  });
}
function apriGara(gid){
  const g=DB.gare.find(x=>x.id===gid); const T=turni(); const d=$('#dlgGara');
  d.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><h2 style="margin:0;font-size:16px">Modifica gara</h2><button class="btn small" id="chiudiG">Chiudi</button></div><div id="fgBox">${formGara(g,T)}</div>`;
  d.style.maxWidth='min(640px,94vw)';
  $('#chiudiG').onclick=()=>{ d.close(); render(); };
  d.onclose = ()=>render();
  if(!d._linked){ collegaForm(d, g2=>{ $('#fgBox').innerHTML=formGara(g2,turni()); }); d._linked=true; }
  d.showModal();
}

/* ============================================================
   VISTA: GIORNATE
   ============================================================ */
let turnoSel = null;
function turnoCorrente(T){
  const o=oggi();
  return (T.find(t=>t.dataMax>=o) || T[T.length-1]);
}
function vGiornate(c){
  const T=turni(); if(!turnoSel || !T.find(t=>t.key===turnoSel)) turnoSel = turnoCorrente(T)?.key;
  const t=T.find(x=>x.key===turnoSel); const i=T.indexOf(t);
  const riposano = DB.arbitri.filter(a=>!garaDiArbitro(t,a.id)).sort((a,b)=>a.cognome.localeCompare(b.cognome));
  c.innerHTML = `<div class="card">
    <div class="row" style="justify-content:space-between">
      <div class="row"><button class="btn" id="prevT" ${i<=0?'disabled':''}>‹</button>
      <select id="selT">${T.map(x=>`<option value="${x.key}" ${x.key===turnoSel?'selected':''}>${esc(x.nome)} · ${fmtData(x.data)}</option>`).join('')}</select>
      <button class="btn" id="nextT" ${i>=T.length-1?'disabled':''}>›</button></div>
      <span class="muted small">${isAdmin?'Le modifiche si salvano da sole':'Sola lettura'}</span>
    </div></div>
    <div id="gareBox">${t.gare.map(g=>formGara(g,T)).join('')}</div>
    <div class="card"><h2>A riposo in questa giornata</h2><p class="desc">${t.compilato?'Arbitri senza designazione.':'Nessuna designazione inserita ancora.'}</p>
    <div class="row">${t.compilato?riposano.map(a=>`<span class="pill">${esc(a.cognome)} ${esc(a.nome[0])}.</span>`).join(''):''}</div></div>`;
  $('#selT').onchange=e=>{turnoSel=e.target.value; render();};
  $('#prevT').onclick=()=>{turnoSel=T[i-1].key; render();};
  $('#nextT').onclick=()=>{turnoSel=T[i+1].key; render();};
  collegaForm($('#gareBox'), ()=>{ const y=scrollY; render(); scrollTo(0,y); });
}

/* ============================================================
   REGOLE E PREVISIONE
   ============================================================ */
function cittaVietata(a, g){
  if(!DB.impostazioni.escludiCitta || !a?.citta) return false;
  const cc=normCity(cittaSq(g.casa)), co=normCity(cittaSq(g.ospite)), ca=normCity(a.citta);
  if(cc!==ca && co!==ca) return false;
  if(DB.impostazioni.consentiDerby && cc===co) return false;
  return true;
}
/** Squadre arbitrate nelle ultime N giornate prima del turno t, e conteggi stagionali */
function vincoliArbitro(id, t, T){
  const N = +DB.impostazioni.finestra || 3;
  const prima = T.filter(x=>x.idx < t.idx);
  const recenti = new Set(), conteggio = {};
  prima.slice(-N).forEach(x=>{ const g=garaDiArbitro(x,id); if(g){ recenti.add(g.casa); recenti.add(g.ospite); }});
  prima.forEach(x=>{ const g=garaDiArbitro(x,id); if(g){ conteggio[g.casa]=(conteggio[g.casa]||0)+1; conteggio[g.ospite]=(conteggio[g.ospite]||0)+1; }});
  return { recenti, conteggio };
}
/** Stato di riposo: quante giornate consecutive (tra quelle compilate) ha riposato prima di t */
function statoRiposo(id, t, T){
  const prev = T.filter(x=>x.idx<t.idx && x.compilato);
  if(!prev.length) return null;
  let k=0; for(let i=prev.length-1;i>=0;i--){ if(garaDiArbitro(prev[i],id)) break; k++; }
  return Math.min(k,2);
}
const PRIOR = {0:0.35, 1:0.80, 2:0.92};
const DESCR_STATO = {0:'ha arbitrato la giornata precedente', 1:'ha riposato la giornata precedente', 2:'riposa da 2+ giornate'};
/** Frequenze reali di designazione per stato (stimate dalla stagione, mescolate con il "prior") */
function tassiRiposo(T){
  const n={0:0,1:0,2:0}, d={0:0,1:0,2:0};
  for(const t of T.filter(x=>x.compilato)){
    for(const a of DB.arbitri){ const s=statoRiposo(a.id,t,T); if(s==null) continue; n[s]++; if(garaDiArbitro(t,a.id)) d[s]++; }
  }
  const K=8, r={}; for(const s of [0,1,2]) r[s]=(d[s]+PRIOR[s]*K)/(n[s]+K);
  return { r, n, d };
}
function rng(seed){ let a=0; for(const ch of String(seed)) a=(a*31+ch.charCodeAt(0))|0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function compatibilita(a, g, t, T){
  const v = vincoliArbitro(a.id, t, T);
  if(v.recenti.has(g.casa) || v.recenti.has(g.ospite)) return {w:0, motivo:`squadra arbitrata nelle ultime ${DB.impostazioni.finestra} giornate`};
  if(cittaVietata(a,g)) return {w:0, motivo:'squadra della propria città'};
  const dist = km(a.citta, cittaSq(g.casa));
  const wd = dist==null ? 0.5 : Math.exp(-dist/90);
  const fam = (v.conteggio[g.casa]||0) + (v.conteggio[g.ospite]||0);
  return {w: wd/(1+0.6*fam), dist, fam};
}
function simula(t, T, N=3000){
  const ind = new Set((DB.indisponibili||{})[t.key]||[]);
  const fissi = new Set(); t.gare.forEach(g=>{ if(g.a1) fissi.add(g.a1); if(g.a2) fissi.add(g.a2); });
  const tassi = tassiRiposo(T).r;
  const pool = DB.arbitri.filter(a=>!fissi.has(a.id) && !ind.has(a.id));
  const wRip = Object.fromEntries(pool.map(a=>{ const s=statoRiposo(a.id,t,T); return [a.id, s==null ? 0.55 : tassi[s]]; }));
  const comp = {}; pool.forEach(a=>{ comp[a.id]={}; t.gare.forEach(g=>comp[a.id][g.id]=compatibilita(a,g,t,T)); });
  const slot0 = Object.fromEntries(t.gare.map(g=>[g.id, 2-(g.a1?1:0)-(g.a2?1:0)]));
  const occ0 = Object.fromEntries(t.gare.map(g=>[g.id, [g.a1,g.a2].filter(Boolean)]));
  const S = Object.values(slot0).reduce((s,x)=>s+x,0);
  const cont = Object.fromEntries(pool.map(a=>[a.id,{des:0, g:{}}]));
  const R = rng(t.key+DB.arbitri.length+S);
  if(S>0) for(let it=0; it<N; it++){
    const slot = {...slot0}; const occ = Object.fromEntries(Object.entries(occ0).map(([k,v])=>[k,[...v]]));
    const ordine = pool.map(a=>({a, k: Math.pow(R(), 1/Math.max(wRip[a.id],1e-6))})).sort((x,y)=>y.k-x.k).map(x=>x.a);
    let presi = ordine.slice(0,S), riserva = ordine.slice(S), liberi = S;
    const fattibili = a => t.gare.filter(g=>slot[g.id]>0 && comp[a.id][g.id].w>0);
    presi.sort((x,y)=>fattibili(x).length - fattibili(y).length);
    const coda=[...presi];
    while(coda.length && liberi>0){
      const a = coda.shift(); const fg = fattibili(a);
      if(!fg.length){ if(riserva.length) coda.push(riserva.shift()); continue; }
      const pesi = fg.map(g=>{ let w=comp[a.id][g.id].w; for(const o of occ[g.id]){ const d=km(a.citta, arb(o)?.citta); if(d!=null && d<25) w*=1.5; } return w; });
      let u=R()*pesi.reduce((s,x)=>s+x,0), j=0; while(j<pesi.length-1 && (u-=pesi[j])>0) j++;
      const g=fg[j]; slot[g.id]--; occ[g.id].push(a.id); liberi--;
      cont[a.id].des++; cont[a.id].g[g.id]=(cont[a.id].g[g.id]||0)+1;
    }
  }
  const res = {};
  for(const a of DB.arbitri){
    if(fissi.has(a.id)){ const g=garaDiArbitro(t,a.id); res[a.id]={fisso:true, pDes:1, pg:{[g.id]:1}}; continue; }
    if(ind.has(a.id)){ res[a.id]={indisp:true, pDes:0, pg:{}}; continue; }
    const c=cont[a.id]; res[a.id]={ pDes: S? c.des/N : 0, pg: Object.fromEntries(Object.entries(c.g).map(([k,v])=>[k,v/N])), stato: statoRiposo(a.id,t,T), comp: comp[a.id] };
  }
  return { res, S, tassi };
}

/* ============================================================
   VISTA: PREVISIONE
   ============================================================ */
let prevArb=null, prevTurno=null;
const pct = x => `${Math.round(x*100)}%`;
function vPrevisione(c){
  const T=turni(); if(!T.length){ c.innerHTML='<p>Nessuna gara.</p>'; return; }
  prevArb ||= DB.impostazioni.mioArbitro || DB.arbitri[0].id;
  if(!prevTurno || !T.find(t=>t.key===prevTurno)){ const o=oggi(); prevTurno=(T.find(t=>t.dataMax>=o && t.gare.some(g=>!g.a1||!g.a2)) || turnoCorrente(T)).key; }
  const t=T.find(x=>x.key===prevTurno);
  const sim = simula(t,T); const a=arb(prevArb); const r=sim.res[prevArb];
  const arbOpts=[...DB.arbitri].sort((x,y)=>x.cognome.localeCompare(y.cognome));
  const righe = t.gare.map(g=>{
    const p = r.pg[g.id]||0; const cp = r.comp?.[g.id];
    const motivo = r.fisso ? (garaDiArbitro(t,prevArb)===g?'già designato':'') : r.indisp ? 'indisponibile' : (cp && cp.w===0 ? cp.motivo : (g.a1&&g.a2 ? 'gara già completa' : ''));
    const dist = km(a.citta, cittaSq(g.casa));
    return {g,p,motivo,dist};
  }).sort((x,y)=>y.p-x.p);
  const stato = r.fisso ? 'già designato' : r.indisp ? 'indisponibile' : r.stato==null ? 'nessuno storico ancora' : DESCR_STATO[r.stato];
  let h = `<div class="card"><h2>Partita più probabile</h2>
    <p class="desc">Stima basata su: chi ha riposato (in media si riposa una giornata ogni due), squadre arbitrate nelle ultime ${DB.impostazioni.finestra} giornate, squadre della propria città, distanza dal campo e combinazione con le designazioni già note degli altri arbitri.</p>
    <div class="row" style="margin-bottom:12px">
      <label class="f">Arbitro<select id="pArb">${arbOpts.map(x=>`<option value="${x.id}" ${x.id===prevArb?'selected':''}>${esc(x.cognome)} ${esc(x.nome)}</option>`).join('')}</select></label>
      <label class="f">Giornata<select id="pTur">${T.map(x=>`<option value="${x.key}" ${x.key===prevTurno?'selected':''}>${esc(x.nome)} · ${fmtData(x.data)}</option>`).join('')}</select></label>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v" style="color:var(--accent)">${pct(r.pDes)}</div><div class="l">Probabilità di essere designato</div></div>
      <div class="kpi"><div class="v">${pct(1-r.pDes)}</div><div class="l">Probabilità di riposo</div></div>
      <div class="kpi"><div class="v" style="font-size:15px;padding-top:6px">${esc(stato)}</div><div class="l">Situazione</div></div>
      <div class="kpi"><div class="v">${esc(a.citta||'?')}</div><div class="l">Città usata per le distanze${a.cittaConfermata?'':' (da verificare)'}</div></div>
    </div>
    <div class="tablewrap"><table><thead><tr><th>Partita</th><th>Data</th><th class="num">Km</th><th>Probabilità</th><th>Note</th></tr></thead><tbody>
    ${righe.map(x=>`<tr class="${x.motivo&&x.p===0?'excl':''}"><td>${esc(partita(x.g))}</td><td>${fmtData(x.g.data)} ${esc(x.g.ora)}</td><td class="num">${x.dist??'?'}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap"><div class="bar" style="width:90px"><i style="width:${Math.round(x.p*100)}%"></i></div><b>${pct(x.p)}</b></div></td>
      <td class="small muted">${esc(x.motivo)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="small muted" style="margin-bottom:0">Le probabilità delle gare sommate danno la probabilità di essere designato; il resto è la probabilità di riposo. Le stime migliorano man mano che inserisci le designazioni.</p>
  </div>`;
  // panoramica
  const tutti = DB.arbitri.map(x=>{ const rr=sim.res[x.id]; const best=Object.entries(rr.pg).sort((p,q)=>q[1]-p[1])[0]; return {x, rr, best}; }).sort((p,q)=>q.rr.pDes-p.rr.pDes);
  const ind = new Set((DB.indisponibili||{})[t.key]||[]);
  h += `<div class="card"><h2>Panoramica della giornata</h2><p class="desc">${sim.S} posti ancora da assegnare su ${t.gare.length*2}. Frequenze di designazione stimate: dopo una gara ${pct(sim.tassi[0])}, dopo un riposo ${pct(sim.tassi[1])}, dopo 2+ riposi ${pct(sim.tassi[2])}.${isAdmin?' Spunta chi sa già di essere indisponibile.':''}</p>
  <div class="tablewrap"><table><thead><tr>${isAdmin?'<th>Indisp.</th>':''}<th>Arbitro</th><th>Situazione</th><th>Designato</th><th>Gara più probabile</th></tr></thead><tbody>
  ${tutti.map(({x,rr,best})=>{ const g=best&&DB.gare.find(y=>y.id===best[0]); return `<tr class="${x.id===DB.impostazioni.mioArbitro?'me':''}">${isAdmin?`<td><input type="checkbox" data-ind="${x.id}" ${ind.has(x.id)?'checked':''} ${rr.fisso?'disabled':''}></td>`:''}
    <td>${esc(x.cognome)} ${esc(x.nome.split(' ')[0])}</td><td class="small muted">${rr.fisso?'già designato':rr.indisp?'indisponibile':rr.stato==null?'—':DESCR_STATO[rr.stato]}</td>
    <td><div class="row" style="gap:6px;flex-wrap:nowrap"><div class="bar" style="width:70px"><i style="width:${Math.round(rr.pDes*100)}%"></i></div>${pct(rr.pDes)}</div></td>
    <td class="small">${g?`${esc(partitaBreve(g))} <span class="muted">(${pct(best[1])})</span>`:'<span class="muted">—</span>'}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
  c.innerHTML=h;
  $('#pArb').onchange=e=>{prevArb=e.target.value; render();};
  $('#pTur').onchange=e=>{prevTurno=e.target.value; render();};
  c.querySelectorAll('[data-ind]').forEach(el=>el.onchange=()=>{
    DB.indisponibili ||= {}; const L=new Set(DB.indisponibili[t.key]||[]);
    el.checked ? L.add(el.dataset.ind) : L.delete(el.dataset.ind); DB.indisponibili[t.key]=[...L]; salva(); render();
  });
}

/* ============================================================
   STATISTICHE PER ARBITRO (usate da Riepilogo e Statistiche)
   ============================================================ */
function statArbitro(id, T){
  const s = {gare:[], A:0, R:0, PO:0, oss:0, voti:[], riposi:0, squadre:{}, colleghi:{}, osservatori:{}, km:0};
  const a = arb(id);
  for(const t of T){
    const g = garaDiArbitro(t,id);
    if(!g){ if(t.compilato) s.riposi++; continue; }
    s.gare.push({g,t});
    if(g.fase==='andata') s.A++; else if(g.fase==='ritorno') s.R++; else s.PO++;
    if(g.oss){ s.oss++; s.osservatori[g.oss]=(s.osservatori[g.oss]||0)+1; }
    const v=votoDi(g,id); if(v!=null) s.voti.push({v,t,g});
    for(const q of [g.casa,g.ospite]) s.squadre[q]=(s.squadre[q]||0)+1;
    const c=collega(g,id); if(c) s.colleghi[c]=(s.colleghi[c]||0)+1;
    const d=km(a?.citta, cittaSq(g.casa)); if(d) s.km+=2*d;
  }
  s.n = s.gare.length;
  s.media = s.voti.length ? s.voti.reduce((x,y)=>x+y.v,0)/s.voti.length : null;
  s.ultimo = s.voti.length ? s.voti[s.voti.length-1].v : null;
  s.max = s.voti.length ? Math.max(...s.voti.map(x=>x.v)) : null;
  s.cop = s.n ? s.oss/s.n : 0;
  return s;
}
const topN = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1]);

/* ============================================================
   VISTA: RIEPILOGO
   ============================================================ */
let sortRiep = {k:'cognome', dir:1};
function vRiepilogo(c){
  const T=turni(); const me=DB.impostazioni.mioArbitro;
  const rows = DB.arbitri.map(a=>({a, s:statArbitro(a.id,T)}));
  const val = {cognome:r=>r.a.cognome, n:r=>r.s.n, A:r=>r.s.A, R:r=>r.s.R, PO:r=>r.s.PO, oss:r=>r.s.oss, cop:r=>r.s.cop, media:r=>r.s.media??-1, ultimo:r=>r.s.ultimo??-1, riposi:r=>r.s.riposi};
  rows.sort((x,y)=>{ const a=val[sortRiep.k](x), b=val[sortRiep.k](y); return (typeof a==='string'?a.localeCompare(b):a-b)*sortRiep.dir; });
  const th = (k,l,num=true) => `<th class="${num?'num':''}" data-s="${k}" style="cursor:pointer">${l}${sortRiep.k===k?(sortRiep.dir>0?' ▲':' ▼'):''}</th>`;
  c.innerHTML = `<div class="card"><h2>Riepilogo arbitri</h2><p class="desc">Tocca un’intestazione per ordinare. La copertura è la percentuale di gare con osservatore.</p>
  <div class="tablewrap"><table><thead><tr>${th('cognome','Arbitro',false)}<th>Città</th>${th('n','Gare')}${th('A','And.')}${th('R','Rit.')}${th('PO','PO')}${th('riposi','Riposi')}${th('oss','Osserv.')}${th('cop','% cop.')}${th('media','Media voto')}${th('ultimo','Ultimo')}<th>Squadra più arbitrata</th></tr></thead><tbody>
  ${rows.map(({a,s})=>{ const f=fascia(s.media); const fu=fascia(s.ultimo); const ts=topN(s.squadre)[0]; return `<tr class="${a.id===me?'me':''}">
    <td><b>${esc(a.cognome)}</b> ${esc(a.nome)}</td><td class="small muted">${esc(a.citta)}</td>
    <td class="num"><b>${s.n}</b></td><td class="num">${s.A}</td><td class="num">${s.R}</td><td class="num">${s.PO}</td><td class="num">${s.riposi}</td><td class="num">${s.oss}</td>
    <td class="num">${s.n?Math.round(s.cop*100)+'%':'–'}</td>
    <td class="num"><span class="${f?f.cls:''}" style="padding:2px 6px;border-radius:5px">${fmtV(s.media)}</span></td>
    <td class="num"><span class="${fu?fu.cls:''}" style="padding:2px 6px;border-radius:5px">${fmtV(s.ultimo)}</span></td>
    <td class="small">${ts?`${esc(nomeSq(ts[0]))} (${ts[1]})`:'–'}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
  c.querySelectorAll('[data-s]').forEach(el=>el.onclick=()=>{ const k=el.dataset.s; sortRiep = {k, dir: sortRiep.k===k ? -sortRiep.dir : (k==='cognome'?1:-1)}; render(); });
}

/* ============================================================
   VISTA: STATISTICHE
   ============================================================ */
let statArb=null;
function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function vStats(c){
  const T=turni(); statArb ||= DB.impostazioni.mioArbitro || DB.arbitri[0].id;
  const s=statArbitro(statArb,T); const a=arb(statArb);
  const arbOpts=[...DB.arbitri].sort((x,y)=>x.cognome.localeCompare(y.cognome));
  const fm=fascia(s.media);
  // classifica e osservatori globali
  const tutti = DB.arbitri.map(x=>({x,s:statArbitro(x.id,T)}));
  const classifica = tutti.filter(r=>r.s.media!=null).sort((p,q)=>q.s.media-p.s.media);
  const ossGlob = {}; DB.gare.forEach(g=>{ if(g.oss) ossGlob[g.oss]=(ossGlob[g.oss]||0)+1; });
  const sqTot = topN(s.squadre);
  c.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2>Statistiche personali</h2>
    <select id="sArb">${arbOpts.map(x=>`<option value="${x.id}" ${x.id===statArb?'selected':''}>${esc(x.cognome)} ${esc(x.nome)}</option>`).join('')}</select></div>
    <div class="kpis" style="margin-top:12px">
      <div class="kpi"><div class="v">${s.n}</div><div class="l">Gare dirette</div></div>
      <div class="kpi"><div class="v">${s.oss} <span class="small muted">(${s.n?Math.round(s.cop*100):0}%)</span></div><div class="l">Volte osservato</div></div>
      <div class="kpi"><div class="v">${fmtV(s.media)}</div><div class="l">Media voto${fm?' · '+fm.nome:''}</div></div>
      <div class="kpi"><div class="v">${fmtV(s.max)}</div><div class="l">Miglior voto</div></div>
      <div class="kpi"><div class="v">${s.riposi}</div><div class="l">Riposi</div></div>
      <div class="kpi"><div class="v">${s.km.toLocaleString('it-IT')}</div><div class="l">Km stimati (andata e ritorno)</div></div>
    </div>
    <div class="grid2">
      <div><h2 style="font-size:13px">Andamento voti</h2>${s.voti.length?'<div class="chartbox"><canvas id="chVoti"></canvas></div>':'<p class="muted small">Nessun voto inserito.</p>'}</div>
      <div><h2 style="font-size:13px">Da chi è stato osservato</h2>${s.oss?'<div class="chartbox"><canvas id="chOss"></canvas></div>':'<p class="muted small">Nessuna osservazione.</p>'}</div>
    </div>
    <div class="grid2" style="margin-top:16px">
      <div><h2 style="font-size:13px">Squadre arbitrate</h2>${sqTot.length?`<table>${sqTot.map(([k,v])=>`<tr><td>${esc(nomeSq(k))}</td><td style="width:60%"><div class="bar"><i style="width:${v/sqTot[0][1]*100}%"></i></div></td><td class="num">${v}</td></tr>`).join('')}</table>`:'<p class="muted small">—</p>'}</div>
      <div><h2 style="font-size:13px">Colleghi</h2>${Object.keys(s.colleghi).length?`<table>${topN(s.colleghi).map(([k,v])=>`<tr><td>${esc(nomeArb(k))}</td><td class="num">${v}</td></tr>`).join('')}</table>`:'<p class="muted small">—</p>'}
      <h2 style="font-size:13px;margin-top:14px">Ultime gare</h2>${s.gare.length?`<table>${s.gare.slice(-6).reverse().map(({g,t})=>{const v=votoDi(g,statArb);const f=fascia(v);return `<tr><td class="small">${esc(t.label)}</td><td>${esc(partitaBreve(g))}</td><td class="small muted">${esc(ossCognome(g.oss)||'—')}</td><td class="num"><span class="${f?f.cls:''}" style="padding:2px 6px;border-radius:5px">${fmtV(v)}</span></td></tr>`}).join('')}</table>`:'<p class="muted small">—</p>'}</div>
    </div></div>
  <div class="grid2">
    <div class="card"><h2>Classifica media voti</h2><p class="desc">Solo arbitri con almeno un voto inserito.</p>
      ${classifica.length?`<table>${classifica.map((r,i)=>{const f=fascia(r.s.media);return `<tr class="${r.x.id===DB.impostazioni.mioArbitro?'me':''}"><td class="num muted">${i+1}</td><td>${esc(r.x.cognome)} ${esc(r.x.nome[0])}.</td><td class="num small muted">${r.s.voti.length} vot${r.s.voti.length===1?'o':'i'}</td><td class="num"><span class="${f.cls}" style="padding:2px 6px;border-radius:5px">${fmtV(r.s.media)}</span></td></tr>`}).join('')}</table>`:'<p class="muted small">Ancora nessun voto.</p>'}</div>
    <div class="card"><h2>Osservatori più presenti</h2><p class="desc">Gare osservate da ciascuno in stagione.</p>
      ${Object.keys(ossGlob).length?'<div class="chartbox" style="height:300px"><canvas id="chOssG"></canvas></div>':'<p class="muted small">Ancora nessuna osservazione.</p>'}</div>
  </div>`;
  $('#sArb').onchange=e=>{statArb=e.target.value; render();};
  if(!window.Chart) return;
  Chart.defaults.font.family='Inter, system-ui, sans-serif'; Chart.defaults.color=css('--muted'); Chart.defaults.borderColor=css('--line'); Chart.defaults.maintainAspectRatio=false; Chart.defaults.datasets.bar.maxBarThickness=22;
  const acc=css('--accent');
  if(s.voti.length) charts.push(new Chart($('#chVoti'),{type:'line',data:{labels:s.voti.map(x=>x.t.label),datasets:[{data:s.voti.map(x=>x.v),borderColor:acc,backgroundColor:acc,pointRadius:4,tension:.25}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>{const x=s.voti[ctx.dataIndex];return `${fmtV(x.v)} · ${partita(x.g)}`;}}}},scales:{y:{min:7.2,max:8.8,ticks:{stepSize:.2}}}}}));
  if(s.oss){ const o=topN(s.osservatori); charts.push(new Chart($('#chOss'),{type:'bar',data:{labels:o.map(x=>nomeOss(x[0])),datasets:[{data:o.map(x=>x[1]),backgroundColor:acc,borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{stepSize:1}}}}})); }
  if(Object.keys(ossGlob).length){ const o=topN(ossGlob); charts.push(new Chart($('#chOssG'),{type:'bar',data:{labels:o.map(x=>nomeOss(x[0])),datasets:[{data:o.map(x=>x[1]),backgroundColor:acc,borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{stepSize:1}}}}})); }
}

/* ============================================================
   VISTA: MATRICE ARBITRI × OSSERVATORI
   ============================================================ */
let matTipo='oss';
function vMatrice(c){
  const T=turni(); const arbs=[...DB.arbitri].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  const cols = matTipo==='oss' ? DB.osservatori.map(o=>({id:o.id, l:o.nome.split(' ')[0]})) : DB.squadre.map(s=>({id:s.id, l:sigla(s.id)}));
  const M={}; let max=1;
  for(const a of arbs){ M[a.id]={}; for(const t of T){ const g=garaDiArbitro(t,a.id); if(!g) continue;
    const keys = matTipo==='oss' ? (g.oss?[g.oss]:[]) : [g.casa,g.ospite];
    keys.forEach(k=>{ M[a.id][k]=(M[a.id][k]||0)+1; max=Math.max(max,M[a.id][k]); }); } }
  const bg = v => v ? `background:color-mix(in srgb, var(--accent) ${Math.round(15+70*v/max)}%, transparent);color:${v/max>.6?'#fff':'inherit'}` : '';
  c.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><div><h2>${matTipo==='oss'?'Arbitri × Osservatori':'Arbitri × Squadre'}</h2>
    <p class="desc" style="margin:0">${matTipo==='oss'?'Quante volte ogni osservatore ha visto ogni arbitro.':'Quante volte ogni arbitro ha diretto ogni squadra.'}</p></div>
    <div class="row"><button class="btn small ${matTipo==='oss'?'primary':''}" data-m="oss">Osservatori</button><button class="btn small ${matTipo==='sq'?'primary':''}" data-m="sq">Squadre</button></div></div>
    <div class="tablewrap heat" style="margin-top:12px"><table class="grid"><thead><tr><th class="ref">Arbitro</th>${cols.map(x=>`<th style="min-width:64px" title="${esc(x.l)}">${esc(x.l)}</th>`).join('')}<th>Tot.</th></tr></thead><tbody>
    ${arbs.map(a=>{ const tot=Object.values(M[a.id]).reduce((s,x)=>s+x,0); return `<tr class="${a.id===DB.impostazioni.mioArbitro?'me':''}"><td class="ref">${esc(a.cognome)} ${esc(a.nome[0])}.</td>${cols.map(x=>{const v=M[a.id][x.id]||0;return `<td class="num" style="padding:6px;${bg(v)}">${v||''}</td>`}).join('')}<td class="num" style="padding:6px"><b>${tot}</b></td></tr>`; }).join('')}
    <tr><td class="ref muted small">Totale</td>${cols.map(x=>`<td class="num small muted" style="padding:6px">${arbs.reduce((s,a)=>s+(M[a.id][x.id]||0),0)}</td>`).join('')}<td></td></tr>
    </tbody></table></div></div>`;
  c.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{matTipo=b.dataset.m; render();});
}

/* ============================================================
   VISTA: GESTIONE (solo amministratore)
   ============================================================ */
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
function vGestione(c){
  if(!isAdmin){ c.innerHTML='<p>Accesso riservato.</p>'; return; }
  const I=DB.impostazioni; const cities=Object.keys(COORD).sort();
  const arbOpts=[...DB.arbitri].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  c.innerHTML = `<datalist id="dlCitta">${cities.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
  <div class="card"><h2>Impostazioni</h2><p class="desc">Regole usate per la previsione e per gli avvisi.</p>
    <div class="row">
      <label class="f">Il mio nome (evidenziato)<select data-imp="mioArbitro">${arbOpts.map(a=>`<option value="${a.id}" ${a.id===I.mioArbitro?'selected':''}>${esc(a.cognome)} ${esc(a.nome)}</option>`).join('')}</select></label>
      <label class="f">Non ripetere la stessa squadra per<select data-imp="finestra">${[1,2,3,4,5].map(n=>`<option ${+I.finestra===n?'selected':''} value="${n}">${n} giornat${n>1?'e':'a'}</option>`).join('')}</select></label>
      <label class="f" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-imp="escludiCitta" ${I.escludiCitta?'checked':''}> Escludi squadre della propria città</label>
      <label class="f" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-imp="consentiDerby" ${I.consentiDerby?'checked':''}> …tranne il derby cittadino</label>
    </div></div>

  <div class="card"><h2>Arbitri</h2><p class="desc">La <b>città</b> serve per distanze e regola “propria città”. Quelle segnate “da verificare” sono state impostate sul capoluogo di provincia.</p>
    <div class="tablewrap"><table><thead><tr><th>Cognome</th><th>Nome</th><th>Prov.</th><th>Città</th><th>Esord.</th><th></th></tr></thead><tbody>
    ${arbOpts.map(a=>`<tr data-arb="${a.id}"><td><input type="text" data-f="cognome" value="${esc(a.cognome)}" size="12"></td><td><input type="text" data-f="nome" value="${esc(a.nome)}" size="12"></td>
      <td><input type="text" data-f="prov" value="${esc(a.prov)}" size="3"></td>
      <td><input type="text" data-f="citta" list="dlCitta" value="${esc(a.citta)}" size="16"> ${a.cittaConfermata?'':'<span class="pill">da verificare</span>'}${COORD[normCity(a.citta)]?'':' <span class="pill" style="color:var(--warn)">città non in elenco: distanza non calcolata</span>'}</td>
      <td><input type="checkbox" data-f="esordiente" ${a.esordiente?'checked':''}></td><td><button class="btn small danger" data-del-arb="${a.id}">Elimina</button></td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn small" id="addArb" style="margin-top:8px">+ Aggiungi arbitro</button></div>

  <div class="grid2">
  <div class="card"><h2>Osservatori</h2>
    <div class="tablewrap"><table><thead><tr><th>Cognome e nome</th><th>Città</th><th></th></tr></thead><tbody>
    ${DB.osservatori.map(o=>`<tr data-oss="${o.id}"><td><input type="text" data-f="nome" value="${esc(o.nome)}" size="20"></td><td><input type="text" data-f="citta" list="dlCitta" value="${esc(o.citta)}" size="14"></td><td><button class="btn small danger" data-del-oss="${o.id}">Elimina</button></td></tr>`).join('')}
    </tbody></table></div><button class="btn small" id="addOss" style="margin-top:8px">+ Aggiungi osservatore</button></div>
  <div class="card"><h2>Squadre</h2>
    <div class="tablewrap"><table><thead><tr><th>Nome breve</th><th>Città</th></tr></thead><tbody>
    ${DB.squadre.map(s=>`<tr data-sq="${s.id}"><td><input type="text" data-f="nome" value="${esc(s.nome)}" size="16" title="${esc(s.denominazione||'')}"></td><td><input type="text" data-f="citta" list="dlCitta" value="${esc(s.citta)}" size="16"></td></tr>`).join('')}
    </tbody></table></div></div>
  </div>

  <div class="card"><h2>Aggiungi gara di playoff / playout / recupero</h2><p class="desc">Le gare della stessa fase nella stessa settimana formano un turno della griglia.</p>
    <div class="row">
      <label class="f">Fase<select id="nFase">${Object.entries(FASI).filter(([k])=>!['andata','ritorno'].includes(k)).map(([k,f])=>`<option value="${k}">${f.nome}</option>`).join('')}</select></label>
      <label class="f">Casa<select id="nCasa">${DB.squadre.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></label>
      <label class="f">Ospite<select id="nOsp">${DB.squadre.map((s,i)=>`<option value="${s.id}" ${i===1?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></label>
      <label class="f">Data<input type="date" id="nData" value="2027-03-14"></label>
      <label class="f">Ora<input type="time" id="nOra" value="18:00"></label>
      <label class="f">Gara n.<input type="text" id="nNum" size="6" placeholder="es. Gara 1"></label>
      <button class="btn primary" id="addGara" style="align-self:flex-end">Aggiungi</button>
    </div>
    ${(()=>{const po=DB.gare.filter(g=>!['andata','ritorno'].includes(g.fase)); return po.length?`<table style="margin-top:12px">${po.map(g=>`<tr><td>${esc(FASI[g.fase]?.nome||g.fase)}</td><td>${esc(partita(g))}</td><td>${fmtData(g.data)}</td><td><button class="btn small danger" data-del-gara="${g.id}">Elimina</button></td></tr>`).join('')}</table>`:''})()}
  </div>

  <div class="card"><h2>Backup ed esportazione</h2><p class="desc">Scarica una copia di tutti i dati o la griglia in Excel. Ogni salvataggio online conserva anche la versione precedente su Supabase.</p>
    <div class="row"><button class="btn" id="expXlsx">Scarica Excel</button><button class="btn" id="expJson">Scarica backup (.json)</button>
    <label class="btn">Ripristina backup<input type="file" id="impJson" accept=".json" class="hide"></label></div></div>`;

  c.querySelectorAll('[data-imp]').forEach(el=>el.onchange=()=>{ const k=el.dataset.imp; I[k]= el.type==='checkbox'?el.checked : k==='finestra'?+el.value : el.value; salva(); render(); });
  const bind = (attr, list) => c.querySelectorAll(`tr[data-${attr}]`).forEach(tr=>tr.addEventListener('change',e=>{
    const o=list().find(x=>x.id===tr.dataset[attr]); const el=e.target; const f=el.dataset.f; if(!o||!f) return;
    o[f] = el.type==='checkbox' ? el.checked : (f==='citta' ? normCity(el.value) : el.value.trim());
    if(attr==='arb' && f==='citta') o.cittaConfermata=true;
    salva(); if(f==='citta') render();
  }));
  bind('arb',()=>DB.arbitri); bind('oss',()=>DB.osservatori); bind('sq',()=>DB.squadre);
  $('#addArb').onclick=()=>{ const cg=prompt('Cognome del nuovo arbitro?'); if(!cg) return; const nm=prompt('Nome?')||''; let id=slug(cg); while(arb(id)) id+='2'; DB.arbitri.push({id,cognome:cg.trim(),nome:nm.trim(),prov:'',citta:'',cittaConfermata:true,esordiente:false}); salva(); render(); };
  $('#addOss').onclick=()=>{ const n=prompt('Cognome e nome del nuovo osservatore?'); if(!n) return; let id=slug(n.split(' ')[0]); while(oss(id)) id+='2'; DB.osservatori.push({id,nome:n.trim(),citta:''}); DB.osservatori.sort((a,b)=>a.nome.localeCompare(b.nome)); salva(); render(); };
  const usato = (k,id) => DB.gare.some(g=> k==='arb' ? (g.a1===id||g.a2===id) : g.oss===id);
  c.querySelectorAll('[data-del-arb]').forEach(b=>b.onclick=()=>{ const id=b.dataset.delArb; if(usato('arb',id)) return toast('Ha gare inserite: prima toglilo dalle gare'); if(confirm('Eliminare questo arbitro?')){ DB.arbitri=DB.arbitri.filter(a=>a.id!==id); salva(); render(); } });
  c.querySelectorAll('[data-del-oss]').forEach(b=>b.onclick=()=>{ const id=b.dataset.delOss; if(usato('oss',id)) return toast('Ha gare inserite: prima toglilo dalle gare'); if(confirm('Eliminare questo osservatore?')){ DB.osservatori=DB.osservatori.filter(a=>a.id!==id); salva(); render(); } });
  c.querySelectorAll('[data-del-gara]').forEach(b=>b.onclick=()=>{ if(confirm('Eliminare questa gara?')){ DB.gare=DB.gare.filter(g=>g.id!==b.dataset.delGara); salva(); render(); } });
  $('#addGara').onclick=()=>{
    const casa=$('#nCasa').value, osp=$('#nOsp').value; if(casa===osp) return toast('Casa e ospite coincidono');
    const g={id:'p'+Date.now().toString(36), numero:$('#nNum').value||'', fase:$('#nFase').value, giornata:null, data:$('#nData').value, ora:$('#nOra').value, casa, ospite:osp,
      campo:(DB.gare.find(x=>x.casa===casa)||{}).campo||'', a1:'',a2:'',oss:'',voto1:null,voto2:null,note:''};
    DB.gare.push(g); salva(); toast('Gara aggiunta'); render();
  };
  $('#expJson').onclick=()=>{ const d=clone(DB); delete d._agg; scarica(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}), `griglia-serie-c-${oggi()}.json`); };
  $('#impJson').onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const d=JSON.parse(await f.text()); if(!d.arbitri||!d.gare) throw 0; if(!confirm('Sostituire tutti i dati attuali con il backup?')) return; DB=migra(d); salva(); render(); toast('Backup ripristinato'); }catch(_){ toast('File non valido'); } };
  $('#expXlsx').onclick=esportaExcel;
}
function scarica(blob, nome){ const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); }
function esportaExcel(){
  if(!window.XLSX) return toast('Libreria Excel non caricata');
  const T=turni(); const arbs=[...DB.arbitri].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  const griglia=[['Arbitro',...T.map(t=>t.label)]];
  for(const a of arbs) griglia.push([`${a.cognome} ${a.nome}`, ...T.map(t=>{ const g=garaDiArbitro(t,a.id); if(!g) return t.compilato?'RIPOSO':''; const v=votoDi(g,a.id); return `${nomeOss(g.oss)||'no oss.'} – ${partita(g)}${v!=null?' – '+fmtV(v):''}`; })]);
  const riep=[['Arbitro','Città','Gare','Andata','Ritorno','Playoff','Riposi','Osservazioni','% copertura','Media voto','Ultimo voto']];
  for(const a of arbs){ const s=statArbitro(a.id,T); riep.push([`${a.cognome} ${a.nome}`,a.citta,s.n,s.A,s.R,s.PO,s.riposi,s.oss,s.n?Math.round(s.cop*100)/100:0,s.media!=null?Math.round(s.media*100)/100:'',s.ultimo??'']); }
  const gare=[['Turno','Gara n.','Data','Ora','Casa','Ospite','Campo','1° arbitro','Voto 1','2° arbitro','Voto 2','Osservatore','Note']];
  for(const t of T) for(const g of t.gare) gare.push([t.label,g.numero,g.data,g.ora,nomeSq(g.casa),nomeSq(g.ospite),g.campo,nomeArb(g.a1),g.voto1??'',nomeArb(g.a2),g.voto2??'',nomeOss(g.oss),g.note]);
  const wb=XLSX.utils.book_new();
  const add=(rows,n,w)=>{ const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=rows[0].map((_,i)=>({wch:i===0?24:w})); XLSX.utils.book_append_sheet(wb,ws,n); };
  add(griglia,'Griglia',30); add(riep,'Riepilogo',12); add(gare,'Gare',16);
  XLSX.writeFile(wb, `Griglia_Serie_C_${oggi()}.xlsx`);
}

/* ============================================================
   AVVIO
   ============================================================ */
(async function init(){
  $('#titolo').textContent = CFG.TITOLO || 'Griglia Serie C';
  document.title = CFG.TITOLO || 'Griglia Serie C';
  if(!DEMO){ sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
  await initAuth(); await carica();
  view = lsGet('vista') || 'griglia';
  aggiornaAdminUI(); render();
  if(!DEMO){ // aggiorna i dati per chi consulta, ogni 2 minuti
    setInterval(async()=>{ if(isAdmin || document.hidden) return; await carica(); render(); }, 120000);
  }
})();
