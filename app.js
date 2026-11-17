// Érablière Montagne Noire — app de terrain (PWA)
const BASE = window.BASE;
const FBV = "10.14.1", GS = `https://www.gstatic.com/firebasejs/${FBV}/`;
const TYPES = {
 bris:{l:"Bris de tubulure",c:"#e5432b"}, fuite:{l:"Fuite / vacuum",c:"#f08a00"},
 arbre:{l:"Arbre tombé",c:"#a0662a"}, ponceau:{l:"Ponceau / drainage",c:"#2f7bf0"},
 entaille:{l:"Entaille / chalumeau",c:"#a256d6"}, repere:{l:"Repère / point GPS",c:"#2fa85f"},
 autre:{l:"Autre",c:"#7d8a82"},
 sellette:{l:"Installation de sellettes",c:"#00b3a4",w:1}, chute:{l:"Installation de chutes",c:"#6c7bff",w:1}, travail:{l:"Autre travail",c:"#b08a4a",w:1}};
const PRIOS={urgent:{l:"Urgent",c:"#d01f1f",o:0},haute:{l:"Haute",c:"#f08a00",o:1},normale:{l:"Normale",c:"#7d8a82",o:2},basse:{l:"Basse",c:"#5b8bd6",o:3}};
const prOf=o=>PRIOS[o.prio]?o.prio:"normale";
const asgOf=o=>Array.isArray(o.assign)?o.assign:[];
const isMine=o=>asgOf(o).some(a=>a.email===me.email);
const WSTAT={en_cours:{l:"En cours",c:"#3d8bff"},a_reprendre:{l:"À reprendre",c:"#f08a00"},termine:{l:"Terminé",c:"#2fa85f"}};
const isWork=o=>!!(TYPES[o.type]||{}).w;
const isDone=o=>o.status==="regle"||o.status==="termine";
const stLabel=o=>isWork(o)?(WSTAT[o.status]||WSTAT.en_cours).l:(o.status==="regle"?"réparé":"ouvert");
const LSTAT = {ok:{l:"OK",h:"#ffffff"},verif:{l:"À vérifier",h:"#ffc21a"},bris:{l:"Bris",h:"#ff3b22"},rep:{l:"En réparation",h:"#3d8bff"}};
const ICONS = {
 station:{l:"Station de pompage",c:"#1f6fd6",d:"M3 11l9-7 9 7v9H3z M12 9.5c2 2.8 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.7 3-5.5z"},
 relais:{l:"Relais",c:"#7a4fd6",d:"M5 20v-8l7-5 7 5v8z M12 7V2.5 M9 3.5h6"},
 cabane:{l:"Cabane à sucre",c:"#a0662a",d:"M3 20V11l9-7 9 7v9z M16 7V3h2v5.5 M9.5 20v-5.5h5V20"},
 reservoir:{l:"Réservoir",c:"#0098b8",d:"M5 6c0-1.7 3-3 7-3s7 1.3 7 3v12c0 1.7-3 3-7 3s-7-1.3-7-3z M5 6c0 1.7 3 3 7 3s7-1.3 7-3"},
 extracteur:{l:"Extracteur / pompe vacuum",c:"#d6455a",d:"M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 12l4-4 M12 12h.01"},
 vanne:{l:"Valve / vanne",c:"#e08a00",d:"M3 8v8l9-4z M21 8v8l-9-4z M12 12V5 M9 5h6"},
 monteeau:{l:"Monte-eau",c:"#00a37a",d:"M12 21V4 M6 10l6-6 6 6 M8 21h8"},
 ponceau:{l:"Ponceau / traverse",c:"#4b7a99",d:"M3 18h18 M6 18a6 6 0 0 1 12 0"},
 barriere:{l:"Barrière / accès",c:"#c2410c",d:"M3 9h18v5H3z M5 14v7 M19 14v7 M8 9l3 5 M13 9l3 5"},
 elec:{l:"Électricité / solaire",c:"#d4a400",d:"M13 2L4 14h7l-1 8 9-12h-7z"},
 capteur:{l:"Capteur / sonde",c:"#2f8f9d",d:"M4.5 11a11 11 0 0 1 15 0 M7.5 14.5a6.5 6.5 0 0 1 9 0 M12 18.5h.01"},
 danger:{l:"Danger / attention",c:"#e5432b",d:"M12 3l10 18H2z M12 10v5 M12 18h.01"},
 repere:{l:"Repère",c:"#2fa85f",d:"M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z M12 10h.01"}};
const icoOf=p=>{if(p.ico&&ICONS[p.ico])return p.ico;const n=(p.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 return /pomp|station/.test(n)?"station":/relais/.test(n)?"relais":/cabane/.test(n)?"cabane":/reservoir|bassin/.test(n)?"reservoir":/extract|vacuum/.test(n)?"extracteur":/valve|vanne/.test(n)?"vanne":/monte/.test(n)?"monteeau":/ponceau|traverse/.test(n)?"ponceau":/barri|acces/.test(n)?"barriere":/solaire|elec/.test(n)?"elec":/capteur|sonde/.test(n)?"capteur":/danger/.test(n)?"danger":"repere"};
const icoSvg=(k,sz)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[k].d}"/></svg>`;
const icoHtml=(k,sz=32)=>`<div class="pico" style="width:${sz}px;height:${sz}px;background:${ICONS[k].c}">${icoSvg(k,Math.round(sz*.62))}</div>`;
const PALETTE = ["#d6782a","#e58739","#3468eb","#00a1ed","#2fa85f","#a256d6","#e5432b","#7d8a82"];
const ACT = {assign:{c:"#7a4fd6",l:"Assignation"},message:{c:"#0a7d5a",l:"Message"},signalement:{c:"#e5432b",l:"Signalement"},reparation:{c:"#2fa85f",l:"Réparation"},reouvert:{c:"#f08a00",l:"Rouvert"},ligne:{c:"#3d8bff",l:"Ligne"},carte:{c:"#a256d6",l:"Carte"},suppression:{c:"#7d8a82",l:"Suppression"},travail:{c:"#00b3a4",l:"Travaux"},heures:{c:"#b08a4a",l:"Heures"}};
const BASES = {
 sat:{l:"Satellite",url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",o:{maxNativeZoom:19,maxZoom:21,attribution:"Imagerie © Esri, Maxar, Earthstar Geographics"}},
 hyb:{l:"Satellite + chemins",url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",over:"https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",o:{maxNativeZoom:19,maxZoom:21,attribution:"Imagerie © Esri, Maxar · chemins © Esri"}},
 topo:{l:"Topo (courbes de niveau)",url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",o:{subdomains:"abc",maxNativeZoom:17,maxZoom:21,attribution:"© OpenStreetMap, SRTM · OpenTopoMap (CC-BY-SA)"}},
 plan:{l:"Plan (rues)",url:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",o:{maxNativeZoom:19,maxZoom:21,attribution:"© OpenStreetMap"}}};
const $ = s=>document.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kmlCol = k=>k&&k.length===8?"#"+k.slice(6,8)+k.slice(4,6)+k.slice(2,4):"#555555";
const fmtD = iso=>{try{return new Date(iso).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"})}catch(e){return iso}};
const ago = iso=>{const s=(Date.now()-new Date(iso))/1000;if(s<60)return "à l'instant";if(s<3600)return "il y a "+Math.floor(s/60)+" min";if(s<86400)return "il y a "+Math.floor(s/3600)+" h";return fmtD(iso)};
const hav=(a,b)=>{const R=6371000,r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[0]-a[0])*r,x=Math.sin(dl/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const fmtM = m=>m>=1000?(m/1000).toFixed(2).replace(".",",")+" km":Math.round(m)+" m";
const nid = p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ls = {get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// saisons : une saison commence le 1er août (préparation) et se termine après les sucres
const SEASON_MONTH = 7;
const seasonOf = iso=>{const d=iso?new Date(iso):new Date();return d.getMonth()>=SEASON_MONTH?d.getFullYear()+1:d.getFullYear()};
const CUR = seasonOf();
let viewSeason = CUR;
const sOf = o=>o.season??seasonOf(o.at);

// ---------- couche de carte
const enc = c=>c.map(p=>(+p[0]).toFixed(6)+","+(+p[1]).toFixed(6)).join(";");
const dec = s=>String(s||"").split(";").filter(Boolean).map(p=>p.split(",").map(Number));
const areaHa = c=>{if(c.length<3)return 0;const lat0=c[0][1]*Math.PI/180,k=111320*Math.cos(lat0),K=110540;let a=0;for(let i=0;i<c.length;i++){const p=c[i],q=c[(i+1)%c.length];a+=(p[0]*k)*(q[1]*K)-(q[0]*k)*(p[1]*K)}return Math.abs(a)/2/10000};
function parseKml(text){const d=new DOMParser().parseFromString(text,"text/xml");const styles={},sm={};
 d.querySelectorAll("Style").forEach(s=>{const c=s.querySelector("PolyStyle color, LineStyle color, IconStyle color");if(c)styles[s.id]=c.textContent.trim()});
 d.querySelectorAll("StyleMap").forEach(m=>{const p=m.querySelector("Pair styleUrl");if(p)sm[m.id]=p.textContent.replace("#","")});
 const out=[];d.querySelectorAll("Placemark").forEach((p,i)=>{const name=(p.querySelector("name")||{}).textContent||"",desc=((p.querySelector("description")||{}).textContent||"").replace(/<[^>]+>/g," ").trim();
  let su=((p.querySelector("styleUrl")||{}).textContent||"").replace("#","");su=sm[su]||su;
  const parse=s=>s.trim().split(/\s+/).map(c=>c.split(",").slice(0,2).map(Number)).filter(c=>isFinite(c[0])&&isFinite(c[1]));
  const lsx=p.querySelector("LineString coordinates"),pt=p.querySelector("Point coordinates"),pg=p.querySelector("Polygon outerBoundaryIs coordinates");
  const ha=+((desc.match(/([\d.,]+)\s*ha/)||[])[1]||"").replace(",",".")||0,pot=+(desc.match(/potentiel\s*(\d+)/i)||[])[1]||0;
  const base={name:name.trim(),desc,color:kmlCol(styles[su]),ord:i};
  if(lsx)out.push({...base,kind:"ligne",c:enc(parse(lsx.textContent))});
  else if(pg){const c=parse(pg.textContent);out.push({...base,kind:"zone",c:enc(c),ha:ha||+areaHa(c).toFixed(1),pot})}
  else if(pt)out.push({...base,kind:"point",c:enc(parse(pt.textContent).slice(0,1))})});
 return out}
const DEF="montagne-noire";
const baseLayer = BASE.features.map((f,i)=>{const g=f.geometry,p=f.properties,zone=p.folder.startsWith("Zones");
 const kind=g.type==="Point"?"point":g.type==="LineString"?"ligne":zone?"zone":"station";
 const c=g.type==="Point"?[g.coordinates]:g.type==="LineString"?g.coordinates:g.coordinates[0];
 const d=p.desc;return {id:"f"+i,kind,name:p.name,desc:d,color:kmlCol(p.color),c:enc(c),ha:+(d.match(/([\d.]+)\s*ha/)||[])[1]||0,pot:+(d.match(/potentiel\s*(\d+)/)||[])[1]||0,ord:i,sect:DEF}});
let sectors=[{id:DEF,nom:"Montagne Noire",ord:0}], curSect=ls.get("erab_sect",DEF), allLayer=baseLayer, obsAll=[];
const sectOf=x=>x.sect||DEF;
const sectName=id=>(sectors.find(x=>x.id===id)||{}).nom||id;
let layer = baseLayer, layerIsDb = false, lines=[], zones=[], pts=[], stations=[];
function derive(){layer=allLayer.filter(f=>sectOf(f)===curSect);const F=layer.slice().sort((a,b)=>(a.ord??0)-(b.ord??0));
 lines=F.filter(f=>f.kind==="ligne").map(f=>{const c=dec(f.c);let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);return {...f,coords:c,len,label:/^\d+$/.test(f.name)?"Ligne "+f.name:(f.name||"Ligne sans nom")}}).filter(l=>l.coords.length>1);
 lines.forEach(l=>{const same=lines.filter(o=>o.label===l.label);if(same.length>1)l.label+=" ("+(same.indexOf(l)+1)+")"});
 zones=F.filter(f=>f.kind==="zone").map(f=>({...f,coords:dec(f.c)})).filter(z=>z.coords.length>2);
 pts=F.filter(f=>f.kind==="point").map(f=>({...f,coords:dec(f.c)})).filter(p=>p.coords.length);
 stations=F.filter(f=>f.kind==="station").map(f=>({...f,coords:dec(f.c)}))}
derive();

// ---------- stockage : Firebase (partagé) ou local (essai)
let store=null, auth=null, fbAuth=null, me={uid:"local",email:"",nom:"Moi"}, role="admin";
const Local = (()=>{const K="erab_local_db";let d=ls.get(K,{});const subs={};
 const list=(c,o)=>{let a=Object.entries(d[c]||{}).map(([id,v])=>({id,...v}));if(o&&o.order){a.sort((x,y)=>String(y[o.order]).localeCompare(String(x[o.order])));if(o.lim)a=a.slice(0,o.lim)}return a};
 const save=()=>{try{localStorage.setItem(K,JSON.stringify(d))}catch(e){banner("Mémoire de l'appareil pleine : supprimez des photos.",5000)}};
 const emit=c=>(subs[c]||[]).forEach(s=>s.cb(list(c,s.o),{hasPendingWrites:false,fromCache:false}));
 return {kind:"local",sub(c,cb,o){(subs[c]=subs[c]||[]).push({cb,o});setTimeout(()=>cb(list(c,o),{hasPendingWrites:false,fromCache:false}),0)},
  async get(c,id){return d[c]&&d[c][id]?{id,...d[c][id]}:null},
  async set(c,id,v){(d[c]=d[c]||{})[id]=JSON.parse(JSON.stringify(v));save();emit(c)},
  async upd(c,id,v){if(!d[c]||!d[c][id])throw new Error("absent");Object.assign(d[c][id],JSON.parse(JSON.stringify(v)));save();emit(c)},
  async del(c,id){if(d[c])delete d[c][id];save();emit(c)}}})();
function Fire(db,F){
 // Hors ligne, Firestore applique l'écriture tout de suite sur l'appareil et l'envoie au retour du réseau.
 const soft=p=>{p.catch(e=>banner("Écriture refusée : "+(e.code||e.message),6000));return Promise.race([p,new Promise(r=>setTimeout(r,2000))])};
 return {kind:"fire",
  sub(c,cb,o){const q=o&&o.order?F.query(F.collection(db,c),F.orderBy(o.order,"desc"),F.limit(o.lim||100)):F.collection(db,c);
   return F.onSnapshot(q,{includeMetadataChanges:true},s=>cb(s.docs.map(x=>({id:x.id,...x.data()})),s.metadata),e=>{console.warn(c,e);if(e.code==="permission-denied")setSync("warn","Accès refusé")})},
  async get(c,id){const s=await F.getDoc(F.doc(db,c,id));return s.exists()?{id,...s.data()}:null},
  watch(c,id,cb){return F.onSnapshot(F.doc(db,c,id),s=>cb(s.exists()?{id,...s.data()}:null),e=>console.warn("photo",id,e.code))},
  set:(c,id,v)=>soft(F.setDoc(F.doc(db,c,id),v)),
  upd:(c,id,v)=>soft(F.updateDoc(F.doc(db,c,id),v)),
  del:(c,id)=>soft(F.deleteDoc(F.doc(db,c,id))),
  hardSet:(c,id,v)=>F.setDoc(F.doc(db,c,id),v)}}

// ---------- état
let vac=[], obs=[], lstate={}, acts=[], membres=[], cfg={}, pending=false;
let tab="journal", fStat="ouvert", fType="", fAsg="", editMode=false, drawing=null, shapeEdit=null, actsReady=false, pickMode=false;
let lastSeen=ls.get("erab_seen","");
const isEd=()=>role==="admin";
const lst = id=>{const s=lstate[id];return s&&(s.season??seasonOf(s.at))===viewSeason?s:{}};
const visObs=()=>obs.filter(o=>{const s=sOf(o);return s===viewSeason||(viewSeason===CUR&&s<CUR&&!isDone(o))});

// ---------- carte
if(L.PM)L.PM.setOptIn(true);
const map = L.map("map",{pmIgnore:false,zoomControl:true,attributionControl:true,maxZoom:21,minZoom:8,zoomSnap:.5});
map.attributionControl.setPrefix(false);
map.zoomControl.setPosition("topright");
L.control.scale({imperial:false,position:"bottomleft"}).addTo(map);
let baseKey=ls.get("erab_base","hyb"), baseL=null, overL=null, baseReady=false;
const lightBase=()=>baseKey==="plan"||baseKey==="topo";
function setBase(k){if(!BASES[k])k="hyb";baseKey=k;ls.set("erab_base",k);if(baseL)baseL.remove();if(overL)overL.remove();overL=null;const b=BASES[k];
 baseL=L.tileLayer(b.url,{...b.o,crossOrigin:false}).addTo(map);baseL.bringToBack();if(b.over)overL=L.tileLayer(b.over,{maxNativeZoom:19,maxZoom:21}).addTo(map);
 map.getContainer().classList.toggle("base-plan",k==="plan"||k==="topo");if(baseReady){drawBase();drawObs()}
 document.querySelectorAll(".bases").forEach(el=>el.innerHTML=Object.entries(BASES).map(([kk,v])=>`<button class="chip" data-base="${kk}" aria-pressed="${kk===k}">${v.l}</button>`).join(""));
 document.querySelectorAll("[data-base]").forEach(x=>x.onclick=()=>setBase(x.dataset.base))}
setBase(baseKey);
const gZones=L.layerGroup().addTo(map), gLines=L.layerGroup().addTo(map), gPts=L.layerGroup().addTo(map), gObs=L.layerGroup().addTo(map), gVac=L.layerGroup().addTo(map), gTmp=L.layerGroup().addTo(map);
map.createPane("me").style.zIndex=650;const meR=L.svg({pane:"me"});const gMe=L.layerGroup().addTo(map);
let lineLayers={}, fitted=false;baseReady=true;
const ll = c=>c.map(p=>[p[1],p[0]]);
function bounds(){const all=[...lines,...zones,...pts,...stations].flatMap(f=>ll(f.coords));return all.length?L.latLngBounds(all):null}
let flyNext=false;function fitAll(){const b=bounds();if(!b)return;if(flyNext){flyNext=false;map.flyToBounds(b,{padding:[40,40],duration:1.2})}else map.fitBounds(b,{padding:[40,40]})}
function featClick(f,e,normal){L.DomEvent.stop(e);if(drawing){addDrawPt(e.latlng);return}if(pickMode){setPick(e.latlng);return}if(shapeEdit)return;if(editMode){openFeat(f);return}normal()}
function drawBase(){gZones.clearLayers();gLines.clearLayers();gPts.clearLayers();lineLayers={};
 if(!fitted&&bounds()){fitAll();fitted=true}
 if(!map._loaded){const a=allLayer.flatMap(f=>ll(dec(f.c)));if(!a.length)return;map.fitBounds(L.latLngBounds(a),{padding:[40,40]})}
 zones.forEach(z=>L.polygon(ll(z.coords),{color:z.color,weight:2.5,fillColor:z.color,fillOpacity:.15}).bindTooltip(z.name,{permanent:true,direction:"center",className:"lbl"}).on("click",e=>featClick(z,e,()=>openZone(z))).addTo(gZones));
 stations.forEach(s=>L.polygon(ll(s.coords),{color:"#ffffff",weight:2,fillColor:"#1f4a33",fillOpacity:.8}).bindTooltip(s.name||"Station",{direction:"top"}).on("click",e=>featClick(s,e,()=>{})).addTo(gZones));
 lines.forEach(l=>{const st=lst(l.id).status||"ok",c=ll(l.coords);
  L.polyline(c,{color:lightBase()?"#fff":"#000",weight:st==="ok"?5:7,opacity:lightBase()?.7:.45,interactive:false}).addTo(gLines);
  const vis=L.polyline(c,{color:st==="ok"&&lightBase()?"#1f4a33":LSTAT[st].h,weight:st==="ok"?3:5,opacity:1,dashArray:st==="verif"?"8 6":null,interactive:false}).addTo(gLines);
  const hit=L.polyline(c,{color:"#000",opacity:0,weight:22}).bindTooltip(l.label+" · "+fmtM(l.len),{sticky:true}).on("click",e=>featClick(l,e,()=>openLine(l))).addTo(gLines);
  lineLayers[l.id]={vis,hit}});
 pts.forEach(p=>{const [x,y]=p.coords[0],k=icoOf(p);L.marker([y,x],{icon:L.divIcon({className:"",html:icoHtml(k,30),iconSize:[30,30],iconAnchor:[15,15]})}).bindTooltip(p.name,{permanent:true,direction:"right",className:"lbl",offset:[14,0]}).on("click",e=>featClick(p,e,()=>openPoint(p))).addTo(gPts)});
 drawOthers()}
function drawOthers(){const oth=allLayer.filter(f=>sectOf(f)!==curSect&&sectors.some(x=>x.id===sectOf(f)));const named={};
 oth.forEach(f=>{const c=ll(dec(f.c)),sid=sectOf(f),go=e=>{L.DomEvent.stop(e);if(drawing||pickMode||shapeEdit||editMode)return;switchSect(sid)};
  if(f.kind==="zone"&&c.length>2){const pg=L.polygon(c,{color:"#ffd27a",weight:2,dashArray:"6 5",fillColor:"#ffd27a",fillOpacity:.08}).on("click",go).addTo(gZones);
   if(!named[sid]){named[sid]=1;pg.bindTooltip(sectName(sid)+" ›",{permanent:true,direction:"center",className:"lbl lblo",interactive:true})}}
  else if(f.kind==="ligne"&&c.length>1)L.polyline(c,{color:"#ffffff",weight:2,opacity:.55,interactive:false}).addTo(gLines)});
 sectors.filter(x=>x.id!==curSect&&!named[x.id]).forEach(x=>{const fs=oth.filter(f=>sectOf(f)===x.id);if(!fs.length)return;const b=L.latLngBounds(fs.flatMap(f=>ll(dec(f.c))));
  L.marker(b.getCenter(),{icon:L.divIcon({className:"",iconSize:[0,0],html:""})}).bindTooltip(x.nom+" ›",{permanent:true,direction:"center",className:"lbl lblo",interactive:true}).on("click",e=>{L.DomEvent.stop(e);switchSect(x.id)}).addTo(gPts)})}
$("#legend").innerHTML=Object.values(LSTAT).map(s=>`<div><i style="background:${s.h};outline:1px solid #0006"></i>Ligne ${s.l.toLowerCase()}</div>`).join("")+`<div><i style="background:#e5432b;height:12px;width:12px;border-radius:50%;border:2px solid #fff;outline:1px solid #0006"></i>Signalement ouvert</div><div><i style="border:3px solid #e5432b;height:12px;width:12px;border-radius:50%;background:#fff8"></i>Réparé</div><div><i style="background:#e5432b;height:12px;width:12px;border-radius:50%;outline:2px dashed #e5432b;outline-offset:1px"></i>Reporté d'une saison passée</div><div><i style="background:#00b3a4;height:11px;width:11px;transform:rotate(45deg);border:2px solid #fff;outline:1px solid #0006"></i>Travaux en cours</div><div><i style="background:#00b3a4;height:11px;width:11px;transform:rotate(45deg);border:2px solid #f08a00"></i>Travaux à reprendre</div><div><i style="background:#fff8;height:11px;width:11px;transform:rotate(45deg);border:2px solid #00b3a4"></i>Travaux terminés</div><div><i style="background:#2f7bf0;height:12px;width:12px;border-radius:50%;border:2px solid #fff;outline:1px solid #0006"></i>Ma position</div>`;
function drawObs(){gObs.clearLayers();visObs().forEach(o=>{if(o.lat==null)return;const t=TYPES[o.type]||TYPES.autre,done=isDone(o),old=sOf(o)<viewSeason;
 if(isWork(o)){const rep=o.status==="a_reprendre";L.marker([o.lat,o.lng],{icon:L.divIcon({className:"",iconSize:[22,22],iconAnchor:[11,11],html:`<div style="width:16px;height:16px;margin:3px;transform:rotate(45deg);background:${done?"#fff8":t.c};border:3px solid ${rep?"#f08a00":done?t.c:"#fff"};box-shadow:0 1px 4px #0008"></div>`})}).on("click",e=>{L.DomEvent.stop(e);if(drawing){addDrawPt(e.latlng);return}if(pickMode){setPick(e.latlng);return}if(editMode||shapeEdit)return;openObs(o)}).bindTooltip(t.l+" · "+stLabel(o),{direction:"top"}).addTo(gObs);return}
 const urg=!done&&prOf(o)==="urgent";if(urg)L.circleMarker([o.lat,o.lng],{radius:16,color:"#d01f1f",weight:3,fill:false,interactive:false,className:"pulse"}).addTo(gObs);
 L.circleMarker([o.lat,o.lng],{radius:done?7:10,color:done?t.c:old?t.c:"#fff",weight:done?3:3,fillColor:done?"#ffffff":t.c,fillOpacity:done?.5:1,dashArray:old?"3 3":null}).on("click",e=>{L.DomEvent.stop(e);if(drawing){addDrawPt(e.latlng);return}if(pickMode){setPick(e.latlng);return}if(editMode||shapeEdit)return;openObs(o)}).bindTooltip(t.l,{direction:"top"}).addTo(gObs)})}
map.on("click",e=>{if(drawing&&drawing.kind!=="gps")addDrawPt(e.latlng);else if(pickMode)setPick(e.latlng);$("#pop").classList.remove("on")});
$("#bFit").onclick=()=>{follow=false;locBtn();fitAll()};
$("#bDash").onclick=()=>dashOpen();
let bannerT=0;const banner=(t,ms)=>{const b=$("#banner");clearTimeout(bannerT);b.textContent=t||"";b.classList.toggle("on",!!t);if(t&&ms)bannerT=setTimeout(()=>banner(""),ms)};
const drw=$("#drawer"),dsc=$("#dscrim");
const menu=o=>{drw.classList.toggle("open",o);dsc.classList.toggle("on",o)};
$("#bMenu").onclick=()=>{render();menu(true)};$("#bClose").onclick=()=>menu(false);dsc.onclick=()=>menu(false);
$("#bLayers").onclick=e=>{e.stopPropagation();$("#pop").classList.toggle("on")};
$("#bBell").onclick=()=>{setTab("activite");menu(true)};
const toMap=()=>menu(false);

// ---------- secteurs (érablières)
function switchSect(id,keepView){curSect=id;ls.set("erab_sect",id);obs=obsAll.filter(o=>sectOf(o)===curSect);derive();if(!keepView){fitted=false;flyNext=true}drawBase();drawObs();drawVac();render();sectUI();if(!keepView&&!bounds())banner("Secteur vide : ajoutez sa carte (Menu › Carte › Importer un KML, ou Modifier la carte).",6000)}
function sectUI(){$("#sectName").textContent=sectName(curSect);$("#dTitle").textContent=sectName(curSect);
 $("#sectList").innerHTML=sectors.map(x=>`<button class="sitem" data-sect="${esc(x.id)}" aria-pressed="${x.id===curSect}"><span>${esc(x.nom)}</span><span class="meta">${obsAll.filter(o=>sectOf(o)===x.id&&!isDone(o)&&sOf(o)===CUR).length||""}</span></button>`).join("")+(isEd()&&store?`<button class="sitem add" id="sAdd">+ Nouveau secteur</button>`:"");
 document.querySelectorAll("[data-sect]").forEach(b=>b.onclick=()=>{$("#spop").classList.remove("on");if(b.dataset.sect!==curSect)switchSect(b.dataset.sect)});
 const a=$("#sAdd");if(a)a.onclick=()=>{$("#spop").classList.remove("on");newSect()}}
function newSect(){openSheet(head("Nouveau secteur")+`<label class="f" for="nsName">Nom de l'érablière ou du secteur</label><input type="text" id="nsName" placeholder="Ex. Érablière Saint-Esprit">
 <p class="small">Ensuite, ajoutez sa carte : importez un KML de My Maps, ou dessinez les lignes et les zones (à la main ou en marchant avec le GPS).</p>
 <label class="f">Carte de départ (facultatif)</label><label class="btn">Importer un KML<input type="file" id="nsKml" accept=".kml,application/vnd.google-earth.kml+xml,text/xml"></label><div class="small" id="nsInfo"></div>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="nsOk" style="flex:1">Créer le secteur</button></div><div class="err" id="nsErr"></div>`);
 let items=[];$("#nsKml").onchange=async e=>{try{items=parseKml(await e.target.files[0].text())}catch(x){items=[]}$("#nsInfo").textContent=items.length?items.length+" éléments prêts à importer.":"Aucun élément lisible (exportez en KML, pas KMZ)."};
 $("#nsOk").onclick=async()=>{const nom=$("#nsName").value.trim();if(!nom){$("#nsErr").textContent="Entrez un nom.";return}$("#nsOk").disabled=true;
  await seedBase();const id=nom.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||nid("s");
  const sid=sectors.find(x=>x.id===id)?id+"-"+Date.now().toString(36).slice(-4):id;
  await store.set("secteurs",sid,{nom,ord:Date.now()});if(!sectors.find(x=>x.id===sid))sectors.push({id:sid,nom});
  for(const it of items)await store.set("couche",nid("k"),{...it,sect:sid});
  curSect=sid;logAct("carte","Nouveau secteur : « "+nom+" »"+(items.length?" ("+items.length+" éléments importés)":""));closeSheet();switchSect(sid)}}
function editSect(){const x=sectors.find(s=>s.id===curSect)||{};openSheet(head("Secteur")+`<label class="f" for="esName">Nom</label><input type="text" id="esName" value="${esc(x.nom||"")}">
 <div class="row" style="margin-top:16px"><button class="btn pri" id="esOk" style="flex:1">Renommer</button>${sectors.length>1?`<button class="btn red" id="esDel">Supprimer le secteur</button>`:""}</div><div id="esConf"></div>`);
 $("#esOk").onclick=async()=>{const nom=$("#esName").value.trim();if(!nom)return;await store.set("secteurs",curSect,{nom,ord:x.ord??0});closeSheet()};
 const d=$("#esDel");if(d)d.onclick=()=>{const n=obsAll.filter(o=>sectOf(o)===curSect).length;$("#esConf").innerHTML=`<p>Supprimer « ${esc(x.nom)} », sa carte (${layer.length} éléments) et ses ${n} signalement(s) ? C'est définitif.</p><button class="btn red" id="esDel2">Oui, tout supprimer</button>`;
  $("#esDel2").onclick=async()=>{await seedBase();for(const f of layer)await store.del("couche",f.id);for(const o of obsAll.filter(o=>sectOf(o)===curSect)){await store.del("obs",o.id);for(const p of [...(o.photos||[]),...(o.repairPhotos||[])])await store.del("photos",p)}
   await store.del("secteurs",curSect);logAct("suppression","Secteur supprimé : « "+x.nom+" »");sectors=sectors.filter(s=>s.id!==curSect);closeSheet();switchSect(sectors[0].id)}}}
$("#bSect").onclick=e=>{e.stopPropagation();$("#pop").classList.remove("on");sectUI();$("#spop").classList.toggle("on")};
document.addEventListener("click",e=>{const p=$("#spop");if(p.classList.contains("on")&&!p.contains(e.target))p.classList.remove("on")});

// ---------- GPS
let watchId=null, fix=null, follow=false, firstFix=null;
const gpsErr=e=>e&&e.code===1?"Accès à la position refusé. iPhone : Réglages › Confidentialité › Service de localisation › Safari (ou Érablière) › « Lorsque l'app est active » et « Position exacte ».":"Signal GPS introuvable pour l'instant. Réessayez à découvert.";
function locBtn(){const b=$("#bLoc");b.classList.toggle("on",watchId!=null&&!follow);b.classList.toggle("follow",follow)}
function startGps(){if(watchId!=null)return true;if(!navigator.geolocation){banner("Ce navigateur n'a pas de GPS.",4000);return false}
 watchId=navigator.geolocation.watchPosition(p=>{fix={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy,t:Date.now()};drawMe();
  if(follow)map.setView([fix.lat,fix.lng],Math.max(map.getZoom(),17));if(firstFix){firstFix(fix);firstFix=null}if(drawing&&drawing.kind==="gps")recPt(fix)},
  e=>{if(e.code===1){banner(gpsErr(e),8000);stopGps()}else if(!fix)banner(gpsErr(e),5000)},{enableHighAccuracy:true,maximumAge:2000});
 locBtn();return true}
function stopGps(){if(watchId!=null)navigator.geolocation.clearWatch(watchId);watchId=null;follow=false;fix=null;gMe.clearLayers();$("#gpsinfo").classList.remove("on");locBtn()}
function drawMe(){gMe.clearLayers();if(!fix)return;L.circle([fix.lat,fix.lng],{pane:"me",renderer:meR,radius:fix.acc,color:"#2f7bf0",weight:1,fillOpacity:.12,interactive:false}).addTo(gMe);
 L.circleMarker([fix.lat,fix.lng],{pane:"me",renderer:meR,radius:8,color:"#fff",weight:3,fillColor:"#2f7bf0",fillOpacity:1,interactive:false}).addTo(gMe);
 const nl=nearestLine(fix.lat,fix.lng);
 $("#gpsinfo").innerHTML=`± ${Math.round(fix.acc)} m${nl.line&&nl.d<80?` · ${esc(nl.line.label)} à ${Math.round(nl.d)} m`:""} <button class="chip" id="gStop" style="min-height:30px;margin-left:6px">Arrêter</button>`;$("#gpsinfo").classList.add("on");$("#gStop").onclick=stopGps}
function waitFix(){return new Promise((res,rej)=>{if(fix&&Date.now()-fix.t<15000)return res(fix);if(!startGps())return rej();firstFix=res;setTimeout(()=>{if(firstFix===res){firstFix=null;rej(new Error("délai"))}},25000)})}
$("#bLoc").onclick=()=>{if(watchId==null){follow=true;startGps();banner("Recherche du GPS…",2500)}else if(!follow){follow=true;if(fix)map.setView([fix.lat,fix.lng],Math.max(map.getZoom(),17))}else follow=false;locBtn()};
map.on("dragstart",()=>{if(follow){follow=false;locBtn()}});

// ---------- outils géo et photos
function nearestLine(lat,lng){const k=Math.cos(lat*Math.PI/180)*111320,K=110540;let best=null,bd=1e9;
 lines.forEach(l=>{const c=l.coords;for(let i=1;i<c.length;i++){const ax=(c[i-1][0]-lng)*k,ay=(c[i-1][1]-lat)*K,bx=(c[i][0]-lng)*k,by=(c[i][1]-lat)*K,dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy;let t=L2?-(ax*dx+ay*dy)/L2:0;t=Math.max(0,Math.min(1,t));const d=Math.hypot(ax+t*dx,ay+t*dy);if(d<bd){bd=d;best=l}}});
 return {line:best,d:bd}}
function exifGPS(buf){try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return null;let o=2;while(o<v.byteLength-4){const m=v.getUint16(o);if(m===0xFFE1){const s=o+4;if(v.getUint32(s)!==0x45786966)return null;const t=s+6,le=v.getUint16(t)===0x4949;const u16=p=>v.getUint16(p,le),u32=p=>v.getUint32(p,le);
 const ifd0=t+u32(t+4);let gps=0;const n=u16(ifd0);for(let i=0;i<n;i++){const e=ifd0+2+i*12;if(u16(e)===0x8825)gps=t+u32(e+8)}if(!gps)return null;
 const g={};const gn=u16(gps);for(let i=0;i<gn;i++){const e=gps+2+i*12,tag=u16(e),off=t+u32(e+8);if(tag===1||tag===3)g[tag]=String.fromCharCode(v.getUint8(e+8));if(tag===2||tag===4){g[tag]=[0,1,2].map(j=>u32(off+j*8)/u32(off+j*8+4))}}
 if(!g[2]||!g[4])return null;const dd=a=>a[0]+a[1]/60+a[2]/3600;let lat=dd(g[2]),lng=dd(g[4]);if(g[1]==="S")lat=-lat;if(g[3]==="W")lng=-lng;return isFinite(lat)&&isFinite(lng)&&(lat||lng)?{lat,lng}:null}
 if((m&0xFF00)!==0xFF00)return null;o+=2+v.getUint16(o+2)}}catch(e){}return null}
async function shrink(file){const url=URL.createObjectURL(file);try{const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});let M=1280,q=.72,out="";for(let k=0;k<6;k++){const s=Math.min(1,M/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);out=c.toDataURL("image/jpeg",q);if(out.length<650000)break;if(q>.5)q-=.1;else M=Math.round(M*.8)}return out}finally{URL.revokeObjectURL(url)}}
const photoCache={};
const photoWait={};
// Écoute le document photo jusqu'à ce qu'il existe : marche hors ligne (cache), reprend au retour du réseau,
// et attend une photo encore en cours d'envoi depuis le téléphone d'un collègue.
function getPhoto(id){if(photoCache[id])return Promise.resolve(photoCache[id]);if(photoWait[id])return photoWait[id];
 return photoWait[id]=new Promise(res=>{let un=null,done=false;const ok=d=>{if(done)return;done=true;photoCache[id]=d;try{un&&un()}catch(e){}delete photoWait[id];res(d)};
  const once=()=>store.get("photos",id).then(x=>x&&x.d&&ok(x.d)).catch(()=>{});
  if(store.watch){try{un=store.watch("photos",id,x=>{if(x&&x.d)ok(x.d)})}catch(e){once()}}else{once();const t=setInterval(()=>{if(done)return clearInterval(t);once()},15000)}})}
const pimg=(id,cls,alt)=>`<img class="${cls}" data-pid="${esc(id)}" alt="${esc(alt||"")}">`;
function hydrate(root){root.querySelectorAll("img[data-pid]").forEach(async im=>{if(im.src)return;if(!photoCache[im.dataset.pid])im.classList.add("ploading");const s=await getPhoto(im.dataset.pid);if(s){im.src=s;im.classList.remove("ploading")}})}
async function savePhotos(list,obsId){const ids=[];for(const d of list){const id=nid("p");photoCache[id]=d;await store.set("photos",id,{d,obs:obsId,at:new Date().toISOString()});ids.push(id)}return ids}

// ---------- synchro, activité, alertes
function setSync(state,txt){$("#dot").className="dot "+state;$("#synctxt").textContent=txt}
function syncState(){if(!store)return;if(store.kind==="local")return setSync("warn","Mode essai (local)");if(!navigator.onLine)return setSync("warn","Hors ligne · enregistré sur l'appareil");setSync(pending?"warn":"ok",pending?"Envoi…":"Synchronisé")}
addEventListener("online",()=>{syncState();flushNtfy()});addEventListener("offline",syncState);
function renderAll(){drawBase();drawObs();render();bell()}
async function logAct(kind,text,extra){try{await store.set("activite",nid("a"),{kind,text,sect:curSect,by:me.uid,byName:me.nom,at:new Date().toISOString(),season:CUR,...(extra||{})})}catch(e){}notify(text)}
function notify(text){const a=cfg.alertes;if(!a||!a.topic||store.kind==="local")return;if(a.skipUid&&a.skipUid===me.uid)return;const q=ls.get("erab_ntfyq",[]);q.push((sectors.length>1?"["+sectName(curSect)+"] ":"")+me.nom+" : "+text);ls.set("erab_ntfyq",q.slice(-50));flushNtfy()}
let flushing=false;
async function flushNtfy(){const a=cfg.alertes;if(flushing||!a||!a.topic)return;flushing=true;let q=ls.get("erab_ntfyq",[]);
 while(q.length){try{const it=typeof q[0]==="string"?{b:q[0]}:q[0];const r=await fetch("https://ntfy.sh/"+encodeURIComponent(a.topic),{method:"POST",body:it.b,headers:{Title:it.t||"Erablieres",Tags:it.u?"rotating_light":"maple_leaf",Priority:it.u?"5":"3"}});if(!r.ok)break;q.shift();ls.set("erab_ntfyq",q)}catch(e){break}}flushing=false}
function bell(){const n=acts.filter(a=>a.by!==me.uid&&a.at>lastSeen).length;const b=$("#bellN");b.textContent=n>9?"9+":n;b.style.display=n?"grid":"none"}
const lineLabel=id=>(lines.find(l=>l.id===id)||{}).label||"";
const actText=o=>(TYPES[o.type]||TYPES.autre).l+(isWork(o)?" · "+stLabel(o).toLowerCase():" signalé")+(o.line?" · "+lineLabel(o.line):"")+(o.note?" — « "+o.note.slice(0,80)+" »":"");
async function seedBase(){if(layerIsDb)return;for(const f of baseLayer){const {id,...d}=f;await store.set("couche",id,d)}layerIsDb=true}
function startData(){
 store.sub("obs",(list,m)=>{obsAll=list.sort((a,b)=>String(b.at).localeCompare(String(a.at)));obs=obsAll.filter(o=>sectOf(o)===curSect);pending=!!m.hasPendingWrites;syncState();drawObs();render();dRefresh()});
 store.sub("lignes",list=>{lstate={};list.forEach(d=>lstate[d.id]=d);drawBase();render();dRefresh()});
 store.sub("couche",(list,m)=>{if(!list.length){if(m.fromCache)return;allLayer=baseLayer;layerIsDb=false;if(isEd())seedBase()}else{allLayer=list;layerIsDb=true}derive();drawBase();drawObs();render();dRefresh()});
 store.sub("secteurs",(list,m)=>{if(list.length)sectors=list.sort((a,b)=>(a.ord??0)-(b.ord??0));else if(!m.fromCache&&isEd())store.set("secteurs",DEF,{nom:"Montagne Noire",ord:0});if(!sectors.find(x=>x.id===curSect))curSect=sectors[0].id;sectUI();try{drawBase()}catch(e){}});
 store.sub("activite",(list,m)=>{const ids=new Set(acts.map(a=>a.id));const fresh=actsReady?list.filter(a=>!ids.has(a.id)&&a.by!==me.uid):[];acts=list;actsReady=true;bell();if(tab==="activite")render();if(fresh.length)banner((fresh[0].byName?fresh[0].byName+" : ":"")+fresh[0].text,6000)},{order:"at",lim:80});
 store.sub("heures",list=>{heures=list;if(tab==="heures")render();dRefresh()});
 store.sub("config",list=>{cfg=Object.fromEntries(list.map(d=>[d.id,d]));flushNtfy();if(tab==="reglages")render()});
 store.sub("capteurs",l=>{vac=l;drawVac();if(tab==="vide")render();dRefresh()});
 if(isEd())store.sub("membres",list=>{membres=list;if(tab==="reglages")render();dRefresh()});
 sectUI();syncState();}

// ---------- vues du menu
function setTab(v){tab=v;document.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===v));if(v==="activite"){lastSeen=new Date().toISOString();ls.set("erab_seen",lastSeen);bell()}render()}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>setTab(b.dataset.v));
function render(){if(!store)return;const v=$("#view");v.innerHTML=({journal:vJournal,vide:vVide,activite:vAct,lignes:vLignes,zones:vZones,carte:vCarte,reglages:vReg,heures:vHeures})[tab]();bindView(v);hydrate(v)}
function seasonBar(){const ss=[...new Set([CUR,...obs.map(sOf)])].sort((a,b)=>b-a);
 return `<div class="filters" style="align-items:center"><span class="small" style="margin-right:4px">Saison</span>${ss.map(s=>`<button class="chip" data-season="${s}" aria-pressed="${s===viewSeason}">${s}${s===CUR?" (en cours)":""}</button>`).join("")}</div>
 <p class="small" style="margin:-4px 0 10px">${viewSeason===CUR?`Saison ${CUR} depuis le 1<sup>er</sup> août ${CUR-1}. Les réparations des saisons passées sont archivées; les bris non réparés sont reportés.`:`Archive de la saison ${viewSeason}.`}</p>`}
function vJournal(){const all=visObs(),open=all.filter(o=>!isDone(o));
 const list=all.filter(o=>(fStat==="tous"||(fStat==="ouvert"?!isDone(o):isDone(o)))&&(!fType||o.type===fType)&&(!fAsg||(fAsg==="moi"?isMine(o):fAsg==="aucun"?!asgOf(o).length:fAsg==="urgent"?["urgent","haute"].includes(prOf(o)):true)))
  .sort((a,b)=>(isDone(a)-isDone(b))||(PRIOS[prOf(a)].o-PRIOS[prOf(b)].o)||String(b.at).localeCompare(String(a.at)));
 const mineN=open.filter(isMine).length;
 const brisL=lines.filter(l=>["bris","rep"].includes(lst(l.id).status)).length;
 return seasonBar()+`<div class="kpis"><div class="kpi"><b>${open.length}</b><span>à faire</span></div><div class="kpi"><b>${all.length-open.length}</b><span>faits</span></div><div class="kpi"><b>${brisL}</b><span>lignes en bris</span></div><div class="kpi"><b style="color:#7a4fd6">${mineN}</b><span>assignés à moi</span></div></div>
 <div class="filters">${[["","Tout le monde"],["moi","Assignés à moi"+(mineN?" ("+mineN+")":"")],["urgent","Urgents / hauts"],["aucun","Non assignés"]].map(([k,l])=>`<button class="chip" data-fa="${k}" aria-pressed="${fAsg===k}">${l}</button>`).join("")}</div>
 <div class="filters">${[["ouvert","À faire"],["regle","Faits"],["tous","Tous"]].map(([k,l])=>`<button class="chip" data-fs="${k}" aria-pressed="${fStat===k}">${l}</button>`).join("")}</div>
 <div class="filters">${[["","Tous types"],...Object.entries(TYPES).map(([k,t])=>[k,t.l])].map(([k,l])=>`<button class="chip" data-ft="${k}" aria-pressed="${fType===k}">${l}</button>`).join("")}</div>
 ${list.length?list.map(o=>{const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line);return `<div class="item" data-obs="${esc(o.id)}">${o.photos&&o.photos[0]?pimg(o.photos[0],"thumb"):`<div class="thumb"></div>`}<div style="flex:1"><span class="badge" style="--c:${t.c}">${t.l}</span>${prOf(o)!=="normale"&&!isDone(o)?` <span class="badge" style="--c:${PRIOS[prOf(o)].c}">${PRIOS[prOf(o)].l}</span>`:""}${asgOf(o).length?` <span class="meta">→ ${esc(asgOf(o).map(a=>a.nom).join(", "))}</span>`:""}${isWork(o)?` <span class="meta">· ${stLabel(o)}</span>`:o.status==="regle"?` <span class="meta">· réparé</span>`:""}${sOf(o)<viewSeason?` <span class="meta">· reporté de ${sOf(o)}</span>`:""}<p>${esc(o.note)||"<span class=meta>Sans note</span>"}</p><div class="meta">${fmtD(o.at)}${ln?" · "+esc(ln):""}${o.byName?" · "+esc(o.byName):""}</div></div></div>`}).join(""):`<div class="empty">Aucun signalement ${fStat==="ouvert"?"ouvert ":""}pour cette saison.<br>Touchez <b>Signaler</b> pour ajouter un bris, une photo ou un point GPS.</div>`}`}
function vAct(){return `<div class="h2">Activité</div>${store&&store.kind==="fire"?`<div class="row" style="margin-bottom:10px"><button class="btn pri" id="bMsg" style="flex:1">📣 Envoyer un message à l'équipe</button></div>`:""}${acts.length?acts.map(a=>{const k=ACT[a.kind]||ACT.carte;return `<div class="item" ${a.obs?`data-obs="${esc(a.obs)}"`:""}><span class="badge" style="--c:${k.c};width:104px;flex:none">${k.l}</span><div style="flex:1"><div>${esc(a.text)}</div><div class="meta">${sectors.length>1?esc(sectName(sectOf(a)))+" · ":""}${ago(a.at)}${a.byName?" · "+esc(a.byName):""}</div></div></div>`}).join(""):`<div class="empty">Rien encore. Les signalements, réparations et changements de la carte apparaîtront ici.</div>`}`}
// ---------- capteurs de vide (passerelle erab-bridge)
const VSTAT={alarme:{l:"Alarme",c:"#d01f1f",o:0},bas:{l:"Attention",c:"#f08a00",o:1},hors_ligne:{l:"Hors ligne",c:"#7d8a82",o:2},ok:{l:"OK",c:"#2fa85f",o:3}};
const VTYP={vide:{l:"Vide",i:"🌀"},niveau:{l:"Niveau",i:"🛢️"},temperature:{l:"Température",i:"🌡️"},debit:{l:"Débit",i:"💧"},concentration:{l:"Brix",i:"🍁"},pression:{l:"Pression",i:"⏲️"},marche:{l:"Marche",i:"⚙️"},compteur:{l:"Compteur",i:"🔢"},autre:{l:"Mesure",i:"•"}};
const vSt=v=>{const b=VSTAT[v.etat]||VSTAT.ok;if(v.etat==="alarme"||v.etat==="bas"){const t=v.type||"vide";const l=t==="vide"?(v.etat==="alarme"?"Fuite probable":"Vide bas"):t==="niveau"?(v.val>=50?(v.etat==="alarme"?"Presque plein":"Niveau haut"):(v.etat==="alarme"?"Presque vide":"Niveau bas")):b.l;return {...b,l}}return b};
const vFmt=v=>v.etat==="hors_ligne"?"—":v.type==="marche"?(v.val?"ON":"OFF"):(v.unit==="inHg"||!v.type||v.type==="vide")?(+v.val).toFixed(1)+'"':(+v.val).toFixed(v.type==="niveau"||v.type==="debit"?0:1)+(v.unit?" "+v.unit:"");
function vacPos(v){if(v.lat!=null&&v.lng!=null)return [v.lat,v.lng];if(v.emplacement){const e=String(v.emplacement).toLowerCase(),f=layer.find(x=>x.kind==="point"&&String(x.name).toLowerCase()===e);if(f){const c=dec(f.c)[0];return [c[1],c[0]]}}if(!v.ligne)return null;const n=String(v.ligne).toLowerCase(),l=lines.find(x=>String(x.name).toLowerCase()===n||lineLabel(x.id).toLowerCase()===n);if(!l)return null;const c=l.coords[l.coords.length-1];return [c[1],c[0]]}
const vacHere=()=>vac.filter(v=>sectOf(v)===curSect).sort((a,b)=>(vSt(a).o-vSt(b).o)||(a.val-b.val));
function drawVac(){gVac.clearLayers();const pile={};vacHere().forEach(v=>{const p=vacPos(v);if(!p)return;const st=vSt(v),pk=p[0].toFixed(5)+","+p[1].toFixed(5),k=pile[pk]=(pile[pk]??-1)+1;
 L.marker(p,{icon:L.divIcon({className:"",iconSize:[74,24],iconAnchor:[37,12-k*27],html:`<div class="vpill${v.etat==="alarme"?" valarm":""}" style="--c:${st.c}">${(VTYP[v.type]||VTYP.vide).i} ${vFmt(v)}</div>`}),zIndexOffset:500})
  .on("click",e=>{L.DomEvent.stop(e);if(drawing||pickMode||editMode||shapeEdit)return;openVac(v)}).bindTooltip(esc(v.nom)+" · "+st.l,{direction:"top"}).addTo(gVac)})}
function openVac(v){const st=vSt(v),p=vacPos(v);openSheet(`<div class="row" style="justify-content:space-between"><span class="badge" style="--c:${st.c};font-size:16px">${st.l}</span><button class="btn" data-close>Fermer</button></div>
 <div style="font:700 44px/1.1 'Barlow Condensed',sans-serif;margin:10px 0">${vFmt(v).replace('"',' <span style="font-size:22px">po Hg</span>')}</div>
 <div><b>${esc(v.nom)}</b> <span class="meta">· ${(VTYP[v.type]||VTYP.vide).l}</span>${v.ligne?" · "+esc(v.ligne):""}${v.emplacement?" · "+esc(v.emplacement):""}</div>
 <div class="meta">Mesure ${ago(v.at)} · source ${esc(v.source||"")}${v.bat!=null?" · batterie "+esc(v.bat):""}</div>
 ${p?`<div class="pos">${p[0].toFixed(6)}, ${p[1].toFixed(6)}${dist({lat:p[0],lng:p[1]})} · <a href="${gmaps(p[0],p[1])}" target="_blank" rel="noopener">Google Maps</a></div>`:`<p class="small">Position inconnue : associez ce capteur à une ligne ou une installation dans l'app Gestion › Capteurs.</p>`}
 ${v.etat!=="ok"&&v.etat!=="hors_ligne"&&(v.type||"vide")==="vide"?`<div class="row" style="margin-top:12px"><button class="btn pri" id="vSig" style="flex:1">Signaler une fuite à cet endroit</button></div>`:""}`);
 const b=$("#vSig");if(b)b.onclick=()=>{closeSheet();const ln=v.ligne?lines.find(x=>String(x.name).toLowerCase()===String(v.ligne).toLowerCase()):null;openAdd(p?{lat:p[0],lng:p[1],src:"capteur "+v.nom}:null,ln?ln.id:null);draft.type="fuite";draft.note="Vide "+vFmt(v)+" — capteur "+v.nom;showDraft()}}
let vFilt="";
function vVide(){const all=vacHere(),vs=all.filter(v=>!vFilt||(v.type||"vide")===vFilt),n=k=>all.filter(v=>v.etat===k).length,types=[...new Set(all.map(v=>v.type||"vide"))];
 return `<div class="h2">Capteurs en temps réel</div><div class="kpis"><div class="kpi"><b style="color:#d01f1f">${n("alarme")}</b><span>alarmes</span></div><div class="kpi"><b style="color:#f08a00">${n("bas")}</b><span>à surveiller</span></div><div class="kpi"><b>${all.length}</b><span>capteurs</span></div></div>
 ${types.length>1?`<div class="filters">${[["","Tous"],...types.map(t=>[t,(VTYP[t]||VTYP.autre).i+" "+(VTYP[t]||VTYP.autre).l])].map(([k,l])=>`<button class="chip" data-vf="${k}" aria-pressed="${vFilt===k}">${l}</button>`).join("")}</div>`:""}
 ${vs.length?vs.map(v=>{const st=vSt(v);return `<div class="item" data-vac="${esc(v.id)}"><div class="vpill" style="--c:${st.c};flex:none">${vFmt(v)}</div><div style="flex:1"><b>${esc(v.nom)}</b> <span class="meta">· ${(VTYP[v.type]||VTYP.vide).l}${v.ligne?" · "+esc(v.ligne):""}${v.emplacement?" · "+esc(v.emplacement):""}</span><div class="meta">${st.l} · ${ago(v.at)}</div></div></div>`}).join(""):`<div class="empty">Aucun capteur pour ce secteur.<br>Branchez la clé USB erab-bridge sur le système de surveillance et tapez <b>sh install.sh</b>.</div>`}`}
function vLignes(){const tot=lines.reduce((a,l)=>a+l.len,0);
 return `<div class="h2">Maîtres-lignes · saison ${viewSeason}</div><table><thead><tr><th>Ligne</th><th class="n">Longueur</th><th>État</th><th class="n">Ouverts</th></tr></thead><tbody>${lines.map(l=>{const st=lst(l.id).status||"ok",n=visObs().filter(o=>o.line===l.id&&!isDone(o)).length;return `<tr class="click" data-line="${l.id}"><td>${esc(l.label)}</td><td class="n">${fmtM(l.len)}</td><td><span class="badge" style="--c:${st==="ok"?"#2fa85f":LSTAT[st].h}">${LSTAT[st].l}</span></td><td class="n">${n||"–"}</td></tr>`}).join("")}</tbody><tfoot><tr><td>Total · ${lines.length} lignes</td><td class="n">${fmtM(tot)}</td><td></td><td></td></tr></tfoot></table><p class="small">L'état des lignes repart à OK à chaque nouvelle saison. Longueurs à plat, sans dénivelé.</p>`}
function vZones(){const ha=zones.reduce((a,z)=>a+(+z.ha||0),0),pot=zones.reduce((a,z)=>a+(+z.pot||0),0);
 return `<div class="h2">Zones</div><table><thead><tr><th>Zone</th><th class="n">ha</th><th class="n">Potentiel</th><th class="n">/ha</th></tr></thead><tbody>${zones.map(z=>`<tr class="click" data-zone="${z.id}"><td><span class="badge" style="--c:${z.color}">${esc(z.name)}</span></td><td class="n">${(+z.ha||0).toLocaleString("fr-CA")}</td><td class="n">${(+z.pot||0).toLocaleString("fr-CA")}</td><td class="n">${z.ha&&z.pot?Math.round(z.pot/z.ha):"–"}</td></tr>`).join("")}</tbody><tfoot><tr><td>Total</td><td class="n">${ha.toLocaleString("fr-CA",{maximumFractionDigits:1})}</td><td class="n">${pot.toLocaleString("fr-CA")}</td><td class="n">${ha?Math.round(pot/ha):"–"}</td></tr></tfoot></table>`}
function vCarte(){const grp=(t,arr,lab)=>arr.length?`<div class="small" style="margin:14px 0 4px;font-weight:600">${t} (${arr.length})</div>`+arr.map(f=>`<div class="item" data-feat="${f.id}" style="padding:9px 4px"><span class="badge" style="--c:${f.color||"#33463a"}">${esc(lab(f))}</span><span class="meta" style="margin-left:auto">${f.len?fmtM(f.len):f.ha?f.ha+" ha":""}</span></div>`).join(""):"";
 return `<div class="h2">Carte · ${esc(sectName(curSect))}</div>
 ${isEd()?`<div class="row"><button class="btn pri" id="bEdit">${editMode?"Quitter le mode édition":"Modifier la carte"}</button><button class="btn" id="bSectEd">Renommer / supprimer le secteur</button><button class="btn" id="bSectNew">+ Nouveau secteur</button></div>
 <p class="small">En mode édition : ajoutez une ligne (en touchant la carte ou en marchant avec le GPS), une zone ou un point avec la barre du bas, ou touchez un élément pour le renommer, déplacer son tracé ou le supprimer.</p>
 <label class="f">Importer un KML (export de Google My Maps)</label>
 <div class="row"><label class="btn">Choisir un fichier KML<input type="file" id="kmlIn" accept=".kml,application/vnd.google-earth.kml+xml,text/xml"></label></div><div id="kmlBox"></div>`
 :`<p class="small">Seuls les administrateurs peuvent modifier la carte.</p>`}
 <label class="f">Exporter</label><div class="row"><button class="btn" id="bKml">KML (My Maps)</button><button class="btn" id="bGeo">GeoJSON + signalements</button></div>
 ${grp("Lignes",lines,f=>f.label)}${grp("Zones",zones,f=>f.name)}${grp("Points",pts,f=>f.name)}${grp("Bâtiments",stations,f=>f.name)}`}
function vReg(){const a=cfg.alertes||{};
 return `<div class="h2">Réglages</div>
 <label class="f">Mon compte</label>
 <div class="pos">${esc(me.nom)}${me.email?` · ${esc(me.email)}`:""} · ${isEd()?"administrateur":"membre"}${store.kind==="local"?"<br><span class=meta>Mode essai : les données restent sur cet appareil. Branchez Firebase pour partager avec l'équipe.</span>":""}</div>
 ${store.kind==="fire"?`<div class="row" style="margin-top:8px"><button class="btn" id="bOut">Se déconnecter</button></div>`:""}
 <label class="f">Carte hors ligne</label>
 <p class="small" style="margin:0 0 8px">Les tuiles déjà vues restent en mémoire. Avant d'aller dans un secteur sans réseau, préparez le fond satellite de toute l'érablière (environ 600 tuiles, 15 à 25 Mo).</p>
 <div class="row"><button class="btn" id="bOff">Préparer la carte hors ligne</button></div><div class="small" id="offMsg"></div>
 <label class="f">Installer sur le téléphone</label>
 <p class="small" style="margin:0">iPhone : ouvrir dans Safari › bouton Partager › « Sur l'écran d'accueil ». Android : menu ⋮ › « Installer l'application ».</p>
 ${isEd()&&store.kind==="fire"?`<label class="f">Alertes sur téléphone (ntfy)</label>
 <p class="small" style="margin:0 0 8px">Installez l'app gratuite <b>ntfy</b> (App Store / Play Store), touchez +, et abonnez-vous au sujet ci-dessous. Vous recevrez un avis à chaque signalement, réparation ou changement.</p>
 <div class="row"><input type="text" id="ntTopic" value="${esc(a.topic||"")}" placeholder="Sujet secret" style="flex:1"><button class="btn" id="ntGen">Générer</button></div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="ntSkip" ${a.skipUid===me.uid?"checked":""} style="width:22px;height:22px"> Ne pas m'alerter pour mes propres actions</label>
 <div class="row" style="margin-top:8px"><button class="btn pri" id="ntSave">Enregistrer</button><button class="btn" id="ntTest">Envoyer un test</button></div><div class="small" id="ntMsg"></div>
 <label class="f">Équipe</label>
 ${membres.map(m=>`<div class="item" style="cursor:default;align-items:center"><div style="flex:1">${esc(m.nom||m.id)}<div class="meta">${esc(m.id)} · ${m.role==="admin"?"administrateur":"membre"}</div></div>${m.id!==me.email?`<button class="chip" data-rm="${esc(m.id)}">Retirer</button>`:""}</div>`).join("")}
 <div class="row" style="margin-top:10px"><input type="email" id="mEmail" placeholder="courriel@exemple.com" style="flex:2"><select id="mRole" style="flex:1"><option value="membre">Membre</option><option value="admin">Admin</option></select></div>
 <input type="text" id="mNom" placeholder="Nom (ex. Pierre)" style="margin-top:8px">
 <div class="row" style="margin-top:8px"><button class="btn pri" id="mAdd">Ajouter à l'équipe</button></div><div class="small" id="mMsg"></div>
 <p class="small">La personne crée ensuite son compte dans l'app avec ce courriel.</p>`:""}`}
function geojson(){return JSON.stringify({type:"FeatureCollection",features:[...obs.filter(o=>o.lat!=null).map(o=>({type:"Feature",properties:{type:(TYPES[o.type]||TYPES.autre).l,note:o.note,statut:stLabel(o),saison:sOf(o),date:o.at,par:o.byName||"",repare_le:o.doneAt||"",reparation:o.repairNote||"",ligne:lineLabel(o.line)},geometry:{type:"Point",coordinates:[o.lng,o.lat]}})),...lines.map(l=>({type:"Feature",properties:{ligne:l.label,longueur_m:Math.round(l.len),etat:LSTAT[lst(l.id).status||"ok"].l,note:lst(l.id).note||""},geometry:{type:"LineString",coordinates:l.coords}})),...zones.map(z=>({type:"Feature",properties:{zone:z.name,ha:z.ha,potentiel:z.pot},geometry:{type:"Polygon",coordinates:[z.coords]}}))]},null,1)}
function kml(){const col=h=>{h=(h||"#333333").replace("#","");return "ff"+h.slice(4,6)+h.slice(2,4)+h.slice(0,2)};const co=c=>c.map(p=>p[0]+","+p[1]+",0").join(" ");
 const pm=(f,geo,st)=>`<Placemark><name>${esc(f.name)}</name><description>${esc(f.desc||"")}</description><Style>${st}</Style>${geo}</Placemark>`;
 return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${esc(sectName(curSect))}</name>
<Folder><name>Érablière Montagne Noir</name>${[...pts.map(f=>pm(f,`<Point><coordinates>${co(f.coords)}</coordinates></Point>`,`<IconStyle><color>${col(f.color)}</color></IconStyle>`)),...lines.map(f=>pm(f,`<LineString><coordinates>${co(f.coords)}</coordinates></LineString>`,`<LineStyle><color>ff000000</color><width>3</width></LineStyle>`)),...stations.map(f=>pm(f,`<Polygon><outerBoundaryIs><LinearRing><coordinates>${co(f.coords)}</coordinates></LinearRing></outerBoundaryIs></Polygon>`,`<PolyStyle><color>${col("#183a28")}</color></PolyStyle>`))].join("")}</Folder>
<Folder><name>Zones (polygones)</name>${zones.map(f=>pm({...f,desc:f.desc||(f.ha+" ha, potentiel "+f.pot+" entailles")},`<Polygon><outerBoundaryIs><LinearRing><coordinates>${co([...f.coords,f.coords[0]])}</coordinates></LinearRing></outerBoundaryIs></Polygon>`,`<LineStyle><color>${col(f.color)}</color><width>2</width></LineStyle><PolyStyle><color>4d${col(f.color).slice(2)}</color></PolyStyle>`)).join("")}</Folder></Document></kml>`}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function tileList(z0,z1){const b=bounds().pad(.15),out=[];const tx=(lng,z)=>Math.floor((lng+180)/360*2**z),ty=(lat,z)=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
 for(let z=z0;z<=z1;z++){for(let x=tx(b.getWest(),z);x<=tx(b.getEast(),z);x++)for(let y=ty(b.getNorth(),z);y<=ty(b.getSouth(),z);y++)out.push(BASES.sat.url.replace("{z}",z).replace("{x}",x).replace("{y}",y))}return out}
function bindView(v){
 v.querySelectorAll("[data-season]").forEach(b=>b.onclick=()=>{viewSeason=+b.dataset.season;renderAll()});
 v.querySelectorAll("[data-fs]").forEach(b=>b.onclick=()=>{fStat=b.dataset.fs;render()});
 v.querySelectorAll("[data-fa]").forEach(b=>b.onclick=()=>{fAsg=b.dataset.fa;render()});
 v.querySelectorAll("[data-ft]").forEach(b=>b.onclick=()=>{fType=b.dataset.ft;render()});
 v.querySelectorAll("[data-obs]").forEach(b=>b.onclick=()=>{const o=obsAll.find(x=>x.id===b.dataset.obs);if(o){if(sectOf(o)!==curSect)switchSect(sectOf(o),true);toMap();follow=false;locBtn();if(o.lat!=null)map.setView([o.lat,o.lng],Math.max(map.getZoom(),18));openObs(o)}});
 v.querySelectorAll("[data-vf]").forEach(b=>b.onclick=()=>{vFilt=b.dataset.vf;render()});
 v.querySelectorAll("[data-vac]").forEach(b=>b.onclick=()=>{const x=vac.find(y=>y.id===b.dataset.vac);if(!x)return;toMap();const p=vacPos(x);if(p){follow=false;locBtn();map.setView(p,Math.max(map.getZoom(),17))}openVac(x)});
 v.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>{const l=lines.find(x=>x.id===b.dataset.line);toMap();follow=false;locBtn();map.fitBounds(lineLayers[l.id].hit.getBounds(),{padding:[60,60],maxZoom:19});openLine(l)});
 v.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{const z=zones.find(x=>x.id===b.dataset.zone);toMap();map.fitBounds(L.latLngBounds(ll(z.coords)),{padding:[30,30]})});
 v.querySelectorAll("[data-feat]").forEach(b=>b.onclick=()=>{const f=[...lines,...zones,...pts,...stations].find(x=>x.id===b.dataset.feat);if(!f)return;toMap();map.fitBounds(L.latLngBounds(ll(f.coords)),{padding:[60,60],maxZoom:19});if(isEd()){setEdit(true);openFeat(f)}});
 const on=(id,fn)=>{const e=v.querySelector(id);if(e)e.onclick=fn};
 on("#hAdd",()=>{toMap();openHeure()});on("#bMsg",()=>{toMap();openMsg()});on("#hCsv",hCsv);
 v.querySelectorAll("[data-hs]").forEach(b=>b.onclick=()=>{hScope=b.dataset.hs;render()});
 v.querySelectorAll("[data-hid]").forEach(b=>b.onclick=()=>{const x=heures.find(y=>y.id===b.dataset.hid);if(x){toMap();openHeure(x)}});
 on("#bEdit",()=>{setEdit(!editMode);toMap()});
 on("#bSectEd",()=>{toMap();editSect()});
 on("#bSectNew",()=>{toMap();newSect()});
 on("#bKml",()=>download(curSect+".kml",kml(),"application/vnd.google-earth.kml+xml"));
 on("#bGeo",()=>download(curSect+".geojson",geojson(),"application/geo+json"));
 on("#bOut",async()=>{try{await fbAuth.signOut(auth)}catch(e){}location.reload()});
 on("#bOff",async()=>{const urls=tileList(13,18),msg=$("#offMsg");let ok=0,bad=0;$("#bOff").disabled=true;
  for(let i=0;i<urls.length;i+=6){await Promise.all(urls.slice(i,i+6).map(u=>fetch(u,{mode:"no-cors"}).then(()=>ok++,()=>bad++)));msg.textContent=`${ok} / ${urls.length} tuiles…`}
  let est="";try{const e=await navigator.storage.estimate();est=` · ${Math.round(e.usage/1048576)} Mo utilisés sur l'appareil`}catch(e){}
  msg.textContent=bad?`${ok} tuiles prêtes, ${bad} en échec (réseau). Réessayez.`:`Carte satellite prête hors ligne (${ok} tuiles)${est}.`;$("#bOff").disabled=false});
 on("#ntGen",()=>{$("#ntTopic").value="erabliere-"+Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,8)});
 on("#ntSave",async()=>{const t=$("#ntTopic").value.trim().replace(/[^\w-]/g,"");if(t&&t.length<12){$("#ntMsg").textContent="Utilisez au moins 12 caractères (bouton Générer).";return}await store.set("config","alertes",{topic:t,skipUid:$("#ntSkip").checked?me.uid:""});$("#ntMsg").textContent=t?"Enregistré. Abonnez-vous à « "+t+" » dans l'app ntfy.":"Alertes désactivées."});
 on("#ntTest",async()=>{const t=$("#ntTopic").value.trim();if(!t)return;try{await fetch("https://ntfy.sh/"+encodeURIComponent(t),{method:"POST",body:"Test : les alertes de l'érablière fonctionnent.",headers:{Title:"Erablieres",Tags:"maple_leaf"}});$("#ntMsg").textContent="Test envoyé."}catch(e){$("#ntMsg").textContent="Envoi impossible (réseau)."}});
 on("#mAdd",async()=>{const e=$("#mEmail").value.trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){$("#mMsg").textContent="Courriel invalide.";return}await store.set("membres",e,{role:$("#mRole").value,nom:$("#mNom").value.trim(),ajoutePar:me.uid,at:new Date().toISOString()});$("#mMsg").textContent=e+" ajouté.";logAct("carte","Équipe : "+($("#mNom").value.trim()||e)+" ajouté")});
 v.querySelectorAll("[data-rm]").forEach(b=>b.onclick=async()=>{if(b.dataset.ok){await store.del("membres",b.dataset.rm);return}b.dataset.ok=1;b.textContent="Confirmer"});
 const ki=v.querySelector("#kmlIn");if(ki)ki.onchange=async e=>{const file=e.target.files[0];if(!file)return;let items=[];try{items=parseKml(await file.text())}catch(x){}
  const box=$("#kmlBox");if(!items.length){box.innerHTML=`<div class="err">Aucun élément lisible. Exportez en KML (pas KMZ) depuis My Maps.</div>`;return}
  const n=k=>items.filter(i=>i.kind===k).length;
  box.innerHTML=`<p>${n("ligne")} lignes, ${n("zone")} zones, ${n("point")} points trouvés.</p><div class="row"><button class="btn" id="kAdd">Ajouter à la carte</button><button class="btn red" id="kRep">Remplacer toute la carte</button></div><div id="kMsg" class="small"></div>`;
  const run=async replace=>{$("#kAdd").disabled=$("#kRep").disabled=true;
   try{if(replace){await seedBase();for(const f of layer)await store.del("couche",f.id)}else await seedBase();
    let i=0;const off=replace?0:Date.now();for(const it of items){await store.set("couche",nid("k"),{...it,sect:curSect,ord:off+it.ord});i++;$("#kMsg").textContent=i+" / "+items.length+"…"}
    logAct("carte","Carte "+(replace?"remplacée":"complétée")+" par un import KML ("+items.length+" éléments)");$("#kMsg").textContent="Import terminé.";fitted=false}catch(x){$("#kMsg").textContent="Import interrompu."}};
  $("#kAdd").onclick=()=>run(false);$("#kRep").onclick=()=>{$("#kMsg").innerHTML=`Les signalements restent, mais l'état des lignes actuelles sera perdu. <button class="btn red" id="kRep2">Confirmer</button>`;$("#kRep2").onclick=()=>run(true)}};
}

// ---------- fiches
const scrim=$("#scrim"),sheet=$("#sheet");
function openSheet(html){sheet.innerHTML=html;scrim.classList.add("on");sheet.scrollTop=0;const x=sheet.querySelector("[data-close]");if(x)x.onclick=closeSheet;hydrate(sheet);if(asgCur){const a=asgCur;asgCur=null;bindAsg(a)}}
function closeSheet(){scrim.classList.remove("on");sheet.innerHTML=""}
scrim.addEventListener("click",e=>{if(e.target===scrim)closeSheet()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&scrim.classList.contains("on"))closeSheet()});
const gmaps=(lat,lng)=>`https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
function openMsg(){let urg=false,tgt=curSect;const a=cfg.alertes;
 openSheet(head("Message à l'équipe")+`<p class="small" style="margin-top:0">Envoyé en notification à tous ceux qui sont abonnés aux alertes (app ntfy), et affiché dans l'Activité.</p>
 <label class="f" for="mTxt">Message</label><textarea id="mTxt" placeholder="Ex. Bris sur la ligne 7, quelqu'un peut aller voir ?"></textarea>
 <label class="f">Rapides</label><div class="types">${["On arrête pour aujourd'hui","Retour à la cabane","Besoin d'aide","Pompe arrêtée","Orage : sortez du bois"].map(t=>`<button class="chip" data-mq="${esc(t)}">${esc(t)}</button>`).join("")}</div>
 <label class="f">Secteur concerné</label><div class="types">${[...sectors.map(x=>[x.id,x.nom]),["*","Tous"]].map(([k,l])=>`<button class="chip" data-mt="${esc(k)}" aria-pressed="${k===tgt}">${esc(l)}</button>`).join("")}</div>
 <label class="f">Importance</label><div class="types"><button class="chip" data-mu="0" aria-pressed="true">Normal</button><button class="chip" data-mu="1" aria-pressed="false">🚨 Urgent (sonnerie forte)</button></div>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="mSend" style="flex:1">Envoyer</button></div><div class="small" id="mRes">${a&&a.topic?"":"Les alertes ne sont pas configurées (Réglages › Alertes) : le message sera seulement dans l'Activité."}</div>`);
 sheet.querySelectorAll("[data-mq]").forEach(b=>b.onclick=()=>{$("#mTxt").value=b.dataset.mq});
 sheet.querySelectorAll("[data-mt]").forEach(b=>b.onclick=()=>{tgt=b.dataset.mt;sheet.querySelectorAll("[data-mt]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 sheet.querySelectorAll("[data-mu]").forEach(b=>b.onclick=()=>{urg=b.dataset.mu==="1";sheet.querySelectorAll("[data-mu]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 $("#mSend").onclick=async()=>{const t=$("#mTxt").value.trim();if(!t){$("#mRes").textContent="Écrivez un message.";return}$("#mSend").disabled=true;
  const sn=tgt==="*"?"Toutes les érablières":sectName(tgt),ascii=x=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"");
  try{await store.set("activite",nid("a"),{kind:"message",text:(urg?"URGENT — ":"")+t,sect:tgt==="*"?curSect:tgt,by:me.uid,byName:me.nom,at:new Date().toISOString(),season:CUR,urgent:urg})}catch(e){}
  if(a&&a.topic){const q=ls.get("erab_ntfyq",[]);q.push({b:me.nom+" : "+t,t:(urg?"URGENT - ":"")+ascii(sn),u:urg?1:0});ls.set("erab_ntfyq",q.slice(-50));await flushNtfy()}
  const left=ls.get("erab_ntfyq",[]).length;$("#mRes").textContent=!(a&&a.topic)?"Ajouté à l'Activité.":left?"Pas de réseau : le message partira au retour du signal.":"Message envoyé.";setTimeout(closeSheet,1200)}}
const head=t=>`<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div class="h2" style="margin:0">${t}</div><button class="btn" data-close>Fermer</button></div>`;
const dist=o=>fix&&o.lat!=null?" · à "+fmtM(hav([fix.lng,fix.lat],[o.lng,o.lat]))+" de vous":"";

let asgCur=null;
function asgPanel(o){asgCur=o;const pr=prOf(o),as=asgOf(o);
 if(!isEd())return (pr!=="normale"||as.length)?`<div class="row" style="margin:8px 0;gap:6px">${pr!=="normale"?`<span class="badge" style="--c:${PRIOS[pr].c}">Priorité ${PRIOS[pr].l.toLowerCase()}</span>`:""}${as.length?`<span class="meta">Assigné à ${esc(as.map(a=>a.nom).join(", "))}</span>`:""}</div>`:"";
 const mem=membres.slice().sort((a,b)=>String(a.nom||a.id).localeCompare(String(b.nom||b.id),"fr"));
 return `<div class="asg"><label class="f">Priorité <span class="meta">(admin)</span></label><div class="types">${Object.entries(PRIOS).map(([k,v])=>`<button class="chip" data-pr="${k}" aria-pressed="${k===pr}" style="--c:${v.c}">${v.l}</button>`).join("")}</div>
 <label class="f">Assigner à <span class="meta">(une ou plusieurs personnes)</span></label><div class="types">${mem.map(m=>`<button class="chip" data-as="${esc(m.id)}" data-nm="${esc(m.nom||m.id.split("@")[0])}" aria-pressed="${as.some(a=>a.email===m.id)}">${esc(m.nom||m.id.split("@")[0])}${m.role==="admin"?" ★":""}</button>`).join("")||`<span class="meta">Ajoutez des membres dans Réglages › Équipe.</span>`}</div>
 <div class="row" style="margin-top:8px"><button class="btn pri" id="asSave">Enregistrer et avertir</button><span class="small" id="asMsg"></span></div></div>`}
function bindAsg(o){if(!isEd())return;let pr=prOf(o),sel=asgOf(o).map(a=>({...a}));
 sheet.querySelectorAll("[data-pr]").forEach(b=>b.onclick=()=>{pr=b.dataset.pr;sheet.querySelectorAll("[data-pr]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 sheet.querySelectorAll("[data-as]").forEach(b=>b.onclick=()=>{const e=b.dataset.as,i=sel.findIndex(a=>a.email===e);if(i>=0)sel.splice(i,1);else sel.push({email:e,nom:b.dataset.nm});b.setAttribute("aria-pressed",i<0)});
 const sv=sheet.querySelector("#asSave");if(!sv)return;sv.onclick=async()=>{sv.disabled=true;const before=asgOf(o).map(a=>a.email),added=sel.filter(a=>!before.includes(a.email)),prCh=pr!==prOf(o);
  await store.upd("obs",o.id,{prio:pr,assign:sel,assignBy:me.nom,assignAt:new Date().toISOString()});
  const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line),what=t.l+(ln?" · "+ln:"");
  if(added.length)logAct("assign",`📌 ${added.map(a=>a.nom).join(", ")} : ${what} (priorité ${PRIOS[pr].l.toLowerCase()})`,{obs:o.id});
  else if(prCh)logAct("assign",`Priorité ${PRIOS[pr].l.toLowerCase()} : ${what}`,{obs:o.id});
  o.prio=pr;o.assign=sel;sheet.querySelector("#asMsg").textContent=added.length?"Assigné et averti.":"Enregistré.";sv.disabled=false;renderAll()}}
function openObs(o){if(isWork(o))return openWork(o);const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line),mine=o.by===me.uid,past=sOf(o)<CUR&&o.status==="regle";
 openSheet(`<div class="row" style="justify-content:space-between"><span class="badge" style="--c:${t.c};font-size:16px">${t.l}</span><button class="btn" data-close>Fermer</button></div>${asgPanel(o)}
 <p style="white-space:pre-wrap">${esc(o.note)||'<span class="meta">Sans note</span>'}</p>
 ${(o.photos||[]).map(p=>pimg(p,"big","Photo du signalement")).join("")}
 <div class="meta">Saison ${sOf(o)} · ${fmtD(o.at)}${o.byName?" · "+esc(o.byName):""}${ln?" · "+esc(ln):""}</div>
 ${o.lat!=null?`<div class="pos" style="margin-top:10px">${o.lat.toFixed(6)}, ${o.lng.toFixed(6)}${dist(o)} · <a href="${gmaps(o.lat,o.lng)}" target="_blank" rel="noopener">Google Maps</a></div>`:""}
 ${o.status==="regle"?`<div style="margin-top:14px;padding:12px;border-radius:10px;background:var(--chip)"><b>Réparé</b> <span class="meta">${o.doneAt?fmtD(o.doneAt):""}${o.doneByName?" · "+esc(o.doneByName):""}</span>${o.repairNote?`<p style="white-space:pre-wrap;margin:6px 0 0">${esc(o.repairNote)}</p>`:""}${(o.repairPhotos||[]).map(p=>pimg(p,"big","Photo après réparation")).join("")}</div>`:""}
 ${!past?`<div class="row" style="margin-top:14px">${o.status==="regle"?`<button class="btn" id="bReopen">Rouvrir</button>`:`<button class="btn pri" id="bDone">Marquer réparé</button>`}${mine||isEd()?`<button class="btn red" id="bDel">Supprimer</button>`:""}</div><div id="conf"></div><div id="rep"></div>`:""}`);
 const dn=$("#bDone");if(dn)dn.onclick=()=>{dn.style.display="none";const rf=[];
  $("#rep").innerHTML=`<label class="f" for="rNote">Ce qui a été fait</label><textarea id="rNote" placeholder="Ex. raccord 5/16 remplacé, vacuum revenu à 25 po"></textarea>
  <label class="f">Photo après réparation</label><label class="btn">Prendre ou ajouter une photo<input type="file" id="rPh" accept="image/*" multiple></label><div class="photos" id="rPrev"></div>
  <div class="row" style="margin-top:14px"><button class="btn pri" id="rOk" style="flex:1">Confirmer la réparation</button></div><div class="err" id="rErr"></div>`;
  $("#rPh").onchange=async e=>{for(const f of e.target.files){try{const d=await shrink(f);rf.push(d);$("#rPrev").insertAdjacentHTML("beforeend",`<img alt="" src="${d}">`)}catch(x){}}};
  $("#rOk").onclick=async()=>{const ok=$("#rOk");ok.disabled=true;ok.textContent="Enregistrement…";
   try{const ids=await savePhotos(rf,o.id),note=$("#rNote").value.trim();
    await store.upd("obs",o.id,{status:"regle",doneAt:new Date().toISOString(),doneBy:me.uid,doneByName:me.nom,doneSeason:CUR,repairNote:note,repairPhotos:ids});
    logAct("reparation","Réparé : "+t.l+(ln?" · "+ln:"")+(note?" — « "+note.slice(0,80)+" »":""),{obs:o.id});
    if(o.line){const left=visObs().filter(x=>x.line===o.line&&x.id!==o.id&&!isDone(x)).length,s=lst(o.line);
     if(!left&&["bris","rep","verif"].includes(s.status)){const {id,...rest}=s;await store.set("lignes",o.line,{...rest,status:"ok",season:CUR,at:new Date().toISOString(),by:me.uid})}}
    closeSheet()}catch(e){ok.disabled=false;ok.textContent="Confirmer la réparation";$("#rErr").textContent="Enregistrement impossible : "+(e.message||e)}}};
 const ro=$("#bReopen");if(ro)ro.onclick=async()=>{await store.upd("obs",o.id,{status:"ouvert",season:CUR});logAct("reouvert","Rouvert : "+t.l+(ln?" · "+ln:""),{obs:o.id});closeSheet()};
 const dl_=$("#bDel");if(dl_)dl_.onclick=()=>{$("#conf").innerHTML=`<div class="row" style="margin-top:10px"><span>Supprimer définitivement ce signalement ?</span><button class="btn red" id="bDel2">Oui, supprimer</button></div>`;
  $("#bDel2").onclick=async()=>{await store.del("obs",o.id);for(const p of [...(o.photos||[]),...(o.repairPhotos||[])])await store.del("photos",p);logAct("suppression","Supprimé : "+t.l+(ln?" · "+ln:""));closeSheet()}};
}
function openLine(l){const s=lst(l.id),st=s.status||"ok",n=visObs().filter(o=>o.line===l.id);
 openSheet(head(esc(l.label))+`<div class="meta">${fmtM(l.len)} · saison ${viewSeason} · ${n.filter(o=>!isDone(o)).length} signalement(s) ouvert(s) sur ${n.length}</div>
 <label class="f">État de la ligne</label><div class="types">${Object.entries(LSTAT).map(([k,v])=>`<button class="chip" data-st="${k}" aria-pressed="${k===st}">${v.l}</button>`).join("")}</div>
 <label class="f" for="lnote">Note</label><textarea id="lnote" placeholder="Ex. vacuum faible au bout, raccord à changer">${esc(s.note||"")}</textarea>
 ${s.at?`<div class="small">Mis à jour ${fmtD(s.at)}</div>`:""}
 ${viewSeason===CUR?`<div class="row" style="margin-top:14px"><button class="btn pri" id="bSaveL">Enregistrer</button><button class="btn" id="bAddL">Signaler sur cette ligne</button></div>`:""}`);
 let pick=st;sheet.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{pick=b.dataset.st;sheet.querySelectorAll("[data-st]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 const sv=$("#bSaveL");if(sv)sv.onclick=async()=>{sv.disabled=true;const note=$("#lnote").value.trim();await store.set("lignes",l.id,{sect:curSect,status:pick,note,season:CUR,at:new Date().toISOString(),by:me.uid});if(pick!==st)logAct("ligne",l.label+" → "+LSTAT[pick].l+(note?" — « "+note.slice(0,80)+" »":""));closeSheet()};
 const al=$("#bAddL");if(al)al.onclick=()=>{const usable=fix&&Date.now()-fix.t<60000&&nearestLine(fix.lat,fix.lng).line?.id===l.id;const c=l.coords[Math.floor(l.coords.length/2)];openAdd(usable?{lat:fix.lat,lng:fix.lng,src:"GPS ±"+Math.round(fix.acc)+" m"}:{lat:c[1],lng:c[0],src:"milieu de la ligne"},l.id)};
}
function openZone(z){const b=L.latLngBounds(ll(z.coords));openSheet(head(esc(z.name))+`<p>${z.ha} ha · potentiel ${(+z.pot||0).toLocaleString("fr-CA")} entailles${z.ha&&z.pot?" ("+Math.round(z.pot/z.ha)+"/ha)":""}</p>${z.desc?`<p class="small">${esc(z.desc)}</p>`:""}<p class="meta">${visObs().filter(o=>o.lat!=null&&b.contains([o.lat,o.lng])).length} signalement(s) dans le secteur cette saison</p>`)}
function openPoint(p){const [x,y]=p.coords[0],k=icoOf(p);openSheet(head(esc(p.name))+`<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">${icoHtml(k,34)}<b>${ICONS[k].l}</b></div>${p.desc?`<p>${esc(p.desc)}</p>`:""}<div class="pos">${y.toFixed(6)}, ${x.toFixed(6)}${dist({lat:y,lng:x})} · <a href="${gmaps(y,x)}" target="_blank" rel="noopener">Google Maps</a></div>`)}

function openWork(o){const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line),mine=o.by===me.uid,ws=WSTAT[o.status]||WSTAT.en_cours,past=sOf(o)<CUR&&isDone(o);
 const hist=(o.suivi||[]).slice().reverse();
 openSheet(`<div class="row" style="justify-content:space-between"><span class="badge" style="--c:${t.c};font-size:16px">${t.l}</span><button class="btn" data-close>Fermer</button></div>${asgPanel(o)}
 <div class="row" style="margin:10px 0"><span class="badge" style="--c:${ws.c};font-size:15px">${ws.l}</span>${ln?`<span class="meta">${esc(ln)}</span>`:""}</div>
 ${(o.photos||[]).map(p=>pimg(p,"big","Photo")).join("")}
 ${o.lat!=null?`<div class="pos">Point d'arrêt : ${o.lat.toFixed(6)}, ${o.lng.toFixed(6)}${dist(o)} · <a href="${gmaps(o.lat,o.lng)}" target="_blank" rel="noopener">Google Maps</a></div>`:""}
 <label class="f">Historique de l'avancement</label>
 ${hist.length?hist.map(h=>`<div class="item" style="cursor:default"><span class="badge" style="--c:${(WSTAT[h.status]||WSTAT.en_cours).c};width:96px;flex:none">${(WSTAT[h.status]||WSTAT.en_cours).l}</span><div style="flex:1">${h.note?`<div style="white-space:pre-wrap">${esc(h.note)}</div>`:""}<div class="meta">${fmtD(h.at)}${h.byName?" · "+esc(h.byName):""}</div></div></div>`).join(""):`<p class="meta">${esc(o.note)||"Aucune note"}</p>`}
 ${!past?`<label class="f">Mettre à jour</label><div class="types">${Object.entries(WSTAT).map(([k,v])=>`<button class="chip" data-ws="${k}" aria-pressed="${k===o.status}">${v.l}</button>`).join("")}</div>
 <label class="f" for="wNote">Où on est rendu</label><textarea id="wNote" placeholder="Ex. chutes installées jusqu'au ruisseau, reprendre côté nord"></textarea>
 <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="wGps" style="width:22px;height:22px" ${fix?"checked":""}> Déplacer le point d'arrêt à ma position GPS</label>
 <div class="row" style="margin-top:14px"><button class="btn pri" id="wOk" style="flex:1">Enregistrer l'avancement</button>${mine||isEd()?`<button class="btn red" id="bDel">Supprimer</button>`:""}</div><div id="conf"></div><div class="err" id="wErr"></div>`:""}`);
 let pick=o.status in WSTAT?o.status:"en_cours";sheet.querySelectorAll("[data-ws]").forEach(b=>b.onclick=()=>{pick=b.dataset.ws;sheet.querySelectorAll("[data-ws]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 const ok=$("#wOk");if(ok)ok.onclick=async()=>{ok.disabled=true;try{const note=$("#wNote").value.trim();let pos={};
   if($("#wGps").checked){try{const p=await waitFix();pos={lat:+p.lat.toFixed(7),lng:+p.lng.toFixed(7)}}catch(e){$("#wErr").textContent="GPS non disponible : le point d'arrêt n'a pas bougé."}}
   const h={at:new Date().toISOString(),by:me.uid,byName:me.nom,status:pick,note,...pos};
   await store.upd("obs",o.id,{status:pick,note:note||o.note||"",suivi:[...(o.suivi||[]),h],season:CUR,...pos});
   logAct("travail",t.l+" · "+WSTAT[pick].l.toLowerCase()+(ln?" · "+ln:"")+(note?" — « "+note.slice(0,80)+" »":""),{obs:o.id});closeSheet()}catch(e){ok.disabled=false;$("#wErr").textContent="Enregistrement impossible : "+(e.message||e)}};
 const dl_=$("#bDel");if(dl_)dl_.onclick=()=>{$("#conf").innerHTML=`<div class="row" style="margin-top:10px"><span>Supprimer définitivement ce travail ?</span><button class="btn red" id="bDel2">Oui, supprimer</button></div>`;
  $("#bDel2").onclick=async()=>{await store.del("obs",o.id);for(const p of (o.photos||[]))await store.del("photos",p);logAct("suppression","Supprimé : "+t.l+(ln?" · "+ln:""));closeSheet()}};
}

// ---------- heures travaillées
let heures=[], hScope="moi";
const TASKS=["Installation de sellettes","Installation de chutes","Entaillage","Entretien de tubulure","Réparation de bris","Bûchage / dégagement","Station de pompage","Évaporation / cabane","Lavage","Autre"];
const hFmt=h=>(Math.round(h*100)/100).toLocaleString("fr-CA")+" h";
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function hVis(){return heures.filter(x=>(x.season??seasonOf(x.date))===viewSeason&&(hScope!=="moi"||x.by===me.uid))}
function vHeures(){const L_=hVis().sort((a,b)=>String(b.date+b.at).localeCompare(String(a.date+a.at)));const tot=L_.reduce((a,x)=>a+(+x.h||0),0);
 const wk=new Date();wk.setDate(wk.getDate()-((wk.getDay()+6)%7));const wkS=wk.toISOString().slice(0,10);const tw=L_.filter(x=>x.date>=wkS).reduce((a,x)=>a+(+x.h||0),0);
 const by=(f)=>{const m={};L_.forEach(x=>{const k=f(x)||"—";m[k]=(m[k]||0)+(+x.h||0)});return Object.entries(m).sort((a,b)=>b[1]-a[1])};
 return `<div class="h2">Heures travaillées</div>
 <div class="row" style="margin-bottom:10px"><button class="btn pri" id="hAdd" style="flex:1">+ Ajouter des heures</button></div>
 <div class="filters">${isEd()?[["moi","Mes heures"],["tous","Toute l'équipe"]].map(([k,l])=>`<button class="chip" data-hs="${k}" aria-pressed="${hScope===k}">${l}</button>`).join(""):""}<span class="small" style="align-self:center">Saison ${viewSeason}</span></div>
 <div class="kpis"><div class="kpi"><b>${hFmt(tot)}</b><span>cette saison</span></div><div class="kpi"><b>${hFmt(tw)}</b><span>cette semaine</span></div><div class="kpi"><b>${L_.length}</b><span>entrées</span></div></div>
 ${hScope==="tous"&&isEd()?`<label class="f">Par personne</label><table><tbody>${by(x=>x.byName).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${hFmt(v)}</td></tr>`).join("")}</tbody></table>`:""}
 <label class="f">Par tâche</label><table><tbody>${by(x=>x.task).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${hFmt(v)}</td></tr>`).join("")||`<tr><td class="meta">Aucune heure entrée</td></tr>`}</tbody></table>
 <label class="f">Entrées</label>
 ${L_.map(x=>`<div class="item" data-hid="${esc(x.id)}"><div style="flex:1"><b>${hFmt(+x.h||0)}</b> · ${esc(x.task||"")}${x.sect&&sectors.length>1?` <span class="meta">· ${esc(sectName(x.sect))}</span>`:""}<div class="meta">${esc(x.date)}${hScope==="tous"?" · "+esc(x.byName||""):""}${x.note?" · "+esc(x.note):""}</div></div></div>`).join("")||`<div class="empty">Aucune heure pour cette saison.</div>`}
 <div class="row" style="margin-top:14px"><button class="btn" id="hCsv">Exporter (Excel / CSV)</button></div>`}
function openHeure(x){const n=!x;x=x||{date:today(),h:"",task:TASKS[0],note:"",sect:curSect};const mine=n||x.by===me.uid;
 openSheet(head(n?"Ajouter des heures":"Heures")+`<div class="row" style="flex-wrap:nowrap"><div style="flex:1"><label class="f" for="hDate">Date</label><input type="text" id="hDate" value="${esc(x.date)}" inputmode="numeric" placeholder="AAAA-MM-JJ"></div><div style="flex:1"><label class="f" for="hH">Heures</label><input type="number" id="hH" step="0.25" min="0" max="24" inputmode="decimal" value="${esc(x.h)}" placeholder="Ex. 7.5"></div></div>
 <label class="f" for="hTask">Tâche</label><select id="hTask">${TASKS.map(t=>`<option ${t===x.task?"selected":""}>${t}</option>`).join("")}</select>
 <label class="f" for="hSect">Érablière / secteur</label><select id="hSect">${sectors.map(s=>`<option value="${esc(s.id)}" ${s.id===(x.sect||curSect)?"selected":""}>${esc(s.nom)}</option>`).join("")}</select>
 <label class="f" for="hNote">Note</label><input type="text" id="hNote" value="${esc(x.note||"")}" placeholder="Ex. zone 2, lignes 7 à 9">
 ${mine||isEd()?`<div class="row" style="margin-top:16px"><button class="btn pri" id="hOk" style="flex:1">Enregistrer</button>${!n?`<button class="btn red" id="hDel">Supprimer</button>`:""}</div>`:""}<div class="err" id="hErr"></div>`);
 const ok=$("#hOk");if(ok)ok.onclick=async()=>{const date=$("#hDate").value.trim(),h=+$("#hH").value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){$("#hErr").textContent="Date au format AAAA-MM-JJ.";return}if(!(h>0&&h<=24)){$("#hErr").textContent="Entrez un nombre d'heures entre 0 et 24.";return}
  ok.disabled=true;const v={date,h,task:$("#hTask").value,sect:$("#hSect").value,note:$("#hNote").value.trim(),season:seasonOf(date+"T12:00"),by:n?me.uid:x.by,byName:n?me.nom:x.byName,at:x.at||new Date().toISOString()};
  await store.set("heures",n?nid("h"):x.id,v);if(n)logAct("heures",hFmt(h)+" · "+v.task+(v.note?" — "+v.note.slice(0,60):""));closeSheet()};
 const del=$("#hDel");if(del)del.onclick=async()=>{if(!del.dataset.ok){del.dataset.ok=1;del.textContent="Confirmer";return}await store.del("heures",x.id);closeSheet()}}
function hCsv(){const rows=[["Date","Personne","Heures","Tâche","Secteur","Note"],...hVis().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.date,x.byName||"",String(x.h).replace(".",","),x.task||"",sectName(x.sect||DEF),x.note||""])];
 download("heures-saison-"+viewSeason+".csv","\ufeff"+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";")).join("\r\n"),"text/csv")}

// ---------- édition de la carte
function setEdit(on){editMode=on;if(!on){stopDraw();stopShape()}$("#etool").classList.toggle("on",on&&!drawing&&!shapeEdit);$("#bAdd").style.display=on?"none":"";banner(on?"Mode édition de la carte":"",on?2500:0);if(tab==="carte")render()}
$("#eDone").onclick=()=>setEdit(false);
document.querySelectorAll("[data-draw]").forEach(b=>b.onclick=()=>startDraw(b.dataset.draw));
const dbar=$("#dbar");
function showDbar(html){dbar.innerHTML=html;dbar.classList.add("on");$("#etool").classList.remove("on")}
function hideDbar(){dbar.classList.remove("on");dbar.innerHTML="";if(editMode)$("#etool").classList.add("on")}
function startDraw(kind){drawing={kind,pts:[]};
 if(kind==="gps"){if(!startGps())return;follow=true;locBtn();banner("Enregistrement : marchez le long de la ligne. Un point est ajouté tous les 4 m.");
  showDbar(`<span class="small" id="recInfo" style="align-self:center;padding:0 6px">0 m</span><button class="btn pri" id="dFin">Terminer</button><button class="btn" id="dCancel">Annuler</button>`);
  $("#dCancel").onclick=stopDraw;$("#dFin").onclick=()=>{drawing.kind="ligne";finishDraw()};if(fix)recPt(fix);return}
 map.getContainer().style.cursor="crosshair";
 banner(kind==="point"?"Touchez la carte pour placer le point":kind==="ligne"?"Touchez la carte pour chaque point de la ligne":"Touchez la carte pour chaque coin de la zone");
 showDbar(`${fix?`<button class="btn" id="dHere">+ Ma position</button>`:""}<button class="btn" id="dUndo">Retirer le dernier</button><button class="btn pri" id="dFin">Terminer</button><button class="btn" id="dCancel">Annuler</button>`);
 $("#dUndo").onclick=()=>{drawing.pts.pop();drawTmp()};$("#dCancel").onclick=stopDraw;$("#dFin").onclick=finishDraw;
 const h=$("#dHere");if(h)h.onclick=()=>{if(fix)addDrawPt({lat:fix.lat,lng:fix.lng})};
 if(kind==="point"){$("#dUndo").style.display="none";$("#dFin").style.display="none"}}
function recPt(f){if(!drawing||drawing.kind!=="gps")return;if(f.acc>30)return;const p=[f.lng,f.lat],last=drawing.pts[drawing.pts.length-1];if(last&&hav(last,p)<4)return;drawing.pts.push(p);drawTmp();
 let L_=0;for(let i=1;i<drawing.pts.length;i++)L_+=hav(drawing.pts[i-1],drawing.pts[i]);const ri=$("#recInfo");if(ri)ri.textContent=fmtM(L_)+" · "+drawing.pts.length+" pts"}
function addDrawPt(latlng){drawing.pts.push([latlng.lng,latlng.lat]);if(drawing.kind==="point"){finishDraw();return}drawTmp()}
function drawTmp(){gTmp.clearLayers();if(!drawing)return;const c=ll(drawing.pts);if(drawing.kind==="zone"&&c.length>2)L.polygon(c,{color:"#ff3b22",weight:3,dashArray:"6 4",fillOpacity:.15}).addTo(gTmp);else if(c.length>1)L.polyline(c,{color:"#ff3b22",weight:4,dashArray:"6 4"}).addTo(gTmp);if(drawing.kind!=="gps")c.forEach(p=>L.circleMarker(p,{radius:5,color:"#fff",weight:2,fillColor:"#ff3b22",fillOpacity:1,interactive:false}).addTo(gTmp))}
function finishDraw(){const d=drawing;if(!d)return;const min=d.kind==="ligne"?2:d.kind==="zone"?3:1;if(d.pts.length<min){banner("Il faut au moins "+min+" points.",2500);return}
 const f={id:null,kind:d.kind,name:"",desc:"",color:d.kind==="zone"?PALETTE[2]:d.kind==="point"?"#2fa85f":"#33463a",c:enc(d.pts),ha:d.kind==="zone"?+areaHa(d.pts).toFixed(1):0,pot:0};
 stopDraw();openFeat(f)}
function stopDraw(){drawing=null;gTmp.clearLayers();map.getContainer().style.cursor="";banner("");hideDbar()}
function openFeat(f){const kindL={ligne:"Ligne",zone:"Zone",point:"Installation",station:"Bâtiment"}[f.kind];let ico=f.kind==="point"?(f.id?icoOf(f):(f.ico||"")):"";const c=dec(f.c);
 openSheet(head((f.id?"Modifier · ":"Nouveau · ")+kindL)+`
 <label class="f" for="fName">Nom</label><input type="text" id="fName" value="${esc(f.name)}" placeholder="${f.kind==="ligne"?"Ex. 13":f.kind==="point"?"Ex. Station Nord":"Ex. Zone 4"}">
 ${f.kind==="point"?`<label class="f">Type d'installation</label><div class="icogrid">${Object.entries(ICONS).map(([k,v])=>`<button class="icob" data-ico="${k}" aria-pressed="${k===ico}">${icoHtml(k,30)}<span>${v.l}</span></button>`).join("")}</div>
 <label class="f">Position</label><div class="row" style="align-items:center"><span class="small" id="fPos">${c[0][1].toFixed(6)}, ${c[0][0].toFixed(6)}</span><button class="btn" id="fGps">📍 Ma position GPS</button></div>`:""}
 ${f.kind==="zone"?`<div class="row" style="flex-wrap:nowrap"><div style="flex:1"><label class="f" for="fHa">Superficie (ha)</label><input type="number" step="0.1" id="fHa" value="${f.ha||""}"></div><div style="flex:1"><label class="f" for="fPot">Potentiel (entailles)</label><input type="number" id="fPot" value="${f.pot||""}"></div></div><div class="small">Superficie calculée du tracé : ${areaHa(c).toFixed(1)} ha</div>`:""}
 ${f.kind==="zone"||f.kind==="station"?`<label class="f">Couleur</label><div class="types">${PALETTE.map(p=>`<button class="chip" data-col="${p}" aria-pressed="${p===f.color}" style="width:46px;background:${p};border:3px solid ${p===f.color?"var(--ink)":p}" aria-label="Couleur ${p}"></button>`).join("")}</div>`:f.kind!=="ligne"?"":`<div class="small" style="margin-top:8px">${fmtM(c.reduce((a,p,i)=>i?a+hav(c[i-1],p):0,0))} · ${c.length} points</div>`}
 <label class="f" for="fDesc">Description</label><textarea id="fDesc">${esc(f.desc||"")}</textarea>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="fSave" style="flex:1">Enregistrer</button>${f.id?`<button class="btn" id="fShape">Modifier le tracé</button><button class="btn red" id="fDel">Supprimer</button>`:""}</div><div id="fConf"></div><div class="err" id="fErr"></div>`);
 let col=f.color;
 sheet.querySelectorAll("[data-ico]").forEach(b=>b.onclick=()=>{const prev=ico;ico=b.dataset.ico;col=ICONS[ico].c;const nm=$("#fName");if(!nm.value.trim()||(prev&&nm.value.trim()===ICONS[prev].l))nm.value=ICONS[ico].l;sheet.querySelectorAll("[data-ico]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 const fg=$("#fGps");if(fg)fg.onclick=async()=>{fg.disabled=true;$("#fPos").textContent="Recherche du GPS…";try{const p=await waitFix();f.c=enc([[p.lng,p.lat]]);$("#fPos").textContent=p.lat.toFixed(6)+", "+p.lng.toFixed(6)+" (± "+Math.round(p.acc)+" m)"}catch(e){$("#fPos").textContent="GPS non disponible."}fg.disabled=false};
 sheet.querySelectorAll("[data-col]").forEach(b=>b.onclick=()=>{col=b.dataset.col;sheet.querySelectorAll("[data-col]").forEach(x=>{x.setAttribute("aria-pressed",x===b);x.style.borderColor=x===b?"var(--ink)":x.dataset.col})});
 $("#fSave").onclick=async()=>{const b=$("#fSave");b.disabled=true;
  try{await seedBase();const v={sect:f.sect||curSect,kind:f.kind,name:$("#fName").value.trim()||(f.kind==="ligne"?"Sans nom":kindL),desc:$("#fDesc").value.trim(),color:col,c:f.c,ha:f.kind==="zone"?+($("#fHa").value||areaHa(c).toFixed(1)):0,pot:f.kind==="zone"?+($("#fPot").value||0):0,ord:f.ord??Date.now(),...(f.kind==="point"?{ico:ico||"repere"}:{})};if(f.kind==="point")v.color=ICONS[v.ico].c;
   await store.set("couche",f.id||nid("n"),v);logAct("carte",(f.id?"Modifié : ":"Ajouté : ")+kindL.toLowerCase()+" « "+v.name+" »");closeSheet()}catch(e){b.disabled=false;$("#fErr").textContent="Enregistrement impossible."}};
 const sh=$("#fShape");if(sh)sh.onclick=()=>{closeSheet();editShape(f)};
 const del=$("#fDel");if(del)del.onclick=()=>{$("#fConf").innerHTML=`<div class="row" style="margin-top:10px"><span>Supprimer « ${esc(f.name)} » de la carte ?</span><button class="btn red" id="fDel2">Oui, supprimer</button></div>`;
  $("#fDel2").onclick=async()=>{await seedBase();await store.del("couche",f.id);logAct("carte","Supprimé de la carte : "+kindL.toLowerCase()+" « "+f.name+" »");closeSheet()}};
}
function editShape(f){const c=ll(dec(f.c));let tmp;
 if(f.kind==="point"){tmp=L.marker(c[0],{draggable:true,icon:L.divIcon({className:"",html:'<div style="width:26px;height:26px;border-radius:50%;background:#ff3b22;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(gTmp);map.setView(c[0],Math.max(map.getZoom(),18))}
 else{tmp=(f.kind==="ligne"?L.polyline(c,{color:"#ff3b22",weight:4,pmIgnore:false}):L.polygon(c,{color:"#ff3b22",weight:3,fillOpacity:.15,pmIgnore:false})).addTo(map);tmp.pm.enable({allowSelfIntersection:true,snappable:false,removeVertexOn:"click"});map.fitBounds(tmp.getBounds(),{padding:[60,60],maxZoom:19})}
 shapeEdit={f,tmp};$("#bAdd").style.display="none";
 banner(f.kind==="point"?"Glissez le point à sa nouvelle place":"Glissez les sommets; touchez un point milieu pour en ajouter, un sommet pour le retirer",6000);
 showDbar(`<button class="btn pri" id="sOk">Enregistrer le tracé</button><button class="btn" id="sCancel">Annuler</button>`);
 $("#sCancel").onclick=stopShape;
 $("#sOk").onclick=async()=>{let p;if(f.kind==="point"){const q=tmp.getLatLng();p=[[q.lng,q.lat]]}else{let a=tmp.getLatLngs();if(f.kind==="zone")a=a[0];p=a.map(q=>[q.lng,q.lat])}
  await seedBase();const upd={c:enc(p)};if(f.kind==="zone")upd.ha=+areaHa(p).toFixed(1);await store.upd("couche",f.id,upd);logAct("carte","Tracé modifié : « "+f.name+" »");stopShape()}}
function stopShape(){if(shapeEdit){try{shapeEdit.tmp.pm&&shapeEdit.tmp.pm.disable()}catch(e){}shapeEdit.tmp.remove();shapeEdit=null}gTmp.clearLayers();banner("");hideDbar();$("#bAdd").style.display=editMode?"none":""}

// ---------- nouveau signalement
let draft=null;
function setPick(latlng){pickMode=false;banner("");map.getContainer().style.cursor="";draft.lat=latlng.lat;draft.lng=latlng.lng;draft.src="carte";showDraft()}
function openAdd(pos,lineId){draft={type:"bris",note:"",files:[],lat:pos?.lat??null,lng:pos?.lng??null,src:pos?.src||"",line:lineId||null};
 if(draft.lat==null&&fix&&Date.now()-fix.t<60000&&fix.acc<100)Object.assign(draft,{lat:fix.lat,lng:fix.lng,src:"GPS ±"+Math.round(fix.acc)+" m"});showDraft()}
$("#bAdd").onclick=()=>openAdd(null);
function showDraft(){const d=draft;if(d.lat!=null&&!d.lineManual){const nl=nearestLine(d.lat,d.lng);if(nl.line&&nl.d<60)d.line=nl.line.id}
 openSheet(`<div class="row" style="justify-content:space-between"><div class="h2" style="margin:0">Nouveau signalement</div><button class="btn" data-close>Annuler</button></div>
 <label class="f">Bris ou problème</label><div class="types">${Object.entries(TYPES).filter(([k,t])=>!t.w).map(([k,t])=>`<button class="chip" data-ty="${k}" aria-pressed="${d.type===k}">${t.l}</button>`).join("")}</div>
 <label class="f">Travaux</label><div class="types">${Object.entries(TYPES).filter(([k,t])=>t.w).map(([k,t])=>`<button class="chip" data-ty="${k}" aria-pressed="${d.type===k}">${t.l}</button>`).join("")}</div>
 ${TYPES[d.type]&&TYPES[d.type].w?`<label class="f">Avancement</label><div class="types">${Object.entries(WSTAT).map(([k,v])=>`<button class="chip" data-ws="${k}" aria-pressed="${(d.wstat||"en_cours")===k}">${v.l}</button>`).join("")}</div>`:""}
 <label class="f">Position</label><div class="pos">${d.lat!=null?`${d.lat.toFixed(6)}, ${d.lng.toFixed(6)} <span class="meta">· ${esc(d.src)}</span>`:`<span class="meta">Aucune position</span>`}</div>
 <div class="row" style="margin-top:8px"><button class="btn pri" id="dGps">Ma position GPS</button><button class="btn" id="dMap">Toucher la carte</button><button class="btn" id="dMan">Coordonnées</button></div>
 <div id="manBox" style="display:none" class="row"><input type="text" id="dLL" inputmode="decimal" placeholder="46.2657, -74.2446" style="flex:1;margin-top:8px"><button class="btn" id="dLLok" style="margin-top:8px">OK</button></div>
 <div class="err" id="perr"></div>
 <label class="f">Photos</label><label class="btn">Prendre ou ajouter des photos<input type="file" id="dPh" accept="image/*" multiple></label><div class="photos">${d.files.map(p=>`<img alt="" src="${p}">`).join("")}</div>
 <label class="f" for="dLine">Ligne</label><select id="dLine"><option value="">Aucune</option>${lines.map(l=>`<option value="${l.id}" ${d.line===l.id?"selected":""}>${esc(l.label)}</option>`).join("")}</select>
 <label class="f" for="dNote">${TYPES[d.type]&&TYPES[d.type].w?"Où on est rendu / note":"Note"}</label><textarea id="dNote" placeholder="${TYPES[d.type]&&TYPES[d.type].w?"Ex. sellettes posées jusqu'à la ligne 7, reste le haut de la zone 2":"Ex. tubulure 5/16 coupée par un chevreuil, 3 m du raccord"}">${esc(d.note)}</textarea>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="dSave" style="flex:1">Enregistrer</button></div><div class="err" id="serr"></div>`);
 const keep=()=>{d.note=$("#dNote").value;d.line=$("#dLine").value||null};
 sheet.querySelectorAll("[data-ty]").forEach(b=>b.onclick=()=>{keep();d.type=b.dataset.ty;showDraft()});
 sheet.querySelectorAll("[data-ws]").forEach(b=>b.onclick=()=>{keep();d.wstat=b.dataset.ws;showDraft()});
 $("#dLine").onchange=()=>{d.lineManual=true};
 $("#dMap").onclick=()=>{keep();pickMode=true;scrim.classList.remove("on");map.getContainer().style.cursor="crosshair";banner("Touchez la carte à l'endroit du signalement")};
 $("#dGps").onclick=async()=>{keep();$("#perr").textContent="Recherche du GPS…";try{const p=await waitFix();Object.assign(d,{lat:p.lat,lng:p.lng,src:"GPS ±"+Math.round(p.acc)+" m",lineManual:false});showDraft()}catch(e){$("#perr").textContent=fix===null&&watchId===null?gpsErr({code:1}):"Pas de signal GPS. Touchez la carte pour placer le point."}};
 $("#dMan").onclick=()=>{$("#manBox").style.display="flex"};
 $("#dLLok").onclick=()=>{keep();const m=$("#dLL").value.replace(/[^\d.,\-\s]/g,"").split(/[,\s]+/).filter(Boolean).map(Number);let [a,b]=m;if(m.length===2&&isFinite(a)&&isFinite(b)){if(b>0&&a<0)[a,b]=[b,a];if(b>0)b=-b;Object.assign(d,{lat:a,lng:b,src:"saisie"});showDraft()}else $("#perr").textContent="Format attendu : 46.2657, -74.2446"};
 $("#dPh").onchange=async e=>{keep();const fs=[...e.target.files];$("#perr").textContent="Préparation des photos…";let got=null;
  for(const f of fs){try{const g=exifGPS(await f.slice(0,262144).arrayBuffer());if(g&&!got)got=g;d.files.push(await shrink(f))}catch(err){}}
  if(got&&d.lat==null)Object.assign(d,{lat:got.lat,lng:got.lng,src:"position de la photo"});showDraft()};
 $("#dSave").onclick=async()=>{keep();if(d.lat==null){$("#serr").textContent="Ajoutez une position (GPS, carte ou coordonnées).";return}
  const btn=$("#dSave");btn.disabled=true;btn.textContent="Enregistrement…";
  try{const id=nid("o"),ids=await savePhotos(d.files,id);
   const w=isWork({type:d.type}),ws=d.wstat||"en_cours";const rec={sect:curSect,type:d.type,note:d.note.trim(),lat:+d.lat.toFixed(7),lng:+d.lng.toFixed(7),line:d.line||null,status:w?ws:"ouvert",...(w?{suivi:[{at:new Date().toISOString(),by:me.uid,byName:me.nom,status:ws,note:d.note.trim(),lat:+d.lat.toFixed(7),lng:+d.lng.toFixed(7)}]}:{}),at:new Date().toISOString(),season:CUR,by:me.uid,byName:me.nom,photos:ids};
   await store.set("obs",id,rec);logAct(isWork(rec)?"travail":"signalement",actText(rec),{obs:id});
   if(viewSeason!==CUR){viewSeason=CUR;renderAll()}closeSheet();if(!navigator.onLine)banner("Hors ligne : enregistré sur le téléphone, envoi automatique au retour du réseau.",5000)}
  catch(e){btn.disabled=false;btn.textContent="Enregistrer";$("#serr").textContent="Enregistrement impossible : "+(e.message||e)}};
}

// ---------- connexion

// ---------- tableau de bord carte plein écran (toutes les érablières)
let dMap=null,dG={},dBase=null,dSel=null,dSect=ls.get("erab_dsect","*"),dPanel=ls.get("erab_dpanel","alertes"),dLay=ls.get("erab_dlay",{zones:1,lignes:1,obs:1,travaux:1,capteurs:1,pts:1}),dBaseK=ls.get("erab_dbase","sat"),dFlyNext=true;
const DBASES={sat:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}","Imagerie © Esri"],topo:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}","Topo © Esri"],plan:["https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png","© OpenStreetMap"]};
const DFULL=`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`;
const dIn=x=>dSect==="*"||sectOf(x)===dSect;
const dOpen=()=>obsAll.filter(o=>!isDone(o)&&o.lat!=null&&sOf(o)<=CUR);
const vSort=(a,b)=>(vSt(a).o-vSt(b).o)||(a.val-b.val);
const byPrio=(a,b)=>(PRIOS[prOf(a)].o-PRIOS[prOf(b)].o)||String(b.at).localeCompare(String(a.at));
const dNf=n=>(+n||0).toLocaleString("fr-CA",{maximumFractionDigits:0});
const dTl=iso=>{try{return new Date(iso).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}catch(e){return ""}};
const dToast=t=>banner(t,3000);
const dTyping=()=>{const a=document.activeElement,r=$("#dr");return !!(a&&r&&r.contains(a)&&/TEXTAREA|INPUT/.test(a.tagName))};
const dCenter=()=>{const all=allLayer.flatMap(f=>dec(f.c));if(!all.length)return [46.27,-74.24];return [all.reduce((a,p)=>a+p[1],0)/all.length,all.reduce((a,p)=>a+p[0],0)/all.length]};
function dPos(v){if(v.lat!=null&&v.lng!=null)return [v.lat,v.lng];const fs=allLayer.filter(f=>sectOf(f)===sectOf(v));
 if(v.emplacement){const f=fs.find(x=>x.kind==="point"&&String(x.name).toLowerCase()===String(v.emplacement).toLowerCase());if(f){const c=dec(f.c)[0];return [c[1],c[0]]}}
 if(v.ligne){const n=String(v.ligne).toLowerCase(),f=fs.find(x=>x.kind==="ligne"&&(String(x.name).toLowerCase()===n||("ligne "+String(x.name).toLowerCase())===n));if(f){const c=dec(f.c);return [c[c.length-1][1],c[c.length-1][0]]}}return null}
function dashOpen(){if(dMap)return;let o=$("#dash");if(!o){o=document.createElement("div");o.id="dash";document.body.appendChild(o)}o.classList.add("on");menu(false);dFlyNext=true;dashBuild();
 try{const e=document.documentElement;if(!document.fullscreenElement&&e.requestFullscreen&&matchMedia("(min-width:900px)").matches)e.requestFullscreen().catch(()=>{})}catch(e){}}
function dashClose(){try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}if(dMap){dMap.remove();dMap=null}const o=$("#dash");if(o){o.classList.remove("on");o.innerHTML=""}dSel=null;setTimeout(()=>map.invalidateSize(),100)}
const dRefresh=()=>{if(dMap)dashUpdate()};
addEventListener("keydown",e=>{if(e.key==="Escape"&&dMap&&!document.fullscreenElement)dashClose()});
function dashBuild(){const v=$("#dash");
 v.innerHTML=`<div class="dw"><aside class="dl" id="dl"></aside><div class="dc"><div id="dmap"></div><div class="dstats" id="dstats"></div>
  <div class="dtools"><button class="dbtn" id="dFull" title="Plein écran">${DFULL}</button><button class="dbtn" id="dFit" title="Recadrer">⤢</button></div></div><aside class="dr" id="dr"></aside></div>`;
 dMap=L.map("dmap",{zoomControl:true,attributionControl:true,preferCanvas:false});dSetBase();
 dG={zones:L.layerGroup().addTo(dMap),lignes:L.layerGroup().addTo(dMap),pts:L.layerGroup().addTo(dMap),obs:L.layerGroup().addTo(dMap),travaux:L.layerGroup().addTo(dMap),capteurs:L.layerGroup().addTo(dMap)};
 $("#dFull").onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(e){}};
 $("#dFit").onclick=()=>{dFlyNext=true;dFit()};
 dMap.on("click",()=>{if(dSel){dSel=null;dRight()}});
 dFit();dashUpdate();setTimeout(()=>dMap.invalidateSize(),200)}
function dSetBase(){if(dBase)dMap.removeLayer(dBase);const b=DBASES[dBaseK]||DBASES.sat;dBase=L.tileLayer(b[0],{maxZoom:20,maxNativeZoom:19,attribution:b[1]}).addTo(dMap)}
function dFit(){const pts=(dSect==="*"?allLayer:allLayer.filter(f=>sectOf(f)===dSect)).flatMap(f=>dec(f.c).map(p=>[p[1],p[0]]));if(!pts.length){dMap.setView(dCenter(),14);return}
 const b=L.latLngBounds(pts);dFlyNext&&dMap._loaded?dMap.flyToBounds(b,{padding:[30,30],duration:1}):dMap.fitBounds(b,{padding:[30,30]});dFlyNext=false}
function dashUpdate(){if(!dMap)return;Object.values(dG).forEach(g=>g.clearLayers());const L=L,lab=dMap.getZoom()>=15;
 allLayer.forEach(f=>{const c=dec(f.c).map(p=>[p[1],p[0]]),dim=dSect!=="*"&&sectOf(f)!==dSect;if(!c.length)return;
  if(f.kind==="zone"&&dLay.zones)L.polygon(c,{color:f.color||"#3468eb",weight:2,fillOpacity:dim?.03:.12,opacity:dim?.4:1}).bindTooltip(esc(f.name||""),{sticky:true}).addTo(dG.zones);
  else if(f.kind==="ligne"&&dLay.lignes){const st=lst(f.id).status||"ok",n=dOpen().filter(o=>o.line===f.id).length;
   L.polyline(c,{color:"#000",weight:7,opacity:dim?.15:.4,interactive:false}).addTo(dG.lignes);
   L.polyline(c,{color:LSTAT[st].h,weight:st==="ok"?3:5,opacity:dim?.4:1,dashArray:st==="verif"?"8 6":null}).bindTooltip(`${esc(f.name||"Ligne")} · ${LSTAT[st].l}${n?" · "+n+" signalement(s)":""}`,{sticky:true}).on("click",e=>{L.DomEvent.stop(e);dSel={k:"ligne",id:f.id};dPanel="detail";dRight()}).addTo(dG.lignes)}
  else if(f.kind==="point"&&dLay.pts)L.circleMarker(c[0],{radius:6,color:"#fff",weight:2,fillColor:f.color||"#2fa85f",fillOpacity:1}).bindTooltip(esc(f.name||""),{permanent:lab&&!dim,direction:"right",className:"lbl"}).addTo(dG.pts)});
 dOpen().forEach(o=>{const t=TYPES[o.type]||TYPES.autre,w=!!t.w;if(w?!dLay.travaux:!dLay.obs)return;const pr=prOf(o);
  if(pr==="urgent")L.circleMarker([o.lat,o.lng],{radius:17,color:"#d01f1f",weight:3,fill:false,interactive:false,className:"pulse"}).addTo(dG.obs);
  const m=w?L.marker([o.lat,o.lng],{icon:L.divIcon({className:"",iconSize:[22,22],iconAnchor:[11,11],html:`<div style="width:16px;height:16px;margin:3px;transform:rotate(45deg);background:${t.c};border:3px solid #fff;box-shadow:0 1px 4px #0008"></div>`})})
   :L.circleMarker([o.lat,o.lng],{radius:pr==="urgent"||pr==="haute"?11:9,color:"#fff",weight:3,fillColor:t.c,fillOpacity:1});
  m.bindTooltip(`${esc(t.l)}${asgOf(o).length?" → "+esc(asgOf(o).map(a=>a.nom).join(", ")):""}`,{direction:"top"}).on("click",e=>{L.DomEvent.stop(e);dSel={k:"obs",id:o.id};dPanel="detail";dRight()}).addTo(w?dG.travaux:dG.obs)});
 if(dLay.capteurs){const pile={};vac.forEach(v=>{const p=dPos(v);if(!p)return;const k=p[0].toFixed(5)+p[1].toFixed(5),i=pile[k]=(pile[k]??-1)+1,st=vSt(v);
  L.marker(p,{icon:L.divIcon({className:"",iconSize:[80,24],iconAnchor:[40,12-i*27],html:`<div class="vpill${v.etat==="alarme"?" valarm":""}" style="--c:${st.c}">${(VTYP[v.type]||VTYP.vide).i} ${vFmt(v)}</div>`}),zIndexOffset:400}).bindTooltip(esc(v.nom)+" · "+st.l,{direction:"top"}).on("click",e=>{L.DomEvent.stop(e);dSel={k:"capteur",id:v.id};dPanel="detail";dRight()}).addTo(dG.capteurs)})}
 if(dFlyNext)dFit();dLeft();if(!dTyping())dRight();dStats()}
function dStats(){const oo=dOpen().filter(dIn),br=allLayer.filter(f=>f.kind==="ligne"&&dIn(f)&&["bris","rep"].includes(lst(f.id).status)).length,ca=vac.filter(v=>dIn(v)&&["alarme","bas"].includes(v.etat)).length,now=heures.filter(h=>h.open&&dIn(h)).length;
 $("#dstats").innerHTML=`<span><b style="color:#ff6b5a">${oo.filter(o=>!TYPES[o.type]?.w).length}</b> signalements</span><span><b style="color:#ffc21a">${br}</b> lignes en bris</span><span><b style="color:#ff6b5a">${ca}</b> capteurs en alerte</span><span><b style="color:#7be0a0">${now}</b> au travail</span><span class="meta" style="color:#cfe">${new Date().toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}</span>`}
function dLeft(){const n=id=>dOpen().filter(o=>!TYPES[o.type]?.w&&(id==="*"||sectOf(o)===id)).length;
 $("#dl").innerHTML=`<div class="row" style="margin-bottom:12px"><div class="logo" style="width:36px;height:36px;display:grid;place-items:center"><svg width="30" height="30"><use href="#leaf"/></svg></div><b style="font:700 20px 'Barlow Condensed';flex:1">Tableau de bord</b><button class="btn dsm" id="dBack" title="Quitter">✕</button></div>
 <div class="dh">Érablières</div>${[["*","Toutes"],...sectors.map(x=>[x.id,x.nom])].map(([k,l])=>`<button class="dsec" data-ds="${esc(k)}" aria-pressed="${dSect===k}"><span>${esc(l)}</span>${n(k)?`<b>${n(k)}</b>`:""}</button>`).join("")}
 <div class="dh">Couches</div>${[["zones","Zones"],["lignes","Maîtres-lignes"],["pts","Installations"],["obs","Signalements"],["travaux","Travaux"],["capteurs","Capteurs"]].map(([k,l])=>`<label class="dchk"><input type="checkbox" data-dl="${k}" ${dLay[k]?"checked":""}> ${l}</label>`).join("")}
 <div class="dh">Fond de carte</div><div class="row" style="gap:4px">${[["sat","Satellite"],["topo","Topo"],["plan","Plan"]].map(([k,l])=>`<button class="chip" data-db="${k}" aria-pressed="${dBaseK===k}">${l}</button>`).join("")}</div>
 <div class="dh">Légende</div><div class="dleg">${Object.values(LSTAT).map(x=>`<div><i style="background:${x.h};outline:1px solid #0006"></i>Ligne ${x.l.toLowerCase()}</div>`).join("")}${Object.entries(TYPES).filter(([k,t])=>!t.w).map(([k,t])=>`<div><i style="background:${t.c};border-radius:50%;width:10px;height:10px"></i>${t.l}</div>`).join("")}<div><i style="border:3px solid #d01f1f;border-radius:50%;width:12px;height:12px;background:none"></i>Urgent</div><div><i style="background:#00b3a4;transform:rotate(45deg);width:10px;height:10px"></i>Travaux</div></div>`;
 $("#dBack").onclick=dashClose;
 $("#dl").querySelectorAll("[data-ds]").forEach(b=>b.onclick=()=>{dSect=b.dataset.ds;ls.set("erab_dsect",dSect);dFlyNext=true;dashUpdate()});
 $("#dl").querySelectorAll("[data-dl]").forEach(c=>c.onchange=()=>{dLay[c.dataset.dl]=c.checked?1:0;ls.set("erab_dlay",dLay);dashUpdate()});
 $("#dl").querySelectorAll("[data-db]").forEach(b=>b.onclick=()=>{dBaseK=b.dataset.db;ls.set("erab_dbase",dBaseK);dSetBase();dLeft()})}
function dGo(ll,z=17){dMap.flyTo(ll,Math.max(dMap.getZoom(),z),{duration:.8})}
function dRight(){const r=$("#dr");if(!r)return;const tabs=[["alertes","Alertes"],["obs","Signalements"],["capteurs","Capteurs"],["equipe","Équipe"]];
 const P=dPanel==="detail"&&dSel?dDetail():({alertes:dAlertes,obs:dObsList,capteurs:dCaptList,equipe:dEquipe}[dPanel]||dAlertes)();
 r.innerHTML=`<div class="dseg" style="margin-bottom:10px">${tabs.map(([k,l])=>`<button data-dp="${k}" aria-pressed="${dPanel===k}">${l}</button>`).join("")}</div><div id="drb">${P}</div>`;
 r.querySelectorAll("[data-dp]").forEach(b=>b.onclick=()=>{dPanel=b.dataset.dp;ls.set("erab_dpanel",dPanel);dSel=null;dRight()});
 r.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{const [k,id]=b.dataset.go.split("|");dSel={k,id};const o=k==="obs"?obsAll.find(x=>x.id===id):k==="capteur"?vac.find(x=>x.id===id):null;
  if(k==="obs"&&o)dGo([o.lat,o.lng]);else if(k==="capteur"&&o){const p=dPos(o);if(p)dGo(p)}else if(k==="ligne"){const f=allLayer.find(x=>x.id===id);if(f)dMap.flyToBounds(dec(f.c).map(p=>[p[1],p[0]]),{padding:[60,60],duration:.8})}
  dPanel="detail";dRight()});
 dBindDetail()}
const dItem=(go,col,title,sub,right="")=>`<div class="ditem" data-go="${go}"><i style="background:${col}"></i><div style="flex:1;min-width:0"><b>${title}</b><div class="meta">${sub}</div></div>${right}</div>`;
function dAlertes(){const oo=dOpen().filter(dIn).filter(o=>!TYPES[o.type]?.w&&["urgent","haute"].includes(prOf(o))).sort(byPrio),ca=vac.filter(v=>dIn(v)&&["alarme","bas"].includes(v.etat)).sort(vSort),
 lb=allLayer.filter(f=>f.kind==="ligne"&&dIn(f)&&["bris","rep","verif"].includes(lst(f.id).status)),old=dOpen().filter(dIn).filter(o=>!TYPES[o.type]?.w&&!asgOf(o).length&&Date.now()-new Date(o.at)>86400000);
 const sec=(t,a)=>a.length?`<div class="dh">${t} · ${a.length}</div>${a.join("")}`:"";
 const html=sec("Signalements urgents",oo.map(o=>dItem("obs|"+o.id,PRIOS[prOf(o)].c,esc((TYPES[o.type]||TYPES.autre).l),`${PRIOS[prOf(o)].l} · ${esc(sectName(sectOf(o)))} · ${ago(o.at)}${asgOf(o).length?" · → "+esc(asgOf(o).map(a=>a.nom).join(", ")):""}`)))
  +sec("Capteurs",ca.map(v=>dItem("capteur|"+v.id,vSt(v).c,esc(v.nom),`${vSt(v).l} · ${esc(v.ligne||v.emplacement||sectName(sectOf(v)))}`,`<b>${vFmt(v)}</b>`)))
  +sec("Maîtres-lignes",lb.map(f=>dItem("ligne|"+f.id,LSTAT[lst(f.id).status].h,esc(f.name||"Ligne"),`${LSTAT[lst(f.id).status].l} · ${esc(sectName(sectOf(f)))}`)))
  +sec("Non assignés depuis plus de 24 h",old.map(o=>dItem("obs|"+o.id,(TYPES[o.type]||TYPES.autre).c,esc((TYPES[o.type]||TYPES.autre).l),`${esc(sectName(sectOf(o)))} · ${ago(o.at)}`)));
 return html||`<div class="empty">Aucune alerte. Tout est sous contrôle.</div>`}
function dObsList(){const oo=dOpen().filter(dIn).sort(byPrio);return oo.length?oo.map(o=>{const t=TYPES[o.type]||TYPES.autre;return dItem("obs|"+o.id,t.c,esc(t.l)+(prOf(o)!=="normale"?` <span class="dbadge" style="--c:${PRIOS[prOf(o)].c}">${PRIOS[prOf(o)].l}</span>`:""),`${esc(sectName(sectOf(o)))} · ${ago(o.at)}${asgOf(o).length?" · → "+esc(asgOf(o).map(a=>a.nom).join(", ")):""}${o.note?" · "+esc(String(o.note).slice(0,50)):""}`)}).join(""):`<div class="empty">Aucun signalement ouvert.</div>`}
function dCaptList(){const vs=vac.filter(dIn).sort(vSort);return vs.length?vs.map(v=>dItem("capteur|"+v.id,vSt(v).c,esc(v.nom),`${(VTYP[v.type]||VTYP.vide).l} · ${vSt(v).l} · ${ago(v.at)}`,`<b>${vFmt(v)}</b>`)).join(""):`<div class="empty">Aucun capteur.</div>`}
function dEquipe(){const now=heures.filter(h=>h.open&&dIn(h)),as={};dOpen().forEach(o=>asgOf(o).forEach(a=>{(as[a.nom]=as[a.nom]||[]).push(o)}));
 return `<div class="dh">Au travail · ${now.length}</div>${now.map(h=>`<div class="ditem"><i style="background:${"#2fa85f"}"></i><div style="flex:1"><b>${esc(h.byName)}</b><div class="meta">${esc((h.task||h.cat||"Travail"))} · ${esc(sectName(sectOf(h)))} · depuis ${dTl(h.start)}</div></div></div>`).join("")||`<div class="small">Personne de punché.</div>`}
 <div class="dh">Tâches assignées</div>${Object.keys(as).length?Object.entries(as).sort((a,b)=>b[1].length-a[1].length).map(([n,l])=>`<div class="ditem" style="cursor:default"><i style="background:#7a4fd6"></i><div style="flex:1"><b>${esc(n)}</b><div class="meta">${l.length} tâche(s) ouverte(s)${l.some(o=>prOf(o)==="urgent")?" · dont urgente":""}</div></div></div>`).join(""):`<div class="small">Aucune tâche assignée.</div>`}`}
function dDetail(){const s=dSel;
 if(s.k==="obs"){const o=obsAll.find(x=>x.id===s.id);if(!o)return `<div class="empty">Introuvable.</div>`;const t=TYPES[o.type]||TYPES.autre,ln=allLayer.find(f=>f.id===o.line),pr=prOf(o),as=asgOf(o);
  return `<button class="btn dsm" data-dp2="obs">← Liste</button><h3 style="margin:10px 0 4px;display:flex;gap:8px;align-items:center"><span class="dbadge" style="--c:${t.c};font-size:15px">${esc(t.l)}</span></h3>
  <div class="meta">${esc(sectName(sectOf(o)))}${ln?" · "+esc(ln.name):""} · ${esc(o.byName||"")} · ${ago(o.at)}</div>${o.note?`<p>${esc(o.note)}</p>`:""}
  <div class="dphotos" id="dPh">${(o.photos||[]).map(id=>`<img data-pid="${esc(id)}" alt="">`).join("")}</div>
  <div class="small"><a href="https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}" target="_blank" rel="noopener">Itinéraire Google Maps</a> · ${o.lat.toFixed(5)}, ${o.lng.toFixed(5)}</div>
  ${isEd()?`<div class="dh">Priorité</div><div class="row" style="gap:4px">${Object.entries(PRIOS).map(([k,v])=>`<button class="chip" data-dpr="${k}" aria-pressed="${k===pr}" style="${k===pr?`background:${v.c};border-color:${v.c};color:#fff`:""}">${v.l}</button>`).join("")}</div>
  <div class="dh">Assigner à</div><div class="row" style="gap:4px">${membres.map(m=>`<button class="chip" data-das="${esc(m.id)}" data-nm="${esc(m.nom||m.id.split("@")[0])}" aria-pressed="${as.some(a=>a.email===m.id)}">${esc(m.nom||m.id.split("@")[0])}</button>`).join("")||`<span class="small">—</span>`}</div>
  <div class="row" style="margin-top:8px"><button class="btn pri dsm" id="dAsSave">Enregistrer et avertir</button></div>`:(pr!=="normale"||as.length?`<p class="small">Priorité ${PRIOS[pr].l.toLowerCase()}${as.length?" · assigné à "+esc(as.map(a=>a.nom).join(", ")):""}</p>`:"")}
  <div class="dh">Réparation</div><textarea id="dRep" placeholder="Ce qui a été fait"></textarea><div class="row" style="margin-top:8px"><button class="btn pri dsm" id="dRepOk">Marquer réglé</button></div>`}
 if(s.k==="capteur"){const v=vac.find(x=>x.id===s.id);if(!v)return `<div class="empty">Introuvable.</div>`;const st=vSt(v);
  return `<button class="btn dsm" data-dp2="capteurs">← Liste</button><h3 style="margin:10px 0 2px">${esc(v.nom)}</h3><div class="meta">${(VTYP[v.type]||VTYP.vide).l} · ${esc(v.ligne||v.emplacement||"")} · ${esc(sectName(sectOf(v)))}</div>
  <div style="font:700 46px/1.1 'Barlow Condensed';margin:10px 0;color:${st.c}">${vFmt(v)}</div><span class="dbadge" style="--c:${st.c}">${st.l}</span><p class="small">Mesure ${ago(v.at)} · source ${esc(v.source||"")}${v.bat!=null?" · batterie "+esc(v.bat):""}</p>`}
 if(s.k==="ligne"){const f=allLayer.find(x=>x.id===s.id);if(!f)return `<div class="empty">Introuvable.</div>`;const st=lst(f.id).status||"ok",c=dec(f.c);let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);
  const oo=dOpen().filter(o=>o.line===f.id),vs=vac.filter(v=>String(v.ligne).toLowerCase()===String(f.name).toLowerCase()&&sectOf(v)===sectOf(f));
  return `<button class="btn dsm" data-dp2="alertes">← Retour</button><h3 style="margin:10px 0 2px">${esc(f.name||"Ligne")}</h3><div class="meta">${esc(sectName(sectOf(f)))} · ${dNf(len)} m${f.ent?" · "+dNf(f.ent)+" entailles":""}${f.dia?" · "+esc(f.dia):""}</div>
  <div class="dh">État de la ligne</div><div class="row" style="gap:4px">${Object.entries(LSTAT).map(([k,x])=>`<button class="chip" data-dls="${k}" aria-pressed="${k===st}">${x.l}</button>`).join("")}</div>
  ${vs.length?`<div class="dh">Capteurs</div>${vs.map(v=>dItem("capteur|"+v.id,vSt(v).c,esc(v.nom),vSt(v).l,`<b>${vFmt(v)}</b>`)).join("")}`:""}
  <div class="dh">Signalements ouverts · ${oo.length}</div>${oo.map(o=>dItem("obs|"+o.id,(TYPES[o.type]||TYPES.autre).c,esc((TYPES[o.type]||TYPES.autre).l),ago(o.at))).join("")||`<div class="small">Aucun.</div>`}`}
 return ""}
const dPhoto=id=>getPhoto(id);
function dBindDetail(){const r=$("#dr");if(!r||!dSel)return;
 r.querySelectorAll("[data-dp2]").forEach(b=>b.onclick=()=>{dPanel=b.dataset.dp2;dSel=null;dRight()});
 r.querySelectorAll("img[data-pid]").forEach(async im=>{const d=await dPhoto(im.dataset.pid);if(d){im.src=d;im.onclick=()=>window.open().document.write(`<img src="${d}" style="max-width:100%">`)}});
 const o=dSel.k==="obs"?obsAll.find(x=>x.id===dSel.id):null;
 if(o){let pr=prOf(o),sel=asgOf(o).map(a=>({...a}));
  r.querySelectorAll("[data-dpr]").forEach(b=>b.onclick=()=>{pr=b.dataset.dpr;r.querySelectorAll("[data-dpr]").forEach(x=>{const on=x===b,c=PRIOS[x.dataset.dpr].c;x.setAttribute("aria-pressed",on);x.style.cssText=on?`background:${c};border-color:${c};color:#fff`:""})});
  r.querySelectorAll("[data-das]").forEach(b=>b.onclick=()=>{const e=b.dataset.das,i=sel.findIndex(a=>a.email===e);if(i>=0)sel.splice(i,1);else sel.push({email:e,nom:b.dataset.nm});b.setAttribute("aria-pressed",i<0)});
  const sv=r.querySelector("#dAsSave");if(sv)sv.onclick=async()=>{const before=asgOf(o).map(a=>a.email),added=sel.filter(a=>!before.includes(a.email)),t=TYPES[o.type]||TYPES.autre;
   await store.upd("obs",o.id,{prio:pr,assign:sel,assignBy:me.nom,assignAt:new Date().toISOString()});
   if(added.length)await store.set("activite",nid("a"),{kind:"assign",text:`📌 ${added.map(a=>a.nom).join(", ")} : ${t.l} (priorité ${PRIOS[pr].l.toLowerCase()})`,sect:sectOf(o),by:me.uid,byName:me.nom,at:new Date().toISOString(),season:CUR,obs:o.id});
   if(added.length)notify(`📌 ${added.map(a=>a.nom).join(", ")} : ${t.l}`);dToast(added.length?"Assigné. L'équipe est avertie.":"Enregistré.")};
  const rp=r.querySelector("#dRepOk");if(rp)rp.onclick=async()=>{const note=r.querySelector("#dRep").value.trim(),t=TYPES[o.type]||TYPES.autre;
   await store.upd("obs",o.id,{status:"regle",doneAt:new Date().toISOString(),doneBy:me.uid,doneByName:me.nom,doneSeason:CUR,repairNote:note});
   await store.set("activite",nid("a"),{kind:"reparation",text:"Réparé : "+t.l+(note?" — « "+note.slice(0,80)+" »":""),sect:sectOf(o),by:me.uid,byName:me.nom,at:new Date().toISOString(),season:CUR,obs:o.id});
   notify("Réparé : "+t.l);dToast("Marqué réglé");dSel=null;dPanel="obs";dRight()}}
 if(dSel.k==="ligne")r.querySelectorAll("[data-dls]").forEach(b=>b.onclick=async()=>{const id=dSel.id,cur=lstate[id]||{};const {id:_,...rest}=cur;
  await store.set("lignes",id,{...rest,status:b.dataset.dls,season:CUR,at:new Date().toISOString(),by:me.uid,byName:me.nom});dToast("État de la ligne mis à jour")})}
const gate=$("#gate"),gc=$("#gatecard");
function showGate(html){gc.innerHTML=html;gate.classList.add("on")}
function hideGate(){gate.classList.remove("on")}
function loginForm(msg){showGate(`<svg width="72" height="74" aria-hidden="true" style="display:block;margin:0 auto 10px"><use href="#leaf"/></svg><h2 style="text-align:center">Érablières</h2><p class="small" style="text-align:center">Connectez-vous avec le courriel inscrit par l'administrateur.</p>
 <label class="f" for="gEmail">Courriel</label><input type="email" id="gEmail" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false">
 <label class="f" for="gPass">Mot de passe</label><input type="password" id="gPass" autocomplete="current-password" autocapitalize="none">
 <div id="gNomBox" style="display:none"><label class="f" for="gNom">Votre nom</label><input type="text" id="gNom" autocomplete="name"></div>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="gIn" style="flex:1">Se connecter</button></div>
 <div class="row" style="margin-top:8px"><button class="btn" id="gNew" style="flex:1">Créer mon compte</button><button class="btn" id="gForgot">Mot de passe oublié</button></div>
 <div class="err" id="gErr">${msg||""}</div>`);
 const em=()=>$("#gEmail").value.trim().toLowerCase(),pw=()=>$("#gPass").value,err=t=>$("#gErr").textContent=t;
 const fe=e=>({"auth/invalid-credential":"Courriel ou mot de passe incorrect.","auth/wrong-password":"Mot de passe incorrect.","auth/user-not-found":"Aucun compte avec ce courriel.","auth/email-already-in-use":"Ce courriel a déjà un compte : connectez-vous.","auth/weak-password":"Mot de passe trop court (6 caractères minimum).","auth/invalid-email":"Courriel invalide.","auth/network-request-failed":"Pas de réseau."}[e.code]||e.message);
 $("#gIn").onclick=async()=>{try{await fbAuth.signInWithEmailAndPassword(auth,em(),pw())}catch(e){err(fe(e))}};
 $("#gNew").onclick=async()=>{const box=$("#gNomBox");if(box.style.display==="none"){box.style.display="block";$("#gNew").textContent="Créer le compte";return}
  const nom=$("#gNom").value.trim();if(!nom)return err("Entrez votre nom.");
  try{const c=await fbAuth.createUserWithEmailAndPassword(auth,em(),pw());await fbAuth.updateProfile(c.user,{displayName:nom});await fbAuth.sendEmailVerification(c.user);verifyGate(c.user)}catch(e){err(fe(e))}};
 $("#gForgot").onclick=async()=>{if(!em())return err("Entrez votre courriel d'abord.");try{await fbAuth.sendPasswordResetEmail(auth,em());$("#gErr").className="ok";err("Courriel de réinitialisation envoyé.")}catch(e){err(fe(e))}}}
function verifyGate(u){showGate(`<h2>Vérifiez votre courriel</h2><p>Un lien a été envoyé à <b>${esc(u.email)}</b>. Ouvrez-le, puis revenez ici.</p>
 <div class="row" style="margin-top:12px"><button class="btn pri" id="gChk" style="flex:1">C'est fait</button><button class="btn" id="gRe">Renvoyer</button></div><div class="row" style="margin-top:8px"><button class="btn" id="gOut">Changer de compte</button></div><div class="err" id="gErr"></div>`);
 $("#gChk").onclick=async()=>{await u.reload();if(auth.currentUser.emailVerified){await u.getIdToken(true);enter(auth.currentUser)}else $("#gErr").textContent="Pas encore vérifié. Regardez aussi dans les indésirables."};
 $("#gRe").onclick=async()=>{try{await fbAuth.sendEmailVerification(u);$("#gErr").textContent="Renvoyé."}catch(e){$("#gErr").textContent=e.message}};
 $("#gOut").onclick=()=>fbAuth.signOut(auth)}
let entered=false;
async function enter(u){if(entered)return;const email=u.email.toLowerCase();me={uid:u.uid,email,nom:u.displayName||email.split("@")[0]};
 let m=null;try{m=await store.get("membres",email)}catch(e){if(e.code==="unavailable"){m=ls.get("erab_member",null)}}
 if(!m){try{await store.hardSet("membres",email,{role:"admin",nom:me.nom,at:new Date().toISOString()});m={role:"admin"}}catch(e){}}
 if(!m){showGate(`<h2>Accès en attente</h2><p>Votre compte <b>${esc(email)}</b> n'est pas encore dans l'équipe. Demandez à l'administrateur de vous ajouter (Menu › Réglages › Équipe), puis touchez Réessayer.</p><div class="row"><button class="btn pri" id="gRetry">Réessayer</button><button class="btn" id="gOut">Changer de compte</button></div>`);
  $("#gRetry").onclick=()=>enter(u);$("#gOut").onclick=()=>fbAuth.signOut(auth);return}
 ls.set("erab_member",m);role=m.role==="admin"?"admin":"membre";if(m.nom)me.nom=m.nom;entered=true;hideGate();startData()}
async function boot(){
 const C=window.FIREBASE_CONFIG;
 if(!C){store=Local;me={uid:"local",email:"",nom:"Moi"};role="admin";startData();if(!ls.get("erab_trial_seen",false)){banner("Mode essai : données gardées sur cet appareil seulement",5000);ls.set("erab_trial_seen",true)}return}
 setSync("warn","Connexion…");
 try{const [A,Au,F]=await Promise.all([import(GS+"firebase-app.js"),import(GS+"firebase-auth.js"),import(GS+"firebase-firestore.js")]);
  const app=A.initializeApp(C);
  auth=Au.initializeAuth(app,{persistence:[Au.indexedDBLocalPersistence,Au.browserLocalPersistence]});fbAuth=Au;
  const db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});
  store=Fire(db,F);
  Au.onAuthStateChanged(auth,u=>{if(!u){entered=false;loginForm();return}if(!u.emailVerified){verifyGate(u);return}enter(u)})}
 catch(e){console.error(e);showGate(`<h2>Connexion impossible</h2><p>Le service de données n'a pas pu démarrer (${esc(e.message)}). Vérifiez le réseau et rechargez.</p><button class="btn pri" onclick="location.reload()">Recharger</button>`)}}
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{});
new ResizeObserver(()=>map.invalidateSize()).observe($("#map"));
drawBase();render();boot();
