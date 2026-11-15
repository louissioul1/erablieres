// Gestion · Érablières Grégoire — punch, production, planification, statistiques, vue TV.
// Partage le projet Firebase, les comptes et les cartes de l'app terrain (../).
const GS = "https://www.gstatic.com/firebasejs/10.14.1/";
const $ = s=>document.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ls = {get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const nid = p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hav=(a,b)=>{const R=6371000,r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[0]-a[0])*r,x=Math.sin(dl/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const dec = s=>String(s||"").split(";").filter(Boolean).map(p=>p.split(",").map(Number));
const SEASON_MONTH = 7;
const seasonOf = iso=>{const d=iso?new Date(String(iso).length===10?iso+"T12:00":iso):new Date();return d.getMonth()>=SEASON_MONTH?d.getFullYear()+1:d.getFullYear()};
const CUR = seasonOf();
const DEF = "montagne-noire";
const today = ()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const nf = (n,d=0)=>(+n||0).toLocaleString("fr-CA",{minimumFractionDigits:d,maximumFractionDigits:d});
const money = n=>(+n||0).toLocaleString("fr-CA",{style:"currency",currency:"CAD"});
const hfmt = h=>{h=+h||0;const H=Math.floor(h),M=Math.round((h-H)*60);return H+" h "+String(M).padStart(2,"0")};
const dlabel = d=>new Date(d+"T12:00").toLocaleDateString("fr-CA",{weekday:"short",day:"numeric",month:"short"});
const tlabel = iso=>new Date(iso).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"});
const ago = iso=>{const s=(Date.now()-new Date(iso))/1000;return s<60?"à l'instant":s<3600?Math.floor(s/60)+" min":s<86400?Math.floor(s/3600)+" h":Math.floor(s/86400)+" j"};
const sectOf = x=>x.sect||DEF;
const csv = (name,rows)=>{const t=rows.map(r=>r.map(v=>{v=String(v??"");return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(";")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+t],{type:"text/csv"}));a.download=name;a.click()};
let toastT=0;const toast=(t,ms=3000)=>{const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),ms)};

// ---------- icônes
const P = {
 flame:"M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z",
 wrench:"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
 drop:"M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z",
 truck:"M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-.01M17 18.5a1.5 1.5 0 1 0 0-.01",
 clip:"M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4",
 tree:"M12 3l6 8h-4l5 6H5l5-6H6zM12 17v4",
 drill:"M4 10h9l3-2v8l-3-2H4zM16 12h5",
 undo:"M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
 link:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
 dots:"M5 12h.01M12 12h.01M19 12h.01",
 home:"M3 11l9-7 9 7v9h-6v-6H9v6H3z",
 clock:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
 barrel:"M7 3h10c1.5 3 1.5 15 0 18H7C5.5 18 5.5 6 7 3zM6 8h12M6 16h12",
 route:"M6 19a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M6 17V9a4 4 0 0 1 4-4h4M18 7v8a4 4 0 0 1-4 4h-4",
 chart:"M4 20V10M10 20V4M16 20v-7M22 20H2",
 gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
 play:"M7 4l13 8-13 8z", stop:"M6 6h12v12H6z"};
const ico = (k,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[k]}"/></svg>`;

// ---------- référentiels
const CATS = [
 {k:"bouillage",l:"Bouillage",c:"#e8772e",i:"flame"},{k:"maintenance",l:"Maintenance",c:"#6b7a72",i:"wrench"},
 {k:"fuites",l:"Fuites",c:"#2f8fd6",i:"drop"},{k:"transport",l:"Transport d'eau",c:"#0aa3b5",i:"truck"},
 {k:"admin",l:"Administration",c:"#8b5cf6",i:"clip"},{k:"amenagement",l:"Aménagement forestier",c:"#2fa85f",i:"tree"},
 {k:"entaillage",l:"Entaillage",c:"#c99a00",i:"drill"},{k:"desentaillage",l:"Désentaillage",c:"#14a3a3",i:"undo"},
 {k:"sellettes",l:"Sellettes / chutes",c:"#6c7bff",i:"link"},{k:"autre",l:"Autre",c:"#7d8a82",i:"dots"}];
const catOf = h=>CATS.find(c=>c.k===h.cat)||CATS.find(c=>c.l===h.task)||{k:"autre",l:h.task||"Autre",c:"#7d8a82",i:"dots"};
const CLASSES = {DO:{l:"Doré",c:"#d9a520"},AM:{l:"Ambré",c:"#c97a22"},FO:{l:"Foncé",c:"#8a4b1c"},TF:{l:"Très foncé",c:"#4e2c14"},VR:{l:"Hors norme",c:"#7d8a82"}};
const BSTAT = {attente:{l:"En attente",c:"#e08a00"},classe:{l:"Classé",c:"#2fa85f"},livre:{l:"Livré",c:"#3d7bd9"}};
const TYPES = {bris:{l:"Bris de tubulure",c:"#e5432b"},fuite:{l:"Fuite / vacuum",c:"#f08a00"},arbre:{l:"Arbre tombé",c:"#a0662a"},ponceau:{l:"Ponceau / drainage",c:"#2f7bf0"},entaille:{l:"Entaille / chalumeau",c:"#a256d6"},repere:{l:"Repère",c:"#2fa85f"},autre:{l:"Autre",c:"#7d8a82"},sellette:{l:"Sellettes",c:"#00b3a4",w:1},chute:{l:"Chutes",c:"#6c7bff",w:1},travail:{l:"Autre travail",c:"#b08a4a",w:1}};
const PRIOS={urgent:{l:"Urgent",c:"#d01f1f",o:0},haute:{l:"Haute",c:"#f08a00",o:1},normale:{l:"Normale",c:"#7d8a82",o:2},basse:{l:"Basse",c:"#5b8bd6",o:3}};
const prOf=o=>PRIOS[o.prio]?o.prio:"normale", asgOf=o=>Array.isArray(o.assign)?o.assign:[];
const byPrio=(a,b)=>(PRIOS[prOf(a)].o-PRIOS[prOf(b)].o)||String(b.at).localeCompare(String(a.at));
const DIAS = ["5/16\"","3/4\"","1\"","1 1/4\"","1 1/2\"","2\""];
const PRIX0 = [
 {k:"lat",l:"Tubulure 5/16\" (latéral)",u:"pi",min:.15,max:.25},
 {k:"ml_3/4\"",l:"Maître-ligne 3/4\"",u:"pi",min:.45,max:.6},{k:"ml_1\"",l:"Maître-ligne 1\"",u:"pi",min:.6,max:.8},
 {k:"ml_1 1/4\"",l:"Maître-ligne 1 1/4\"",u:"pi",min:.8,max:1.05},{k:"ml_1 1/2\"",l:"Maître-ligne 1 1/2\"",u:"pi",min:1,max:1.35},{k:"ml_2\"",l:"Maître-ligne 2\"",u:"pi",min:1.6,max:2.1},
 {k:"chal",l:"Chalumeau",u:"pièce",min:.25,max:.4},{k:"te",l:"T-bouchon santé / T 5/16\"",u:"pièce",min:.35,max:.45},
 {k:"chute",l:"Chute (5/16\" coupée ~30\")",u:"pièce",min:.4,max:.9},{k:"selle",l:"Raccord-selle latéral → maître-ligne",u:"pièce",min:.5,max:1.2},
 {k:"cap",l:"Capuchon de fin / bouchon",u:"pièce",min:.3,max:.6},{k:"fil",l:"Fil support galvanisé (#9 / 12,5 ga)",u:"pi",min:.05,max:.1},
 {k:"ancre",l:"Ancrage / piquet bout de ligne",u:"pièce",min:2,max:5}];
const WMO = c=>c==null?"":c===0?"Dégagé":c<=2?"Peu nuageux":c===3?"Couvert":c<=48?"Brouillard":c<=57?"Bruine":c<=67?"Pluie":c<=77?"Neige":c<=82?"Averses":c<=86?"Averses de neige":"Orage";

// ---------- stockage
const Local = (()=>{const K="gest_local_db";let d=ls.get(K,{});const subs={};const list=c=>Object.entries(d[c]||{}).map(([id,v])=>({id,...v}));
 const emit=c=>(subs[c]||[]).forEach(f=>f(list(c),{fromCache:false}));const save=()=>ls.set(K,d);
 return {kind:"local",sub(c,cb){(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>cb(list(c),{fromCache:false}),0)},
  async get(c,id){return d[c]&&d[c][id]?{id,...d[c][id]}:null},
  async set(c,id,v){(d[c]=d[c]||{})[id]=JSON.parse(JSON.stringify(v));save();emit(c)},
  async upd(c,id,v){(d[c]=d[c]||{})[id]={...(d[c][id]||{}),...JSON.parse(JSON.stringify(v))};save();emit(c)},
  async del(c,id){if(d[c])delete d[c][id];save();emit(c)}}})();
function Fire(db,F){
 const soft=p=>{p.catch(e=>toast("Écriture refusée : "+(e.code||e.message),6000));return Promise.race([p,new Promise(r=>setTimeout(r,2000))])};
 return {kind:"fire",
  sub(c,cb,o){const q=o&&o.order?F.query(F.collection(db,c),F.orderBy(o.order,"desc"),F.limit(o.lim||100)):F.collection(db,c);
   return F.onSnapshot(q,s=>{denied[c]=false;cb(s.docs.map(x=>({id:x.id,...x.data()})),s.metadata)},e=>{console.warn(c,e);if(e.code==="permission-denied"){denied[c]=true;render()}})},
  async get(c,id){const s=await F.getDoc(F.doc(db,c,id));return s.exists()?{id,...s.data()}:null},
  set:(c,id,v)=>soft(F.setDoc(F.doc(db,c,id),v)),
  upd:(c,id,v)=>soft(F.setDoc(F.doc(db,c,id),v,{merge:true})),
  del:(c,id)=>soft(F.deleteDoc(F.doc(db,c,id)))}}

// ---------- état
let store=null, auth=null, fbAuth=null, me={uid:"local",email:"",nom:"Moi"}, role="admin";
let sectors=[{id:DEF,nom:"Montagne Noire",ord:0}], couche=[], heures=[], obs=[], prod=[], barils=[], transport=[], acts=[], cfg={};
const denied={};
let sect=ls.get("gest_sect","*"), tab=ls.get("gest_tab","accueil"), ptab="journal", season=CUR, openDay=null, bFilt="", catSel=ls.get("gest_cat","bouillage");
const isAd = ()=>role==="admin";
const sectName = id=>id==="*"?"Toutes les érablières":(sectors.find(s=>s.id===id)||{nom:id}).nom;
const inSect = x=>sect==="*"||sectOf(x)===sect;
const sInSeason = (x,dateKey="date")=>(x.season??seasonOf(x[dateKey]||x.at))===season;
const P_ = ()=>({...Object.fromEntries(PRIX0.map(p=>[p.k,{min:p.min,max:p.max}])),...((cfg.prix||{}).items||{})});
const PL = ()=>({ftPerTap:16.5,tapsPerLat:5,pMin:2,pCible:4,...((cfg.planif)||{})});
function feats(s){return couche.filter(f=>sectOf(f)===s)}
function linesOf(s){return feats(s).filter(f=>f.kind==="ligne").map(f=>{const c=dec(f.c);let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);return {...f,coords:c,len}}).filter(l=>l.coords.length>1).sort((a,b)=>String(a.name).localeCompare(String(b.name),"fr",{numeric:true}))}
function zonesOf(s){return feats(s).filter(f=>f.kind==="zone").map(f=>({...f,coords:dec(f.c)})).filter(z=>z.coords.length>2)}
function centerOf(s){const all=(s==="*"?couche:feats(s)).flatMap(f=>dec(f.c));if(!all.length)return [46.27,-74.24];const x=all.reduce((a,p)=>a+p[0],0)/all.length,y=all.reduce((a,p)=>a+p[1],0)/all.length;return [y,x]}
const tapsOf = s=>(s==="*"?sectors.map(x=>x.id):[s]).reduce((a,id)=>a+zonesOf(id).reduce((b,z)=>b+(+z.pot||0),0),0);

// ---------- feuille (sheet)
function openSheet(html){const s=$("#sheet");s.innerHTML=html;$("#sheetBg").classList.add("on");s.scrollTop=0;s.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeSheet)}
function closeSheet(){$("#sheetBg").classList.remove("on")}
$("#sheetBg").onclick=e=>{if(e.target.id==="sheetBg")closeSheet()};
const hd = t=>`<div class="hd"><h2>${t}</h2><button class="btn sm" data-close>Fermer</button></div>`;
const chips = (name,opts,val)=>`<div class="row">${opts.map(([k,l,c])=>`<button class="chip" data-${name}="${esc(k)}" aria-pressed="${k===val}" ${c?`style="--c:${c}"`:""}>${l}</button>`).join("")}</div>`;
function pick(name,cb){$("#sheet").querySelectorAll(`[data-${name}]`).forEach(b=>b.onclick=()=>{$("#sheet").querySelectorAll(`[data-${name}]`).forEach(x=>x.setAttribute("aria-pressed",x===b));cb(b.dataset[name])})}

// ---------- navigation
const TABS = [["accueil","Accueil","home"],["punch","Punch","clock"],["production","Production","barrel"],["planif","Planification","route"],["stats","Statistiques","chart"],["reglages","Réglages","gear"]];
function nav(){$("#nav").innerHTML=TABS.map(([k,l,i])=>`<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${ico(i)}<span>${l}</span></button>`).join("");
 $("#nav").querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;ls.set("gest_tab",tab);nav();render();scrollTo(0,0)});
 $("#sectName").textContent=sectName(sect)}
$("#bSect").onclick=()=>{openSheet(hd("Érablière")+`<div class="row" style="flex-direction:column;align-items:stretch">${[["*","Toutes les érablières"],...sectors.map(s=>[s.id,s.nom])].map(([k,l])=>`<button class="btn" data-s="${esc(k)}" style="text-align:left;${k===sect?"background:var(--forest);color:#fff":""}">${esc(l)}</button>`).join("")}</div>`);
 $("#sheet").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{sect=b.dataset.s;ls.set("gest_sect",sect);openDay=null;closeSheet();nav();render()})};
$("#bTv").onclick=()=>startTv();

let timerI=0;
function render(){if(!store)return;clearInterval(timerI);if(document.body.classList.contains("tv"))return renderTv();
 const v=$("#view");v.innerHTML=({accueil:vAccueil,punch:vPunch,production:vProd,planif:vPlanif,stats:vStats,reglages:vReg}[tab]||vAccueil)();
 ({punch:bPunch,production:bProd,planif:bPlanif,reglages:bReg,accueil:bAccueil,stats:bStats}[tab]||(()=>{}))(v)}
const seasons = ()=>{const s=new Set([CUR,...heures.map(h=>h.season??seasonOf(h.date)),...prod.map(d=>d.season),...barils.map(b=>b.season)].filter(Boolean));return [...s].sort((a,b)=>b-a)};
const seasonSel = ()=>`<select id="selSeason" style="width:auto;min-height:38px;padding:6px 10px">${seasons().map(s=>`<option value="${s}" ${s===season?"selected":""}>Saison ${s}</option>`).join("")}</select>`;
const bindSeason = v=>{const s=v.querySelector("#selSeason");if(s)s.onchange=()=>{season=+s.value;render()}};
const deniedNote = cs=>cs.some(c=>denied[c])?`<div class="card" style="border-color:var(--o)"><b>Module en attente d'activation.</b><div class="small">La base de données refuse encore ces données (${cs.filter(c=>denied[c]).join(", ")}). Une règle Firestore doit être ajoutée par l'administrateur.</div></div>`:"";

// ---------- punch
const openPunch = (uid=me.uid)=>heures.find(h=>h.open&&h.by===uid);
const elapsed = h=>(Date.now()-new Date(h.start))/3600000;
function vPunch(){const op=openPunch();const c=op?catOf(op):null;const mine=heures.filter(h=>h.by===me.uid&&h.date===today()).sort((a,b)=>String(b.start||b.at).localeCompare(String(a.start||a.at)));
 const now=heures.filter(h=>h.open).sort((a,b)=>String(a.start).localeCompare(String(b.start)));
 const tot=mine.reduce((a,h)=>a+(h.open?elapsed(h):(+h.h||0)),0);
 return `<div class="card" style="max-width:640px;margin:0 auto 14px">
  <h2>${ico("clock",22)} Punch</h2>
  ${op?`<div style="text-align:center"><div class="small">En cours depuis ${tlabel(op.start)} · ${esc(sectName(sectOf(op)))}</div>
   <div style="margin:8px 0"><span class="badge" style="--c:${c.c};font-size:16px">${esc(c.l)}</span></div><div class="timer" id="tmr">${hfmt(elapsed(op))}</div></div>`
  :`<p class="small" style="text-align:center;margin:0 0 12px">Sur quoi travaillez-vous ? Choisissez une catégorie pour pointer votre entrée.</p>`}
  <div class="cats" style="margin-top:12px">${CATS.map(x=>`<button class="cat" data-cat="${x.k}" style="--c:${x.c}" aria-pressed="${(op?c.k:catSel)===x.k}">${ico(x.i)}${x.l}</button>`).join("")}</div>
  ${sect==="*"&&!op?`<label class="f" for="pSect">Érablière</label><select id="pSect">${sectors.map(s=>`<option value="${s.id}">${esc(s.nom)}</option>`).join("")}</select>`:""}
  <button class="punch ${op?"out":""}" id="bPunch">${ico(op?"stop":"play",44)}${op?"Punch sortie":"Punch entrée"}</button>
  ${op?`<p class="small" style="text-align:center;margin:0">Toucher une autre catégorie change de tâche sans arrêter la journée.</p>`:""}
 </div>
 <div class="grid2" style="max-width:1000px;margin:0 auto">
  <div class="card"><h2>Aujourd'hui · ${hfmt(tot)}</h2>${mine.length?`<table><tbody>${mine.map(h=>{const k=catOf(h);return `<tr class="click" data-h="${h.id}"><td><span class="badge" style="--c:${k.c}">${esc(k.l)}</span></td><td class="meta">${h.start?tlabel(h.start)+" – "+(h.open?"en cours":tlabel(h.end)):"saisie"}</td><td class="n">${h.open?"…":hfmt(h.h)}</td></tr>`}).join("")}</tbody></table>`:`<div class="empty">Aucune entrée aujourd'hui.</div>`}
   <div class="row" style="margin-top:10px"><button class="btn sm" id="bHMan">+ Entrée manuelle</button></div></div>
  <div class="card"><h2><span class="dot"></span> En ce moment</h2>${now.length?now.map(h=>`<div class="who"><div style="flex:1"><b>${esc(h.byName)}</b><div class="meta">${esc(catOf(h).l)} · ${esc(sectName(sectOf(h)))}</div></div><div class="n meta">depuis ${tlabel(h.start)}</div></div>`).join(""):`<div class="empty">Personne n'est punché.</div>`}</div>
 </div>`}
function bPunch(v){const op=openPunch();
 if(op){timerI=setInterval(()=>{const t=$("#tmr");if(t)t.textContent=hfmt(elapsed(op))},15000)}
 v.querySelectorAll("[data-cat]").forEach(b=>b.onclick=async()=>{const k=b.dataset.cat;catSel=k;ls.set("gest_cat",k);const o=openPunch();
  if(o&&o.cat!==k){await punchOut(o);await punchIn(k,sectOf(o));toast("Tâche changée : "+CATS.find(c=>c.k===k).l)}else render()});
 v.querySelector("#bPunch").onclick=async e=>{e.currentTarget.disabled=true;const o=openPunch();
  if(o){if(elapsed(o)>14)return fixForgot(o);await punchOut(o);toast("Punch sortie : "+hfmt(elapsed(o)))}
  else{const s=v.querySelector("#pSect")?.value||(sect==="*"?sectors[0].id:sect);await punchIn(catSel,s);toast("Punch entrée : "+CATS.find(c=>c.k===catSel).l)}};
 v.querySelectorAll("[data-h]").forEach(r=>r.onclick=()=>editHeure(heures.find(h=>h.id===r.dataset.h)));
 v.querySelector("#bHMan").onclick=()=>editHeure(null)}
async function punchIn(k,s){const c=CATS.find(x=>x.k===k),now=new Date().toISOString();
 await store.set("heures",nid("h"),{date:today(),start:now,open:true,cat:k,task:c.l,sect:s,season:CUR,h:0,note:"",by:me.uid,byName:me.nom,at:now,src:"punch"});render()}
async function punchOut(o,endIso){const end=endIso||new Date().toISOString();const h=Math.max(0,Math.round((new Date(end)-new Date(o.start))/36000)/100);
 await store.upd("heures",o.id,{open:false,end,h});render()}
function fixForgot(o){openSheet(hd("Punch oublié ?")+`<p>Votre punch « ${esc(catOf(o).l)} » est ouvert depuis le ${dlabel(o.date)} à ${tlabel(o.start)}. À quelle heure avez-vous fini ?</p>
 <label class="f" for="fEnd">Heure de fin (${dlabel(o.date)})</label><input type="time" id="fEnd" value="17:00"><div class="row" style="margin-top:14px"><button class="btn pri" id="fOk" style="flex:1">Fermer le punch</button></div>`);
 $("#fOk").onclick=async()=>{const [H,M]=$("#fEnd").value.split(":").map(Number);const d=new Date(o.date+"T00:00");d.setHours(H,M);await punchOut(o,d.toISOString());closeSheet()}}
function editHeure(h){const n=!h;h=h||{date:today(),cat:catSel,h:"",note:"",sect:sect==="*"?sectors[0].id:sect};const own=n||h.by===me.uid||isAd();
 const st=h.start?tlabel(h.start):"",en=h.end?tlabel(h.end):"";let cat=catOf(h).k;
 openSheet(hd(n?"Entrée manuelle":"Entrée d'heures")+`
 <label class="f">Catégorie</label>${chips("hc",CATS.map(c=>[c.k,c.l]),cat)}
 <div class="grid2"><div><label class="f" for="eD">Date</label><input type="date" id="eD" value="${h.date}"></div><div><label class="f" for="eS">Érablière</label><select id="eS">${sectors.map(s=>`<option value="${s.id}" ${s.id===sectOf(h)?"selected":""}>${esc(s.nom)}</option>`).join("")}</select></div></div>
 <div class="grid3"><div><label class="f" for="eA">Début</label><input type="time" id="eA" value="${st}"></div><div><label class="f" for="eB">Fin</label><input type="time" id="eB" value="${en}"></div><div><label class="f" for="eH">Heures</label><input type="number" id="eH" step="0.25" min="0" value="${h.open?"":h.h}"></div></div>
 <label class="f" for="eN">Note</label><textarea id="eN">${esc(h.note)}</textarea>
 ${own?`<div class="row" style="margin-top:14px"><button class="btn pri" id="eOk" style="flex:1">Enregistrer</button>${n?"":`<button class="btn red" id="eDel">Supprimer</button>`}</div>`:`<p class="small">Seul l'auteur ou un administrateur peut modifier.</p>`}<div class="err" id="eErr"></div>`);
 pick("hc",k=>cat=k);
 const calc=()=>{const a=$("#eA").value,b=$("#eB").value;if(a&&b){let d=(new Date("2000-01-01T"+b)-new Date("2000-01-01T"+a))/3600000;if(d<0)d+=24;$("#eH").value=Math.round(d*100)/100}};
 $("#eA").onchange=calc;$("#eB").onchange=calc;
 if(!own)return;
 $("#eOk").onclick=async()=>{const hh=+$("#eH").value,d=$("#eD").value;if(!d||!(hh>0)){$("#eErr").textContent="Entrez la date et les heures.";return}
  const mk=t=>{if(!t)return null;const x=new Date(d+"T00:00");const [H,M]=t.split(":").map(Number);x.setHours(H,M);return x.toISOString()};
  const c=CATS.find(x=>x.k===cat);const rec={...(n?{}:h),date:d,h:hh,cat,task:c.l,sect:$("#eS").value,note:$("#eN").value.trim(),season:seasonOf(d),start:mk($("#eA").value),end:mk($("#eB").value),open:false};
  delete rec.id;if(n)Object.assign(rec,{by:me.uid,byName:me.nom,at:new Date().toISOString(),src:"manuel"});
  await store.set("heures",n?nid("h"):h.id,rec);closeSheet();render()};
 if(!n)$("#eDel").onclick=async()=>{if(!confirmBox("Supprimer cette entrée ?"))return;await store.del("heures",h.id);closeSheet();render()}}
function confirmBox(t){return window.confirm(t)}

// ---------- météo (Open-Meteo, sans clé)
async function meteoDay(date,s){const [lat,lng]=centerOf(s);const q=`latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&hourly=surface_pressure&timezone=America%2FToronto&start_date=${date}&end_date=${date}`;
 for(const base of ["https://api.open-meteo.com/v1/forecast?","https://archive-api.open-meteo.com/v1/archive?"]){try{const r=await fetch(base+q);if(!r.ok)continue;const j=await r.json();if(!j.daily||j.daily.temperature_2m_max[0]==null)continue;
  const pr=j.hourly&&j.hourly.surface_pressure?j.hourly.surface_pressure[12]:null;return {tmin:j.daily.temperature_2m_min[0],tmax:j.daily.temperature_2m_max[0],code:j.daily.weather_code[0],ciel:WMO(j.daily.weather_code[0]),precip:j.daily.precipitation_sum[0],hpa:pr!=null?Math.round(pr):null}}catch(e){}}return null}
async function meteoNow(s){const [lat,lng]=centerOf(s);try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,weather_code,surface_pressure,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FToronto&forecast_days=1`);const j=await r.json();
 return {t:j.current.temperature_2m,ciel:WMO(j.current.weather_code),hpa:Math.round(j.current.surface_pressure),vent:Math.round(j.current.wind_speed_10m),tmin:j.daily.temperature_2m_min[0],tmax:j.daily.temperature_2m_max[0]}}catch(e){return null}}

// ---------- production
const pDays = ()=>prod.filter(d=>inSect(d)&&d.season===season).sort((a,b)=>b.date.localeCompare(a.date));
const pBarils = ()=>barils.filter(b=>inSect(b)&&b.season===season);
const pTrans = ()=>transport.filter(t=>inSect(t)&&t.season===season);
const dayBarils = d=>barils.filter(b=>b.date===d.date&&sectOf(b)===sectOf(d));
const sum = (a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const avgBrix = bs=>{const w=bs.filter(b=>+b.brixConf||+b.brixEst);const tw=sum(w,b=>b.poids);return tw?sum(w,b=>(+b.brixConf||+b.brixEst)*(+b.poids||0))/tw:null};
const sirupLbs = (L,brix)=>L*(brix/100)/0.66*2.20462; // L × Brix → kg de sucre → kg de sirop à 66 °Brix → lbs
function vProd(){const segs=[["journal","Production"],["barils","Classement / barils"],["transport","Transport d'eau"],["rapports","Rapports"]];
 return `${deniedNote(["prod","barils","transport"])}<div class="card"><div class="row" style="margin-bottom:12px"><h2 style="margin:0">${ico("barrel",22)} Production · ${esc(sectName(sect))}</h2><span class="sp"></span>${seasonSel()}</div>
 <div class="seg">${segs.map(([k,l])=>`<button data-pt="${k}" aria-pressed="${ptab===k}">${l}</button>`).join("")}</div>
 ${({journal:vJournal,barils:vBarils,transport:vTrans,rapports:vRapports})[ptab]()}</div>`}
function vJournal(){const ds=pDays();
 return `<div class="row" style="margin-bottom:12px"><span class="small">Une journée par érablière : météo automatique, barils, sève reçue.</span><span class="sp"></span><button class="btn g" id="bStart">+ Démarrer aujourd'hui</button></div>
 ${ds.length?ds.map(d=>{const bs=dayBarils(d),lbs=sum(bs,b=>b.poids),br=avgBrix(bs),tr=transport.filter(t=>t.date===d.date&&sectOf(t)===sectOf(d)),L=sum(tr,t=>t.litres),hb=sum(heures.filter(h=>h.date===d.date&&sectOf(h)===sectOf(d)&&catOf(h).k==="bouillage"),h=>h.open?elapsed(h):h.h);const o=openDay===d.id;
  return `<div class="day"><div class="dayh" data-day="${d.id}"><b>${dlabel(d.date)}</b>${sect==="*"?`<span class="tag">${esc(sectName(sectOf(d)))}</span>`:""}
   <span class="meta">${d.tmin!=null?`<span style="color:var(--b)">${nf(d.tmin,1)}°</span> / <span style="color:var(--o)">${nf(d.tmax,1)}°</span>`:""} ${d.hpa?d.hpa+" hPa":""} ${esc(d.ciel||"")} ${br?"· Brix "+nf(br,1)+"°":""}</span><span class="sp"></span>
   <b style="min-width:0;color:#8b5cf6">${nf(lbs)} lbs</b><span class="meta">${bs.length} baril${bs.length>1?"s":""}</span><span class="badge" style="--c:${d.statut==="conclue"?"#2fa85f":"#3d7bd9"}">${d.statut==="conclue"?"Conclue":"En cours"}</span></div>
   ${o?`<div class="dayb"><div class="kpis" style="margin:12px 0"><div class="kpi"><b>${nf(lbs)}</b><span>lbs de sirop</span></div><div class="kpi"><b>${nf(L)}</b><span>litres de sève reçus</span></div><div class="kpi"><b>${hfmt(hb)}</b><span>de bouillage (punch)</span></div><div class="kpi"><b>${d.conc?nf(d.conc,1)+"°":"—"}</b><span>Brix concentré</span></div></div>
    <div class="row" style="margin-bottom:6px"><h3>Barils (${bs.length})</h3><span class="sp"></span><button class="btn sm pri" data-addb="${d.id}">+ Ajouter</button></div>
    ${barTable(bs,false)}
    ${d.note?`<p class="small"><b>Note :</b> ${esc(d.note)}</p>`:""}
    <div class="row" style="margin-top:10px"><button class="btn sm" data-eday="${d.id}">Modifier la journée</button><button class="btn sm" data-met="${d.id}">Météo ↻</button>${d.statut!=="conclue"?`<button class="btn sm g" data-end="${d.id}">Conclure</button>`:`<button class="btn sm" data-reo="${d.id}">Rouvrir</button>`}</div></div>`:""}</div>`}).join(""):`<div class="empty">Aucune journée cette saison. Touchez « Démarrer aujourd'hui » le premier jour de bouillage.</div>`}`}
function barTable(bs,showDate=true){if(!bs.length)return `<div class="empty">Aucun baril.</div>`;
 return `<div class="tw"><table><thead><tr><th>No</th>${showDate?"<th>Date</th>":""}<th>Couleur</th><th class="n">Poids</th><th class="n">Brix est.</th><th class="n">Brix conf.</th><th>Statut</th><th class="hide-m">Acheteur</th></tr></thead><tbody>
 ${bs.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.no).localeCompare(String(b.no),"fr",{numeric:true})).map(b=>{const c=CLASSES[b.classe],s=BSTAT[b.statut]||BSTAT.attente;return `<tr class="click" data-bar="${b.id}"><td><span class="no">#${esc(b.no)}</span></td>${showDate?`<td class="meta">${dlabel(b.date)}</td>`:""}<td>${c?`<span class="badge" style="--c:${c.c}">${c.l}</span> <span class="tag">${b.classe}</span>`:`<span class="meta">À classer</span>`}</td><td class="n">${nf(b.poids)} lbs</td><td class="n">${b.brixEst?nf(b.brixEst,1)+"°":"—"}</td><td class="n">${b.brixConf?nf(b.brixConf,1)+"°":"—"}</td><td><span class="badge" style="--c:${s.c}">${s.l}</span></td><td class="hide-m meta">${esc(b.acheteur||"")}</td></tr>`}).join("")}</tbody></table></div>`}
function vBarils(){const bs=pBarils().filter(b=>!bFilt||b.statut===bFilt||(bFilt==="attente"&&!b.statut));const all=pBarils();
 const byC=Object.keys(CLASSES).map(k=>[k,sum(all.filter(b=>b.classe===k),b=>b.poids),all.filter(b=>b.classe===k).length]).filter(x=>x[2]);
 return `<div class="kpis"><div class="kpi"><b>${all.length}</b><span>barils</span></div><div class="kpi"><b>${nf(sum(all,b=>b.poids))}</b><span>lbs au total</span></div><div class="kpi"><b>${all.filter(b=>!b.statut||b.statut==="attente").length}</b><span>en attente de classement</span></div>${byC.map(([k,l,n])=>`<div class="kpi"><b style="color:${CLASSES[k].c}">${nf(l)}</b><span>lbs ${CLASSES[k].l} (${n})</span></div>`).join("")}</div>
 <div class="row" style="margin-bottom:10px">${chips("bf",[["","Tous"],...Object.entries(BSTAT).map(([k,v])=>[k,v.l])],bFilt)}<span class="sp"></span><button class="btn sm" id="bCsvB">Exporter CSV</button><button class="btn sm pri" id="bAddB">+ Baril</button></div>${barTable(bs)}`}
function vTrans(){const ts=pTrans().sort((a,b)=>String(b.at).localeCompare(String(a.at)));const L=sum(ts,t=>t.litres),wb=sum(ts,t=>(+t.litres||0)*(+t.brix||0));const br=L?wb/L:0;
 return `<div class="kpis"><div class="kpi"><b>${nf(L)}</b><span>litres de sève</span></div><div class="kpi"><b>${ts.length}</b><span>voyages</span></div><div class="kpi"><b>${br?nf(br,1)+"°":"—"}</b><span>Brix moyen (pondéré)</span></div><div class="kpi"><b>≈ ${nf(sirupLbs(L,br||0))}</b><span>lbs de sirop potentiel</span></div></div>
 <div class="row" style="margin-bottom:10px"><span class="small">Sève ou concentré transporté vers la cabane.</span><span class="sp"></span><button class="btn sm" id="bCsvT">Exporter CSV</button><button class="btn sm pri" id="bAddT">+ Transport</button></div>
 ${ts.length?`<div class="tw"><table><thead><tr><th>Date</th>${sect==="*"?"<th>Érablière</th>":""}<th>Type</th><th class="n">Litres</th><th class="n">Brix</th><th class="hide-m">Par</th><th class="hide-m">Note</th></tr></thead><tbody>${ts.map(t=>`<tr class="click" data-tr="${t.id}"><td>${dlabel(t.date)} <span class="meta">${t.at?tlabel(t.at):""}</span></td>${sect==="*"?`<td>${esc(sectName(sectOf(t)))}</td>`:""}<td>${t.kind==="conc"?"Concentré":"Sève"}</td><td class="n">${nf(t.litres)}</td><td class="n">${t.brix?nf(t.brix,1)+"°":"—"}</td><td class="hide-m meta">${esc(t.byName||"")}</td><td class="hide-m meta">${esc(t.note||"")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Aucun transport cette saison.</div>`}`}
function vRapports(){const bs=pBarils(),ds=pDays(),ts=pTrans(),lbs=sum(bs,b=>b.poids),taps=tapsOf(sect),L=sum(ts,t=>t.litres);
 const byDay={};bs.forEach(b=>byDay[b.date]=(byDay[b.date]||0)+(+b.poids||0));const days=Object.keys(byDay).sort();const mx=Math.max(1,...Object.values(byDay));
 const byC=Object.keys(CLASSES).map(k=>[k,sum(bs.filter(b=>b.classe===k),b=>b.poids)]).filter(x=>x[1]);
 return `<div class="kpis"><div class="kpi"><b>${nf(lbs)}</b><span>lbs de sirop</span></div><div class="kpi"><b>${taps?nf(lbs/taps,2):"—"}</b><span>lbs / entaille</span><i>${taps?nf(taps)+" entailles (zones)":"Entrez les entailles dans les zones"}</i></div><div class="kpi"><b>${ds.length}</b><span>jours de production</span></div><div class="kpi"><b>${bs.length}</b><span>barils</span></div><div class="kpi"><b>${nf(L)}</b><span>litres de sève</span></div><div class="kpi"><b>${avgBrix(bs)?nf(avgBrix(bs),1)+"°":"—"}</b><span>Brix moyen sirop</span></div></div>
 <h3>Production par jour</h3>${days.length?`<div class="bars">${days.map(d=>`<div style="height:${byDay[d]/mx*100}%" title="${dlabel(d)} : ${nf(byDay[d])} lbs"></div>`).join("")}</div><div class="row meta" style="justify-content:space-between"><span>${dlabel(days[0])}</span><span>max ${nf(mx)} lbs</span><span>${dlabel(days[days.length-1])}</span></div>`:`<div class="empty">Pas encore de barils.</div>`}
 <h3 style="margin-top:16px">Répartition par couleur</h3>${byC.length?hbars(byC.map(([k,v])=>[CLASSES[k].l+" ("+k+")",v,CLASSES[k].c]),v=>nf(v)+" lbs"):`<div class="empty">—</div>`}
 <div class="row" style="margin-top:16px"><button class="btn sm" id="bCsvB">Barils CSV</button><button class="btn sm" id="bCsvD">Journées CSV</button><button class="btn sm" id="bCsvT">Transport CSV</button></div>`}
const hbars = (rows,fmt)=>{const mx=Math.max(1,...rows.map(r=>r[1]));return `<table><tbody>${rows.map(([l,v,c])=>`<tr><td style="width:40%">${esc(l)}</td><td><div style="height:14px;border-radius:4px;background:${c||"var(--forest2)"};width:${Math.max(2,v/mx*100)}%"></div></td><td class="n">${fmt(v)}</td></tr>`).join("")}</tbody></table>`};
function bProd(v){bindSeason(v);v.querySelectorAll("[data-pt]").forEach(b=>b.onclick=()=>{ptab=b.dataset.pt;render()});
 const on=(s,f)=>{const e=v.querySelector(s);if(e)e.onclick=f};
 on("#bStart",startDay);on("#bAddB",()=>editBaril(null));on("#bAddT",()=>editTrans(null));
 on("#bCsvB",()=>csv(`barils-${season}.csv`,[["No","Date","Érablière","Classe","Couleur","Poids lbs","Brix est.","Brix conf.","Statut","Acheteur","Note"],...pBarils().map(b=>[b.no,b.date,sectName(sectOf(b)),b.classe||"",CLASSES[b.classe]?.l||"",b.poids,b.brixEst||"",b.brixConf||"",(BSTAT[b.statut]||BSTAT.attente).l,b.acheteur||"",b.note||""])]));
 on("#bCsvD",()=>csv(`journees-${season}.csv`,[["Date","Érablière","T min","T max","hPa","Ciel","Lbs","Barils","Brix concentré","Statut","Note"],...pDays().map(d=>{const bs=dayBarils(d);return [d.date,sectName(sectOf(d)),d.tmin??"",d.tmax??"",d.hpa??"",d.ciel||"",sum(bs,b=>b.poids),bs.length,d.conc||"",d.statut||"",d.note||""]})]));
 on("#bCsvT",()=>csv(`transport-${season}.csv`,[["Date","Heure","Érablière","Type","Litres","Brix","Par","Note"],...pTrans().map(t=>[t.date,t.at?tlabel(t.at):"",sectName(sectOf(t)),t.kind==="conc"?"Concentré":"Sève",t.litres,t.brix||"",t.byName||"",t.note||""])]));
 v.querySelectorAll("[data-bf]").forEach(b=>b.onclick=()=>{bFilt=b.dataset.bf;render()});
 v.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{openDay=openDay===b.dataset.day?null:b.dataset.day;render()});
 v.querySelectorAll("[data-addb]").forEach(b=>b.onclick=()=>{const d=prod.find(x=>x.id===b.dataset.addb);editBaril(null,d)});
 v.querySelectorAll("[data-bar]").forEach(b=>b.onclick=()=>editBaril(barils.find(x=>x.id===b.dataset.bar)));
 v.querySelectorAll("[data-tr]").forEach(b=>b.onclick=()=>editTrans(transport.find(x=>x.id===b.dataset.tr)));
 v.querySelectorAll("[data-eday]").forEach(b=>b.onclick=()=>editDay(prod.find(x=>x.id===b.dataset.eday)));
 v.querySelectorAll("[data-met]").forEach(b=>b.onclick=async()=>{const d=prod.find(x=>x.id===b.dataset.met);b.disabled=true;const m=await meteoDay(d.date,sectOf(d));if(m){await store.upd("prod",d.id,m);toast("Météo mise à jour")}else toast("Météo non disponible");render()});
 v.querySelectorAll("[data-end]").forEach(b=>b.onclick=async()=>{await store.upd("prod",b.dataset.end,{statut:"conclue"});render()});
 v.querySelectorAll("[data-reo]").forEach(b=>b.onclick=async()=>{await store.upd("prod",b.dataset.reo,{statut:"en_cours"});render()})}
function startDay(){const go=async s=>{const d=today(),id=d+"_"+s;const ex=prod.find(x=>x.id===id);if(ex){openDay=id;season=CUR;closeSheet();render();return}
  const rec={date:d,sect:s,season:seasonOf(d),statut:"en_cours",by:me.uid,byName:me.nom,at:new Date().toISOString(),src:"manuel"};await store.set("prod",id,rec);openDay=id;season=CUR;closeSheet();render();
  const m=await meteoDay(d,s);if(m){await store.upd("prod",id,m);render()}};
 if(sect!=="*")return go(sect);
 openSheet(hd("Démarrer la journée")+`<p class="small">Pour quelle érablière / cabane ?</p><div class="row" style="flex-direction:column;align-items:stretch">${sectors.map(s=>`<button class="btn" data-go="${s.id}">${esc(s.nom)}</button>`).join("")}</div>`);
 $("#sheet").querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go))}
function editDay(d){openSheet(hd("Journée du "+dlabel(d.date))+`
 <div class="grid3"><div><label class="f" for="dTn">T min (°C)</label><input type="number" step="0.1" id="dTn" value="${d.tmin??""}"></div><div><label class="f" for="dTx">T max (°C)</label><input type="number" step="0.1" id="dTx" value="${d.tmax??""}"></div><div><label class="f" for="dP">Pression (hPa)</label><input type="number" id="dP" value="${d.hpa??""}"></div></div>
 <div class="grid2"><div><label class="f" for="dC">Ciel</label><input type="text" id="dC" value="${esc(d.ciel||"")}"></div><div><label class="f" for="dCo">Brix concentré</label><input type="number" step="0.1" id="dCo" value="${d.conc??""}"></div></div>
 <label class="f" for="dN">Note (osmose, lavage, problème…)</label><textarea id="dN">${esc(d.note||"")}</textarea>
 <div class="row" style="margin-top:14px"><button class="btn pri" id="dOk" style="flex:1">Enregistrer</button>${isAd()?`<button class="btn red" id="dDel">Supprimer</button>`:""}</div>`);
 const n=id=>{const x=$(id).value;return x===""?null:+x};
 $("#dOk").onclick=async()=>{await store.upd("prod",d.id,{tmin:n("#dTn"),tmax:n("#dTx"),hpa:n("#dP"),ciel:$("#dC").value.trim(),conc:n("#dCo"),note:$("#dN").value.trim()});closeSheet();render()};
 const dd=$("#dDel");if(dd)dd.onclick=async()=>{if(dayBarils(d).length&&!confirmBox("Cette journée a des barils. Supprimer quand même la journée (les barils restent) ?"))return;await store.del("prod",d.id);closeSheet();render()}}
function editBaril(b,day){const n=!b;const nums=barils.map(x=>parseInt(x.no)).filter(x=>!isNaN(x));
 b=b||{no:"",date:day?day.date:today(),sect:day?sectOf(day):(sect==="*"?sectors[0].id:sect),classe:"",poids:"",brixEst:"",brixConf:"",statut:"attente",acheteur:ls.get("gest_buyer",""),note:""};
 let cl=b.classe||"",stt=b.statut||"attente";const buyers=[...new Set(barils.map(x=>x.acheteur).filter(Boolean))];
 openSheet(hd(n?"Nouveau baril":"Baril #"+esc(b.no))+`
 <div class="grid2"><div><label class="f" for="bNo">Numéro du baril</label><input type="text" id="bNo" inputmode="numeric" value="${esc(b.no)}" placeholder="Ex. 16948"></div><div><label class="f" for="bD">Date de production</label><input type="date" id="bD" value="${b.date}"></div></div>
 <label class="f" for="bS">Érablière</label><select id="bS">${sectors.map(s=>`<option value="${s.id}" ${s.id===sectOf(b)?"selected":""}>${esc(s.nom)}</option>`).join("")}</select>
 <label class="f">Couleur / classe</label>${chips("cl",[["","À classer"],...Object.entries(CLASSES).map(([k,v])=>[k,v.l+" ("+k+")"])],cl)}
 <div class="grid3"><div><label class="f" for="bP">Poids (lbs)</label><input type="number" id="bP" inputmode="decimal" value="${b.poids}"></div><div><label class="f" for="bBe">Brix estimé</label><input type="number" step="0.1" id="bBe" value="${b.brixEst}"></div><div><label class="f" for="bBc">Brix confirmé</label><input type="number" step="0.1" id="bBc" value="${b.brixConf}"></div></div>
 <label class="f">Statut</label>${chips("bs",Object.entries(BSTAT).map(([k,v])=>[k,v.l]),stt)}
 <label class="f" for="bA">Acheteur / compagnie</label><input type="text" id="bA" list="buyers" value="${esc(b.acheteur||"")}" placeholder="Ex. PPAQ, Citadelle…"><datalist id="buyers">${buyers.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
 <label class="f" for="bN">Note</label><textarea id="bN">${esc(b.note||"")}</textarea>
 <div class="row" style="margin-top:14px"><button class="btn pri" id="bOk" style="flex:1">Enregistrer</button>${n?"":`<button class="btn red" id="bDel">Supprimer</button>`}</div><div class="err" id="bErr"></div>`);
 if(n&&!b.no&&nums.length)$("#bNo").placeholder="Ex. "+(Math.max(...nums)+1);
 pick("cl",k=>cl=k);pick("bs",k=>stt=k);
 $("#bOk").onclick=async()=>{const no=$("#bNo").value.trim(),p=+$("#bP").value,d=$("#bD").value;if(!no||!(p>0)||!d){$("#bErr").textContent="Numéro, date et poids sont requis.";return}
  if(n&&barils.some(x=>String(x.no)===no&&x.season===seasonOf(d))){$("#bErr").textContent="Ce numéro existe déjà cette saison.";return}
  const s=$("#bS").value,rec={...(n?{}:b),no,date:d,sect:s,season:seasonOf(d),classe:cl,poids:p,brixEst:+$("#bBe").value||null,brixConf:+$("#bBc").value||null,statut:stt,acheteur:$("#bA").value.trim(),note:$("#bN").value.trim()};delete rec.id;
  if(n)Object.assign(rec,{by:me.uid,byName:me.nom,at:new Date().toISOString(),src:"manuel"});ls.set("gest_buyer",rec.acheteur);
  const did=d+"_"+s;if(!prod.find(x=>x.id===did)){await store.set("prod",did,{date:d,sect:s,season:seasonOf(d),statut:"en_cours",by:me.uid,byName:me.nom,at:new Date().toISOString(),src:"auto-baril"});meteoDay(d,s).then(m=>m&&store.upd("prod",did,m))}
  await store.set("barils",n?nid("b"):b.id,rec);closeSheet();render()};
 if(!n)$("#bDel").onclick=async()=>{if(!confirmBox("Supprimer le baril #"+b.no+" ?"))return;await store.del("barils",b.id);closeSheet();render()}}
function editTrans(t){const n=!t;t=t||{date:today(),sect:sect==="*"?sectors[0].id:sect,kind:"seve",litres:"",brix:"",note:""};let k=t.kind||"seve";
 openSheet(hd(n?"Transport d'eau":"Transport du "+dlabel(t.date))+`
 <label class="f">Type</label>${chips("tk",[["seve","Sève"],["conc","Concentré"]],k)}
 <div class="grid2"><div><label class="f" for="tD">Date</label><input type="date" id="tD" value="${t.date}"></div><div><label class="f" for="tS">Provenance</label><select id="tS">${sectors.map(s=>`<option value="${s.id}" ${s.id===sectOf(t)?"selected":""}>${esc(s.nom)}</option>`).join("")}</select></div></div>
 <div class="grid2"><div><label class="f" for="tL">Litres</label><input type="number" id="tL" inputmode="decimal" value="${t.litres}"></div><div><label class="f" for="tB">Brix</label><input type="number" step="0.1" id="tB" inputmode="decimal" value="${t.brix}"></div></div>
 <label class="f" for="tN">Note (camion, réservoir…)</label><textarea id="tN">${esc(t.note||"")}</textarea>
 <div class="row" style="margin-top:14px"><button class="btn pri" id="tOk" style="flex:1">Enregistrer</button>${n?"":`<button class="btn red" id="tDel">Supprimer</button>`}</div><div class="err" id="tErr"></div>`);
 pick("tk",x=>k=x);
 $("#tOk").onclick=async()=>{const L=+$("#tL").value,d=$("#tD").value;if(!(L>0)||!d){$("#tErr").textContent="Entrez la date et les litres.";return}
  const rec={...(n?{}:t),date:d,sect:$("#tS").value,season:seasonOf(d),kind:k,litres:L,brix:+$("#tB").value||null,note:$("#tN").value.trim()};delete rec.id;
  if(n)Object.assign(rec,{by:me.uid,byName:me.nom,at:new Date().toISOString(),src:"manuel"});await store.set("transport",n?nid("t"):t.id,rec);closeSheet();render()};
 if(!n)$("#tDel").onclick=async()=>{if(!confirmBox("Supprimer ce transport ?"))return;await store.del("transport",t.id);closeSheet();render()}}

// ---------- planification
let plSect=null, plMap=null, elev=ls.get("gest_elev",{});
const ckey = l=>l.id+":"+l.c.length+":"+l.c.slice(0,30);
function sample(c,step=10){const out=[[c[0][0],c[0][1],0]];let dist=0;for(let i=1;i<c.length;i++){const a=c[i-1],b=c[i],d=hav(a,b);const n=Math.max(1,Math.round(d/step));for(let k=1;k<=n;k++){const t=k/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,dist+d*t])}dist+=d}return out}
async function fetchElev(pts){const z=[];for(let i=0;i<pts.length;i+=100){const ch=pts.slice(i,i+100);const r=await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${ch.map(p=>p[1].toFixed(6)).join(",")}&longitude=${ch.map(p=>p[0].toFixed(6)).join(",")}`);if(!r.ok)throw new Error("Service d'élévation : "+r.status);const j=await r.json();z.push(...j.elevation)}return z}
function slopeStats(l){const e=elev[ckey(l)];if(!e)return null;let {d,z}=e;if(z[0]<z[z.length-1]){const L=d[d.length-1];d=d.map(x=>L-x).reverse();z=z.slice().reverse()} // sens de l'eau : du haut vers le bas
 const L=d[d.length-1]||1,avg=(z[0]-z[z.length-1])/L*100;let minS=Infinity,ups=0,low=[];
 for(let i=0;i<d.length;i++){let j=i;while(j<d.length-1&&d[j]-d[i]<30)j++;if(d[j]-d[i]>=15){const s=(z[i]-z[j])/(d[j]-d[i])*100;if(s<minS)minS=s}}
 for(let i=1;i<z.length-1;i++){if(z[i]<z[i-1]-.01&&z[i]<=z[i+1]){let k=i+1;while(k<z.length&&z[k]<=z[i]+.5)k++;if(k<z.length&&z[k]>z[i]+.5){low.push(i);ups++}}}
 return {avg,min:minS===Infinity?avg:minS,ups,low,d,z,top:z[0],bot:z[z.length-1]}}
const sCol = s=>{const p=PL();return s==null?"#9aa":s<1?"#e5432b":s<p.pMin?"#f08a00":s<p.pCible?"#e0c000":"#2fa85f"};
function lineTaps(l,ls_){if(+l.ent)return {n:+l.ent,est:false};const z=zonesOf(plSect),pot=z.reduce((a,x)=>a+(+x.pot||0),0),tot=ls_.reduce((a,x)=>a+x.len,0);return {n:pot&&tot?Math.round(pot*l.len/tot):0,est:true}}
function vPlanif(){if(!plSect||!sectors.find(s=>s.id===plSect))plSect=sect==="*"?(sectors[0]||{}).id:sect;
 const L=linesOf(plSect),p=PL(),done=L.filter(l=>elev[ckey(l)]).length;
 const rows=L.map(l=>({l,s:slopeStats(l),t:lineTaps(l,L)}));
 const totLen=sum(L,l=>l.len),totTaps=sum(rows,r=>r.t.n);
 return `<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">${ico("route",22)} Planification</h2><span class="sp"></span>
  <select id="plS" style="width:auto">${sectors.map(s=>`<option value="${s.id}" ${s.id===plSect?"selected":""}>${esc(s.nom)}</option>`).join("")}</select></div>
  <div id="plmap"></div>
  <div class="legend"><span><i style="background:#2fa85f"></i>≥ ${p.pCible} %</span><span><i style="background:#e0c000"></i>${p.pMin}–${p.pCible} %</span><span><i style="background:#f08a00"></i>1–${p.pMin} %</span><span><i style="background:#e5432b"></i>&lt; 1 %</span><span><i style="background:#e5432b;width:10px;height:10px;border-radius:50%"></i>creux (montée à vérifier)</span><span><i style="background:#9aa"></i>pas calculé</span></div>
  <div class="row" style="margin-top:12px"><button class="btn pri" id="bElev">${done?"Recalculer les pentes":"Calculer les pentes"}</button><span class="small" id="elMsg">${done}/${L.length} lignes calculées · élévation Copernicus 90 m (Open-Meteo) : pente indicative, à confirmer au terrain.</span></div></div>
 <div class="card"><h2>Maîtres-lignes · ${L.length}</h2>
  <div class="kpis"><div class="kpi"><b>${nf(totLen)} m</b><span>${nf(totLen*3.28084)} pi de maître-ligne</span></div><div class="kpi"><b>${nf(totTaps)}</b><span>entailles</span><i>${rows.some(r=>r.t.est)?"≈ = estimé selon le potentiel de la zone":""}</i></div><div class="kpi"><b>${nf(totTaps/(p.tapsPerLat||5))}</b><span>latéraux (≈ ${p.tapsPerLat} entailles/latéral)</span></div></div>
  ${L.length?`<div class="tw"><table><thead><tr><th>Ligne</th><th class="n">Longueur</th><th class="n">Entailles</th><th>Diamètre</th><th class="n">Pente moy.</th><th class="n hide-m">Pente min.</th><th class="n">Creux</th></tr></thead><tbody>
  ${rows.map(({l,s,t})=>`<tr><td><span class="badge" style="--c:${sCol(s&&s.avg)}">${esc(l.name||"Ligne")}</span></td><td class="n">${nf(l.len)} m</td>
   <td class="n">${isAd()?`<input type="number" data-ent="${l.id}" value="${+l.ent||""}" placeholder="${t.est?"≈"+t.n:""}" style="width:86px;min-height:36px;padding:4px 8px;text-align:right">`:(t.est?"≈":"")+nf(t.n)}</td>
   <td>${isAd()?`<select data-dia="${l.id}" style="width:auto;min-height:36px;padding:4px 8px">${DIAS.map(d=>`<option ${d===(l.dia||"1\"")?"selected":""}>${esc(d)}</option>`).join("")}</select>`:esc(l.dia||"1\"")}</td>
   <td class="n">${s?nf(s.avg,1)+" %":"—"}</td><td class="n hide-m">${s?nf(s.min,1)+" %":"—"}</td><td class="n">${s?(s.ups?`<b style="color:var(--maple)">${s.ups}</b>`:"0"):"—"}</td></tr>
   ${s?`<tr><td colspan="7" style="padding-top:0">${profile(s)}</td></tr>`:""}`).join("")}</tbody></table></div>`:`<div class="empty">Aucune maître-ligne dans ce secteur. Tracez-les dans l'app terrain (Carte › Modifier).</div>`}
  ${isAd()?"":`<p class="small">Seul un administrateur peut changer les entailles et diamètres.</p>`}</div>
 <div class="card">${materiel(rows)}</div>`}
function profile(s){const W=600,H=60,zs=s.z,mn=Math.min(...zs),mx=Math.max(...zs),r=Math.max(1,mx-mn),L=s.d[s.d.length-1]||1;
 const pt=(i)=>[(s.d[i]/L*W).toFixed(1),(H-4-(zs[i]-mn)/r*(H-12)).toFixed(1)];
 return `<svg class="prof" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:46px"><path d="M${zs.map((_,i)=>pt(i).join(",")).join("L")}L${W},${H}L0,${H}Z" fill="color-mix(in srgb,${sCol(s.avg)} 22%,transparent)"/><path d="M${zs.map((_,i)=>pt(i).join(",")).join("L")}" fill="none" stroke="${sCol(s.avg)}" stroke-width="2" vector-effect="non-scaling-stroke"/>${s.low.map(i=>{const [x,y]=pt(i);return `<circle cx="${x}" cy="${y}" r="4" fill="#e5432b"/>`}).join("")}</svg><div class="meta" style="display:flex;justify-content:space-between;margin-top:-4px"><span>haut ${nf(s.top)} m</span><span>dénivelé ${nf(s.top-s.bot,1)} m</span><span>bas ${nf(s.bot)} m</span></div>`}
function materiel(rows){const p=PL(),pr=P_(),taps=sum(rows,r=>r.t.n),lat=Math.ceil(taps/(p.tapsPerLat||5));
 const mlBy={};rows.forEach(({l})=>{const d=l.dia||"1\"";mlBy[d]=(mlBy[d]||0)+l.len*3.28084});
 const it=[["lat",taps*p.ftPerTap],...Object.entries(mlBy).filter(([d])=>d!=="5/16\"").map(([d,ft])=>["ml_"+d,ft]),["chal",taps],["te",taps],["chute",taps],["selle",lat],["cap",rows.length],["fil",sum(rows,r=>r.l.len)*3.28084],["ancre",rows.length*2]];
 if(mlBy["5/16\""])it[0][1]+=mlBy["5/16\""];
 const extra=((cfg["couts_"+plSect]||{}).items)||[];
 const lines=it.filter(x=>x[1]>0).map(([k,q])=>{const d=PRIX0.find(x=>x.k===k)||{l:k,u:"pi"},v=pr[k]||{min:0,max:0};return {l:d.l,u:d.u,q:Math.round(q),min:v.min,max:v.max}});
 const tmin=sum(lines,x=>x.q*x.min)+sum(extra,x=>x.min),tmax=sum(lines,x=>x.q*x.max)+sum(extra,x=>x.max);
 return `<h2>Matériel et coûts estimés</h2><p class="small" style="margin-top:0">${nf(taps)} entailles · ${p.ftPerTap} pi de 5/16" par entaille · ${p.tapsPerLat} entailles par latéral. Prix modifiables dans Réglages.</p>
 <div class="tw"><table><thead><tr><th>Composante</th><th class="n">Qté</th><th class="n hide-m">Prix min</th><th class="n hide-m">Prix max</th><th class="n">Total min</th><th class="n">Total max</th></tr></thead><tbody>
 ${lines.map(x=>`<tr><td>${esc(x.l)}<div class="meta">${x.u}</div></td><td class="n">${nf(x.q)}</td><td class="n hide-m meta">${money(x.min)}</td><td class="n hide-m meta">${money(x.max)}</td><td class="n">${money(x.q*x.min)}</td><td class="n">${money(x.q*x.max)}</td></tr>`).join("")}
 ${extra.map((x,i)=>`<tr><td>${esc(x.l)}<div class="meta">coût additionnel</div></td><td></td><td class="hide-m"></td><td class="hide-m"></td><td class="n">${money(x.min)}</td><td class="n">${money(x.max)} ${isAd()?`<button class="btn sm" data-xdel="${i}" title="Retirer">×</button>`:""}</td></tr>`).join("")}
 <tr><td colspan="4" class="hide-m"></td><td class="n" style="font-weight:700;color:var(--forest2)" colspan="1">${money(tmin)}</td><td class="n" style="font-weight:700;color:var(--forest2)">${money(tmax)}</td></tr></tbody></table></div>
 ${isAd()?`<button class="btn sm" id="bXadd" style="margin-top:10px">+ Coût additionnel (main-d'œuvre, sous-traitance…)</button>`:""}`}
function bPlanif(v){const s=v.querySelector("#plS");s.onchange=()=>{plSect=s.value;render()};
 const L=linesOf(plSect),Z=zonesOf(plSect);
 if(plMap){plMap.remove();plMap=null}
 plMap=L_map(v.querySelector("#plmap"));
 Z.forEach(z=>window.L.polygon(z.coords.map(p=>[p[1],p[0]]),{color:"#ff4fa3",weight:2,fillOpacity:.06}).addTo(plMap));
 const all=[];L.forEach(l=>{const s=slopeStats(l),ll=l.coords.map(p=>[p[1],p[0]]);all.push(...ll);
  window.L.polyline(ll,{color:"#000",weight:7,opacity:.35}).addTo(plMap);
  window.L.polyline(ll,{color:sCol(s&&s.avg),weight:4}).bindTooltip(`${esc(l.name)}${s?" · "+nf(s.avg,1)+" %":""}`,{permanent:L.length<=25,direction:"center",className:"lbl"}).addTo(plMap);
  if(s){const e=elev[ckey(l)],pts=e.pts;const rev=e.z[0]<e.z[e.z.length-1];s.low.forEach(i=>{const k=rev?e.z.length-1-i:i;const p=pts[k];if(p)window.L.circleMarker([p[1],p[0]],{radius:6,color:"#fff",weight:2,fillColor:"#e5432b",fillOpacity:1}).bindTooltip("Creux : montée à vérifier").addTo(plMap)})}});
 Z.forEach(z=>all.push(...z.coords.map(p=>[p[1],p[0]])));
 if(all.length)plMap.fitBounds(all,{padding:[20,20]});else plMap.setView(centerOf(plSect),15);
 v.querySelector("#bElev").onclick=async e=>{const b=e.currentTarget;b.disabled=true;let i=0;
  try{for(const l of L){i++;$("#elMsg").textContent=`Calcul ${i}/${L.length} : ${l.name}…`;const pts=sample(l.coords,10);const z=await fetchElev(pts);elev[ckey(l)]={d:pts.map(p=>p[2]),z,pts:pts.map(p=>[+p[0].toFixed(6),+p[1].toFixed(6)])};ls.set("gest_elev",elev)}toast("Pentes calculées");render()}
  catch(err){$("#elMsg").textContent="Erreur : "+err.message;b.disabled=false}};
 v.querySelectorAll("[data-ent]").forEach(inp=>inp.onchange=async()=>{await store.upd("couche",inp.dataset.ent,{ent:+inp.value||0});toast("Entailles enregistrées")});
 v.querySelectorAll("[data-dia]").forEach(sel=>sel.onchange=async()=>{await store.upd("couche",sel.dataset.dia,{dia:sel.value});toast("Diamètre enregistré")});
 const xa=v.querySelector("#bXadd");if(xa)xa.onclick=()=>{openSheet(hd("Coût additionnel")+`<label class="f" for="xL">Description</label><input type="text" id="xL" placeholder="Ex. Main-d'œuvre installation"><div class="grid2"><div><label class="f" for="xMi">Montant min ($)</label><input type="number" id="xMi"></div><div><label class="f" for="xMa">Montant max ($)</label><input type="number" id="xMa"></div></div><div class="row" style="margin-top:14px"><button class="btn pri" id="xOk" style="flex:1">Ajouter</button></div>`);
  $("#xOk").onclick=async()=>{const l=$("#xL").value.trim(),mi=+$("#xMi").value||0,ma=+$("#xMa").value||mi;if(!l)return;const k="couts_"+plSect,cur=((cfg[k]||{}).items)||[];await store.set("config",k,{items:[...cur,{l,min:mi,max:ma}]});closeSheet();render()}};
 v.querySelectorAll("[data-xdel]").forEach(b=>b.onclick=async()=>{const k="couts_"+plSect,cur=(((cfg[k]||{}).items)||[]).slice();cur.splice(+b.dataset.xdel,1);await store.set("config",k,{items:cur});render()})}
function L_map(el){const m=window.L.map(el,{zoomControl:true,attributionControl:true});
 window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:20,maxNativeZoom:19,attribution:"Imagerie © Esri"}).addTo(m);return m}

// ---------- statistiques
function vStats(){const H=heures.filter(h=>inSect(h)&&(h.season??seasonOf(h.date))===season&&!h.open);const O=obs.filter(o=>inSect(o)&&(o.season??seasonOf(o.at))===season);
 const tot=sum(H,h=>h.h),open=O.filter(o=>!TYPES[o.type]?.w&&o.status==="ouvert"),fixed=O.filter(o=>o.status==="repare"&&o.doneAt);
 const rep=fixed.length?sum(fixed,o=>(new Date(o.doneAt)-new Date(o.at))/86400000)/fixed.length:null;
 const byCat=CATS.map(c=>[c.l,sum(H.filter(h=>catOf(h).k===c.k),h=>h.h),c.c]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
 const byP={};H.forEach(h=>byP[h.byName||"—"]=(byP[h.byName||"—"]||0)+(+h.h||0));
 const byT=Object.entries(TYPES).filter(([k,t])=>!t.w).map(([k,t])=>[t.l,O.filter(o=>o.type===k).length,t.c]).filter(x=>x[1]);
 const wk={};H.forEach(h=>{const d=new Date(h.date+"T12:00");d.setDate(d.getDate()-((d.getDay()+6)%7));const k=d.toISOString().slice(0,10);wk[k]=(wk[k]||0)+(+h.h||0)});const wks=Object.keys(wk).sort().slice(-16),wmx=Math.max(1,...wks.map(k=>wk[k]));
 const bs=pBarils();
 return `<div class="card"><div class="row"><h2 style="margin:0">${ico("chart",22)} Statistiques · ${esc(sectName(sect))}</h2><span class="sp"></span>${seasonSel()}</div></div>
 <div class="kpis"><div class="kpi"><b>${nf(tot)}</b><span>heures travaillées</span></div><div class="kpi"><b>${nf(sum(bs,b=>b.poids))}</b><span>lbs de sirop</span></div><div class="kpi"><b style="color:var(--maple)">${open.length}</b><span>bris / problèmes ouverts</span></div><div class="kpi"><b>${fixed.length}</b><span>réparés</span></div><div class="kpi"><b>${rep!=null?nf(rep,1)+" j":"—"}</b><span>délai moyen de réparation</span></div><div class="kpi"><b>${tot&&sum(bs,b=>b.poids)?nf(sum(bs,b=>b.poids)/tot,1):"—"}</b><span>lbs par heure travaillée</span></div></div>
 <div class="grid2"><div class="card"><h2>Heures par catégorie</h2>${byCat.length?hbars(byCat,hfmt):`<div class="empty">Aucune heure.</div>`}</div>
 <div class="card"><h2>Signalements par type</h2>${byT.length?hbars(byT,v=>v):`<div class="empty">Aucun signalement.</div>`}</div></div>
 <div class="card"><h2>Heures par semaine</h2>${wks.length?`<div class="bars">${wks.map(k=>`<div style="height:${wk[k]/wmx*100}%" title="Semaine du ${dlabel(k)} : ${hfmt(wk[k])}"></div>`).join("")}</div><div class="row meta" style="justify-content:space-between"><span>${dlabel(wks[0])}</span><span>max ${hfmt(wmx)}</span><span>${dlabel(wks[wks.length-1])}</span></div>`:`<div class="empty">—</div>`}</div>
 ${isAd()?`<div class="card"><h2>Heures par personne</h2>${Object.keys(byP).length?hbars(Object.entries(byP).sort((a,b)=>b[1]-a[1]),hfmt):`<div class="empty">—</div>`}<div class="row" style="margin-top:10px"><button class="btn sm" id="bCsvH">Exporter les heures (CSV)</button></div></div>`:""}`}
function bStats(v){bindSeason(v);const b=v.querySelector("#bCsvH");if(b)b.onclick=()=>{const H=heures.filter(h=>inSect(h)&&(h.season??seasonOf(h.date))===season);csv(`heures-${season}.csv`,[["Date","Personne","Catégorie","Érablière","Début","Fin","Heures","Note"],...H.map(h=>[h.date,h.byName,catOf(h).l,sectName(sectOf(h)),h.start?tlabel(h.start):"",h.end?tlabel(h.end):"",h.open?"en cours":h.h,h.note||""])])}}

// ---------- accueil
let metNow=null,metAt=0;
function vAccueil(){const td=today(),bs=barils.filter(b=>inSect(b)&&b.date===td),sb=barils.filter(b=>inSect(b)&&b.season===CUR),tr=transport.filter(t=>inSect(t)&&t.date===td);
 const now=heures.filter(h=>h.open&&inSect(h)),open=obs.filter(o=>inSect(o)&&!TYPES[o.type]?.w&&o.status==="ouvert").sort(byPrio),op=openPunch(),mine=open.filter(o=>asgOf(o).some(a=>a.email===me.email));
 return `<div class="kpis"><div class="kpi"><b>${nf(sum(bs,b=>b.poids))}</b><span>lbs aujourd'hui</span><i>${bs.length} baril(s)</i></div><div class="kpi"><b>${nf(sum(sb,b=>b.poids))}</b><span>lbs saison ${CUR}</span><i>${sb.length} barils</i></div><div class="kpi"><b>${nf(sum(tr,t=>t.litres))}</b><span>litres de sève aujourd'hui</span></div><div class="kpi"><b style="color:var(--maple)">${open.length}</b><span>bris ouverts</span></div><div class="kpi" id="metK"><b>${metNow?nf(metNow.t,1)+"°":"…"}</b><span>${metNow?esc(metNow.ciel)+" · "+metNow.hpa+" hPa":"météo"}</span><i>${metNow?"min "+nf(metNow.tmin,0)+"° / max "+nf(metNow.tmax,0)+"°":""}</i></div></div>
 <div class="grid2"><div class="card"><h2>${ico("clock",22)} Punch</h2>${op?`<p>Vous êtes punché : <b>${esc(catOf(op).l)}</b> depuis ${tlabel(op.start)}.</p>`:`<p class="small">Vous n'êtes pas punché.</p>`}<button class="btn ${op?"red":"g"}" data-go="punch">${op?"Punch sortie":"Punch entrée"}</button>
   <h3 style="margin-top:14px">En ce moment</h3>${now.length?now.map(h=>`<div class="who"><span class="dot"></span><div style="flex:1"><b>${esc(h.byName)}</b> <span class="meta">${esc(catOf(h).l)}</span></div><span class="meta">${tlabel(h.start)}</span></div>`).join(""):`<div class="small">Personne.</div>`}</div>
  <div class="card"><h2>Bris ouverts</h2>${open.length?`<table><tbody>${open.slice(0,8).map(o=>`<tr><td><span class="badge" style="--c:${TYPES[o.type]?.c||"#777"}">${esc(TYPES[o.type]?.l||o.type)}</span></td><td>${prOf(o)!=="normale"?`<span class="badge" style="--c:${PRIOS[prOf(o)].c}">${PRIOS[prOf(o)].l}</span>`:""} <span class="meta">${esc(asgOf(o).map(a=>a.nom).join(", ")||sectName(sectOf(o)))}</span></td><td class="n meta">${ago(o.at)}</td></tr>`).join("")}</tbody></table>${mine.length?`<p class="small" style="color:#7a4fd6"><b>${mine.length}</b> assigné(s) à vous.</p>`:""}`:`<div class="empty">Aucun bris ouvert.</div>`}<a class="btn sm" href="../" style="display:inline-block;margin-top:10px;text-decoration:none">Ouvrir la carte terrain</a></div></div>
 <div class="card"><h2>Activité récente</h2>${acts.filter(inSect).slice(0,8).map(a=>`<div class="who"><div style="flex:1">${esc(a.text)}<div class="meta">${esc(a.byName||"")} · ${ago(a.at)}</div></div></div>`).join("")||`<div class="empty">—</div>`}</div>
 <div class="row hide-m-not"><button class="btn" id="bTv2">${ico("chart",18)} Afficher en vue (écran de la cabane)</button></div>`}
function bAccueil(v){v.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{tab=b.dataset.go;ls.set("gest_tab",tab);nav();render()});v.querySelector("#bTv2").onclick=startTv;
 if(Date.now()-metAt>600000){metAt=Date.now();meteoNow(sect==="*"?(sectors[0]||{}).id:sect).then(m=>{if(m){metNow=m;if(tab==="accueil")render()}})}}

// ---------- vue TV (écran à la cabane)
let tvI=0,tvMet=null;
function startTv(){document.body.classList.add("tv");try{document.documentElement.requestFullscreen?.()}catch(e){}history.replaceState(null,"","?tv=1");
 const tick=()=>{renderTv()};clearInterval(tvI);tvI=setInterval(tick,30000);
 const met=()=>meteoNow(sect==="*"?(sectors[0]||{}).id:sect).then(m=>{tvMet=m;renderTv()});met();setInterval(met,900000);renderTv()}
function stopTv(){document.body.classList.remove("tv");clearInterval(tvI);history.replaceState(null,"",location.pathname);try{document.exitFullscreen?.()}catch(e){}render()}
function renderTv(){if(!document.body.classList.contains("tv"))return;const td=today(),bs=barils.filter(b=>inSect(b)&&b.date===td),sb=barils.filter(b=>inSect(b)&&b.season===CUR),tr=transport.filter(t=>inSect(t)&&t.date===td);
 const now=heures.filter(h=>h.open&&inSect(h)),open=obs.filter(o=>inSect(o)&&!TYPES[o.type]?.w&&o.status==="ouvert").sort(byPrio);const t=new Date();
 $("#view").innerHTML=`<div class="tvw"><div class="tvh"><svg width="56" height="57" aria-hidden="true"><use href="#leaf"/></svg><h1>${esc(sectName(sect))}</h1><div class="tvclock">${t.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}</div></div>
 <div class="tvg">
  <div class="tvt"><span>Sirop aujourd'hui</span><b>${nf(sum(bs,b=>b.poids))}<small> lbs</small></b><span>${bs.length} baril(s)</span></div>
  <div class="tvt"><span>Saison ${CUR}</span><b>${nf(sum(sb,b=>b.poids))}<small> lbs</small></b><span>${sb.length} barils · ${tapsOf(sect)?nf(sum(sb,b=>b.poids)/tapsOf(sect),2)+" lbs/entaille":""}</span></div>
  <div class="tvt"><span>Sève reçue aujourd'hui</span><b>${nf(sum(tr,x=>x.litres))}<small> L</small></b><span>${tr.length} voyage(s)</span></div>
  <div class="tvt"><span>Météo</span><b>${tvMet?nf(tvMet.t,1)+"°":"—"}</b><span>${tvMet?esc(tvMet.ciel)+" · "+tvMet.hpa+" hPa · vent "+tvMet.vent+" km/h":""}</span></div>
  <div class="tvt w2"><span>En ce moment · ${now.length} au travail</span><ul>${now.slice(0,6).map(h=>`<li><b style="font:inherit;flex:1">${esc(h.byName)}</b><span style="font-size:inherit;text-transform:none">${esc(catOf(h).l)} · depuis ${tlabel(h.start)}</span></li>`).join("")||"<li>Personne de punché</li>"}</ul></div>
  <div class="tvt w2"><span>Bris ouverts · ${open.length}</span><ul>${open.slice(0,6).map(o=>`<li><span style="font-size:inherit;text-transform:none;color:${TYPES[o.type]?.c};flex:1">${esc(TYPES[o.type]?.l||o.type)}</span><span style="font-size:inherit;text-transform:none">${prOf(o)==="urgent"?"🚨 ":""}${esc(asgOf(o).map(a=>a.nom).join(", ")||sectName(sectOf(o)))} · ${ago(o.at)}</span></li>`).join("")||"<li>Aucun</li>"}</ul></div>
 </div><div class="tvf">${acts.filter(inSect).slice(0,3).map(a=>esc(a.text)+" ("+esc(a.byName||"")+", "+ago(a.at)+")").join("   ·   ")||"Érablières Grégoire"}  <button class="btn sm" id="tvX" style="float:right;background:#ffffff14;color:#9fb5a7;border-color:#23342a">Quitter la vue</button></div></div>`;
 $("#tvX").onclick=stopTv}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("tv"))stopTv()});

// ---------- réglages
function vReg(){const pr=P_(),p=PL();
 return `<div class="card"><h2>${ico("gear",22)} Réglages</h2><div class="small">${esc(me.nom)}${me.email?" · "+esc(me.email):""} · ${isAd()?"administrateur":"membre"}${store.kind==="local"?" · mode essai (données sur cet appareil)":""}</div>
  <div class="row" style="margin-top:10px"><a class="btn" href="../" style="text-decoration:none">Ouvrir l'app terrain (carte)</a>${store.kind==="fire"?`<button class="btn" id="bOut">Se déconnecter</button>`:""}</div>
  <p class="small">Pour installer : iPhone, Safari › Partager › « Sur l'écran d'accueil ». Android, Chrome › ⋮ › « Installer l'application ».</p></div>
 <div class="card"><h2>Planification</h2><div class="grid2"><div><label class="f" for="rFt">Pieds de 5/16" par entaille</label><input type="number" step="0.5" id="rFt" value="${p.ftPerTap}" ${isAd()?"":"disabled"}></div><div><label class="f" for="rTl">Entailles par latéral</label><input type="number" id="rTl" value="${p.tapsPerLat}" ${isAd()?"":"disabled"}></div>
  <div><label class="f" for="rPm">Pente minimale maître-ligne (%)</label><input type="number" step="0.5" id="rPm" value="${p.pMin}" ${isAd()?"":"disabled"}></div><div><label class="f" for="rPc">Pente cible (%)</label><input type="number" step="0.5" id="rPc" value="${p.pCible}" ${isAd()?"":"disabled"}></div></div>
  ${isAd()?`<div class="row" style="margin-top:12px"><button class="btn pri" id="bPl">Enregistrer</button></div>`:""}</div>
 <div class="card"><h2>Prix du matériel</h2><p class="small" style="margin-top:0">Utilisés pour l'estimation des coûts dans Planification.</p><div class="tw"><table><thead><tr><th>Composante</th><th class="n">Min ($)</th><th class="n">Max ($)</th></tr></thead><tbody>
  ${PRIX0.map(x=>`<tr><td>${esc(x.l)} <span class="meta">/ ${x.u}</span></td><td class="n"><input type="number" step="0.01" data-pmin="${esc(x.k)}" value="${pr[x.k].min}" style="width:90px;min-height:36px;padding:4px 8px;text-align:right" ${isAd()?"":"disabled"}></td><td class="n"><input type="number" step="0.01" data-pmax="${esc(x.k)}" value="${pr[x.k].max}" style="width:90px;min-height:36px;padding:4px 8px;text-align:right" ${isAd()?"":"disabled"}></td></tr>`).join("")}</tbody></table></div>
  ${isAd()?`<div class="row" style="margin-top:12px"><button class="btn pri" id="bPr">Enregistrer les prix</button></div>`:""}</div>
 <div class="card"><h2>Automatisation (plus tard)</h2><p class="small" style="margin:0">Chaque donnée porte une source (« manuel », « punch »…). Des capteurs (débitmètre, réfractomètre, balance à barils, vacuum) pourront écrire directement dans les mêmes collections — journées, barils, transport — sans changer l'interface.</p></div>`}
function bReg(v){const o=v.querySelector("#bOut");if(o)o.onclick=()=>fbAuth.signOut(auth);
 const pl=v.querySelector("#bPl");if(pl)pl.onclick=async()=>{await store.set("config","planif",{ftPerTap:+$("#rFt").value||16.5,tapsPerLat:+$("#rTl").value||5,pMin:+$("#rPm").value||2,pCible:+$("#rPc").value||4});toast("Enregistré")};
 const pb=v.querySelector("#bPr");if(pb)pb.onclick=async()=>{const items={};PRIX0.forEach(x=>{items[x.k]={min:+v.querySelector(`[data-pmin="${x.k}"]`).value||0,max:+v.querySelector(`[data-pmax="${x.k}"]`).value||0}});await store.set("config","prix",{items});toast("Prix enregistrés")}}

// ---------- connexion
const gate=$("#gate"),gc=$("#gateCard");
const showGate=h=>{gc.innerHTML=h;gate.classList.add("on")},hideGate=()=>gate.classList.remove("on");
function loginForm(msg){showGate(`<svg width="64" height="66" aria-hidden="true" style="display:block;margin:0 auto 8px"><use href="#leaf"/></svg><h2 style="text-align:center">Gestion · Érablières</h2><p class="small" style="text-align:center">Même compte que l'app terrain.</p>
 <label class="f" for="gE">Courriel</label><input type="email" id="gE" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false">
 <label class="f" for="gP">Mot de passe</label><input type="password" id="gP" autocomplete="current-password">
 <div class="row" style="margin-top:14px"><button class="btn pri" id="gIn" style="flex:1">Se connecter</button><button class="btn" id="gF">Mot de passe oublié</button></div><div class="err" id="gErr">${msg||""}</div>`);
 const em=()=>$("#gE").value.trim().toLowerCase(),err=t=>$("#gErr").textContent=t;
 const fe=e=>({"auth/invalid-credential":"Courriel ou mot de passe incorrect.","auth/network-request-failed":"Pas de réseau.","auth/invalid-email":"Courriel invalide."}[e.code]||e.message);
 $("#gIn").onclick=async()=>{try{await fbAuth.signInWithEmailAndPassword(auth,em(),$("#gP").value)}catch(e){err(fe(e))}};
 $("#gF").onclick=async()=>{if(!em())return err("Entrez votre courriel d'abord.");try{await fbAuth.sendPasswordResetEmail(auth,em());err("Courriel de réinitialisation envoyé.")}catch(e){err(fe(e))}}}
let entered=false;
async function enter(u){if(entered)return;const email=u.email.toLowerCase();me={uid:u.uid,email,nom:u.displayName||email.split("@")[0]};
 let m=null;try{m=await store.get("membres",email)}catch(e){m=ls.get("erab_member",null)}
 if(!m){showGate(`<h2>Accès en attente</h2><p>Le compte <b>${esc(email)}</b> n'est pas dans l'équipe. Demandez à l'administrateur de vous ajouter dans l'app terrain (Réglages › Équipe).</p><div class="row"><button class="btn pri" id="gR">Réessayer</button><button class="btn" id="gO">Changer de compte</button></div>`);$("#gR").onclick=()=>enter(u);$("#gO").onclick=()=>fbAuth.signOut(auth);return}
 role=m.role==="admin"?"admin":"membre";if(m.nom)me.nom=m.nom;entered=true;hideGate();startData()}
function startData(){
 store.sub("secteurs",l=>{if(l.length)sectors=l.sort((a,b)=>(a.ord??0)-(b.ord??0));if(sect!=="*"&&!sectors.find(s=>s.id===sect))sect="*";nav();render()});
 store.sub("couche",l=>{couche=l;if(tab==="planif"||tab==="production")render()});
 store.sub("heures",l=>{heures=l;if(["punch","accueil","stats","production"].includes(tab)||document.body.classList.contains("tv"))render()});
 store.sub("obs",l=>{obs=l;if(["accueil","stats"].includes(tab)||document.body.classList.contains("tv"))render()});
 store.sub("prod",l=>{prod=l;render()});store.sub("barils",l=>{barils=l;render()});store.sub("transport",l=>{transport=l;render()});
 store.sub("config",l=>{cfg=Object.fromEntries(l.map(d=>[d.id,d]));if(["planif","reglages"].includes(tab))render()});
 store.sub("activite",l=>{acts=l.sort((a,b)=>String(b.at).localeCompare(String(a.at)));if(tab==="accueil"||document.body.classList.contains("tv"))render()},{order:"at",lim:30});
 nav();render();if(new URLSearchParams(location.search).get("tv"))startTv()}
async function boot(){const C=window.FIREBASE_CONFIG;nav();
 if(!C||new URLSearchParams(location.search).get("local")){store=Local;startData();return}
 $("#view").innerHTML=`<div class="empty">Connexion…</div>`;
 try{const [A,Au,F]=await Promise.all([import(GS+"firebase-app.js"),import(GS+"firebase-auth.js"),import(GS+"firebase-firestore.js")]);
  const app=A.initializeApp(C);auth=Au.initializeAuth(app,{persistence:[Au.indexedDBLocalPersistence,Au.browserLocalPersistence]});fbAuth=Au;
  const db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});store=Fire(db,F);
  Au.onAuthStateChanged(auth,u=>{if(!u){entered=false;loginForm();return}if(!u.emailVerified){loginForm("Courriel pas encore vérifié : ouvrez le lien reçu, puis reconnectez-vous.");return}enter(u)})}
 catch(e){showGate(`<h2>Connexion impossible</h2><p>${esc(e.message)}</p><button class="btn pri" onclick="location.reload()">Recharger</button>`)}}
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{});
boot();
