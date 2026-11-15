// Érablière Montagne Noire — app de terrain (PWA)
const BASE = window.BASE;
const FBV = "10.14.1", GS = `https://www.gstatic.com/firebasejs/${FBV}/`;
const TYPES = {
 bris:{l:"Bris de tubulure",c:"#e5432b"}, fuite:{l:"Fuite / vacuum",c:"#f08a00"},
 arbre:{l:"Arbre tombé",c:"#a0662a"}, ponceau:{l:"Ponceau / drainage",c:"#2f7bf0"},
 entaille:{l:"Entaille / chalumeau",c:"#a256d6"}, repere:{l:"Repère / point GPS",c:"#2fa85f"},
 autre:{l:"Autre",c:"#7d8a82"}};
const LSTAT = {ok:{l:"OK",h:"#ffffff"},verif:{l:"À vérifier",h:"#ffc21a"},bris:{l:"Bris",h:"#ff3b22"},rep:{l:"En réparation",h:"#3d8bff"}};
const PALETTE = ["#d6782a","#e58739","#3468eb","#00a1ed","#2fa85f","#a256d6","#e5432b","#7d8a82"];
const ACT = {signalement:{c:"#e5432b",l:"Signalement"},reparation:{c:"#2fa85f",l:"Réparation"},reouvert:{c:"#f08a00",l:"Rouvert"},ligne:{c:"#3d8bff",l:"Ligne"},carte:{c:"#a256d6",l:"Carte"},suppression:{c:"#7d8a82",l:"Suppression"}};
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
  set:(c,id,v)=>soft(F.setDoc(F.doc(db,c,id),v)),
  upd:(c,id,v)=>soft(F.updateDoc(F.doc(db,c,id),v)),
  del:(c,id)=>soft(F.deleteDoc(F.doc(db,c,id))),
  hardSet:(c,id,v)=>F.setDoc(F.doc(db,c,id),v)}}

// ---------- état
let obs=[], lstate={}, acts=[], membres=[], cfg={}, pending=false;
let tab="journal", fStat="ouvert", fType="", editMode=false, drawing=null, shapeEdit=null, actsReady=false, pickMode=false;
let lastSeen=ls.get("erab_seen","");
const isEd=()=>role==="admin";
const lst = id=>{const s=lstate[id];return s&&(s.season??seasonOf(s.at))===viewSeason?s:{}};
const visObs=()=>obs.filter(o=>{const s=sOf(o);return s===viewSeason||(viewSeason===CUR&&s<CUR&&o.status!=="regle")});

// ---------- carte
if(L.PM)L.PM.setOptIn(true);
const map = L.map("map",{pmIgnore:false,zoomControl:true,attributionControl:true,maxZoom:21,minZoom:8,zoomSnap:.5});
map.attributionControl.setPrefix(false);
map.zoomControl.setPosition("topright");
L.control.scale({imperial:false,position:"bottomleft"}).addTo(map);
let baseKey=ls.get("erab_base","hyb"), baseL=null, overL=null;
function setBase(k){if(!BASES[k])k="hyb";baseKey=k;ls.set("erab_base",k);if(baseL)baseL.remove();if(overL)overL.remove();overL=null;const b=BASES[k];
 baseL=L.tileLayer(b.url,{...b.o,crossOrigin:false}).addTo(map);baseL.bringToBack();if(b.over)overL=L.tileLayer(b.over,{maxNativeZoom:19,maxZoom:21}).addTo(map);
 map.getContainer().classList.toggle("base-plan",k==="plan"||k==="topo");
 document.querySelectorAll(".bases").forEach(el=>el.innerHTML=Object.entries(BASES).map(([kk,v])=>`<button class="chip" data-base="${kk}" aria-pressed="${kk===k}">${v.l}</button>`).join(""));
 document.querySelectorAll("[data-base]").forEach(x=>x.onclick=()=>setBase(x.dataset.base))}
setBase(baseKey);
const gZones=L.layerGroup().addTo(map), gLines=L.layerGroup().addTo(map), gPts=L.layerGroup().addTo(map), gObs=L.layerGroup().addTo(map), gTmp=L.layerGroup().addTo(map);
map.createPane("me").style.zIndex=650;const meR=L.svg({pane:"me"});const gMe=L.layerGroup().addTo(map);
let lineLayers={}, fitted=false;
const ll = c=>c.map(p=>[p[1],p[0]]);
function bounds(){const all=[...lines,...zones,...pts,...stations].flatMap(f=>ll(f.coords));return all.length?L.latLngBounds(all):null}
function fitAll(){const b=bounds();if(b)map.fitBounds(b,{padding:[40,40]})}
function featClick(f,e,normal){L.DomEvent.stop(e);if(drawing){addDrawPt(e.latlng);return}if(pickMode){setPick(e.latlng);return}if(shapeEdit)return;if(editMode){openFeat(f);return}normal()}
function drawBase(){gZones.clearLayers();gLines.clearLayers();gPts.clearLayers();lineLayers={};
 zones.forEach(z=>L.polygon(ll(z.coords),{color:z.color,weight:2.5,fillColor:z.color,fillOpacity:.15}).bindTooltip(z.name,{permanent:true,direction:"center",className:"lbl"}).on("click",e=>featClick(z,e,()=>openZone(z))).addTo(gZones));
 stations.forEach(s=>L.polygon(ll(s.coords),{color:"#ffffff",weight:2,fillColor:"#1f4a33",fillOpacity:.8}).bindTooltip(s.name||"Station",{direction:"top"}).on("click",e=>featClick(s,e,()=>{})).addTo(gZones));
 lines.forEach(l=>{const st=lst(l.id).status||"ok",c=ll(l.coords);
  L.polyline(c,{color:"#000",weight:st==="ok"?5:7,opacity:.45,interactive:false}).addTo(gLines);
  const vis=L.polyline(c,{color:LSTAT[st].h,weight:st==="ok"?3:5,opacity:1,dashArray:st==="verif"?"8 6":null,interactive:false}).addTo(gLines);
  const hit=L.polyline(c,{color:"#000",opacity:0,weight:22}).bindTooltip(l.label+" · "+fmtM(l.len),{sticky:true}).on("click",e=>featClick(l,e,()=>openLine(l))).addTo(gLines);
  lineLayers[l.id]={vis,hit}});
 pts.forEach(p=>{const [x,y]=p.coords[0];L.circleMarker([y,x],{radius:7,color:"#fff",weight:2,fillColor:p.color&&p.color!=="#555555"?p.color:"#1f4a33",fillOpacity:1}).bindTooltip(p.name,{permanent:true,direction:"right",className:"lbl",offset:[6,0]}).on("click",e=>featClick(p,e,()=>openPoint(p))).addTo(gPts)});
 if(!fitted){fitAll();fitted=true}}
$("#legend").innerHTML=Object.values(LSTAT).map(s=>`<div><i style="background:${s.h};outline:1px solid #0006"></i>Ligne ${s.l.toLowerCase()}</div>`).join("")+`<div><i style="background:#e5432b;height:12px;width:12px;border-radius:50%;border:2px solid #fff;outline:1px solid #0006"></i>Signalement ouvert</div><div><i style="border:3px solid #e5432b;height:12px;width:12px;border-radius:50%;background:#fff8"></i>Réparé</div><div><i style="background:#e5432b;height:12px;width:12px;border-radius:50%;outline:2px dashed #e5432b;outline-offset:1px"></i>Reporté d'une saison passée</div><div><i style="background:#2f7bf0;height:12px;width:12px;border-radius:50%;border:2px solid #fff;outline:1px solid #0006"></i>Ma position</div>`;
function drawObs(){gObs.clearLayers();visObs().forEach(o=>{if(o.lat==null)return;const t=TYPES[o.type]||TYPES.autre,done=o.status==="regle",old=sOf(o)<viewSeason;
 L.circleMarker([o.lat,o.lng],{radius:done?7:10,color:done?t.c:old?t.c:"#fff",weight:done?3:3,fillColor:done?"#ffffff":t.c,fillOpacity:done?.5:1,dashArray:old?"3 3":null}).on("click",e=>{L.DomEvent.stop(e);if(drawing){addDrawPt(e.latlng);return}if(pickMode){setPick(e.latlng);return}if(editMode||shapeEdit)return;openObs(o)}).bindTooltip(t.l,{direction:"top"}).addTo(gObs)})}
map.on("click",e=>{if(drawing&&drawing.kind!=="gps")addDrawPt(e.latlng);else if(pickMode)setPick(e.latlng);$("#pop").classList.remove("on")});
$("#bFit").onclick=()=>{follow=false;locBtn();fitAll()};
let bannerT=0;const banner=(t,ms)=>{const b=$("#banner");clearTimeout(bannerT);b.textContent=t||"";b.classList.toggle("on",!!t);if(t&&ms)bannerT=setTimeout(()=>banner(""),ms)};
const drw=$("#drawer"),dsc=$("#dscrim");
const menu=o=>{drw.classList.toggle("open",o);dsc.classList.toggle("on",o)};
$("#bMenu").onclick=()=>{render();menu(true)};$("#bClose").onclick=()=>menu(false);dsc.onclick=()=>menu(false);
$("#bLayers").onclick=e=>{e.stopPropagation();$("#pop").classList.toggle("on")};
$("#bBell").onclick=()=>{setTab("activite");menu(true)};
const toMap=()=>menu(false);

// ---------- secteurs (érablières)
function switchSect(id,keepView){curSect=id;ls.set("erab_sect",id);obs=obsAll.filter(o=>sectOf(o)===curSect);derive();if(!keepView)fitted=false;drawBase();drawObs();render();sectUI();if(!keepView&&!bounds())banner("Secteur vide : ajoutez sa carte (Menu › Carte › Importer un KML, ou Modifier la carte).",6000)}
function sectUI(){$("#sectName").textContent=sectName(curSect);$("#dTitle").textContent=sectName(curSect);
 $("#sectList").innerHTML=sectors.map(x=>`<button class="sitem" data-sect="${esc(x.id)}" aria-pressed="${x.id===curSect}"><span>${esc(x.nom)}</span><span class="meta">${obsAll.filter(o=>sectOf(o)===x.id&&o.status!=="regle"&&sOf(o)===CUR).length||""}</span></button>`).join("")+(isEd()&&store?`<button class="sitem add" id="sAdd">+ Nouveau secteur</button>`:"");
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
async function shrink(file){const url=URL.createObjectURL(file);try{const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});const M=1280,s=Math.min(1,M/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.72)}finally{URL.revokeObjectURL(url)}}
const photoCache={};
async function getPhoto(id){if(photoCache[id])return photoCache[id];try{const d=await store.get("photos",id);if(d){photoCache[id]=d.d;return d.d}}catch(e){}return ""}
const pimg=(id,cls,alt)=>`<img class="${cls}" data-pid="${esc(id)}" alt="${esc(alt||"")}">`;
function hydrate(root){root.querySelectorAll("img[data-pid]").forEach(async im=>{if(im.src)return;const s=await getPhoto(im.dataset.pid);if(s)im.src=s})}
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
 while(q.length){try{const r=await fetch("https://ntfy.sh/"+encodeURIComponent(a.topic),{method:"POST",body:q[0],headers:{Title:"Erablieres",Tags:"maple_leaf"}});if(!r.ok)break;q.shift();ls.set("erab_ntfyq",q)}catch(e){break}}flushing=false}
function bell(){const n=acts.filter(a=>a.by!==me.uid&&a.at>lastSeen).length;const b=$("#bellN");b.textContent=n>9?"9+":n;b.style.display=n?"grid":"none"}
const lineLabel=id=>(lines.find(l=>l.id===id)||{}).label||"";
const actText=o=>(TYPES[o.type]||TYPES.autre).l+" signalé"+(o.line?" · "+lineLabel(o.line):"")+(o.note?" — « "+o.note.slice(0,80)+" »":"");
async function seedBase(){if(layerIsDb)return;for(const f of baseLayer){const {id,...d}=f;await store.set("couche",id,d)}layerIsDb=true}
function startData(){
 store.sub("obs",(list,m)=>{obsAll=list.sort((a,b)=>String(b.at).localeCompare(String(a.at)));obs=obsAll.filter(o=>sectOf(o)===curSect);pending=!!m.hasPendingWrites;syncState();drawObs();render()});
 store.sub("lignes",list=>{lstate={};list.forEach(d=>lstate[d.id]=d);drawBase();render()});
 store.sub("couche",(list,m)=>{if(!list.length){if(m.fromCache)return;allLayer=baseLayer;layerIsDb=false;if(isEd())seedBase()}else{allLayer=list;layerIsDb=true}derive();drawBase();drawObs();render()});
 store.sub("secteurs",(list,m)=>{if(list.length)sectors=list.sort((a,b)=>(a.ord??0)-(b.ord??0));else if(!m.fromCache&&isEd())store.set("secteurs",DEF,{nom:"Montagne Noire",ord:0});if(!sectors.find(x=>x.id===curSect))curSect=sectors[0].id;sectUI()});
 store.sub("activite",(list,m)=>{const ids=new Set(acts.map(a=>a.id));const fresh=actsReady?list.filter(a=>!ids.has(a.id)&&a.by!==me.uid):[];acts=list;actsReady=true;bell();if(tab==="activite")render();if(fresh.length)banner((fresh[0].byName?fresh[0].byName+" : ":"")+fresh[0].text,6000)},{order:"at",lim:80});
 store.sub("config",list=>{cfg=Object.fromEntries(list.map(d=>[d.id,d]));flushNtfy();if(tab==="reglages")render()});
 if(isEd())store.sub("membres",list=>{membres=list;if(tab==="reglages")render()});
 sectUI();syncState();}

// ---------- vues du menu
function setTab(v){tab=v;document.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===v));if(v==="activite"){lastSeen=new Date().toISOString();ls.set("erab_seen",lastSeen);bell()}render()}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>setTab(b.dataset.v));
function render(){if(!store)return;const v=$("#view");v.innerHTML=({journal:vJournal,activite:vAct,lignes:vLignes,zones:vZones,carte:vCarte,reglages:vReg})[tab]();bindView(v);hydrate(v)}
function seasonBar(){const ss=[...new Set([CUR,...obs.map(sOf)])].sort((a,b)=>b-a);
 return `<div class="filters" style="align-items:center"><span class="small" style="margin-right:4px">Saison</span>${ss.map(s=>`<button class="chip" data-season="${s}" aria-pressed="${s===viewSeason}">${s}${s===CUR?" (en cours)":""}</button>`).join("")}</div>
 <p class="small" style="margin:-4px 0 10px">${viewSeason===CUR?`Saison ${CUR} depuis le 1<sup>er</sup> août ${CUR-1}. Les réparations des saisons passées sont archivées; les bris non réparés sont reportés.`:`Archive de la saison ${viewSeason}.`}</p>`}
function vJournal(){const all=visObs(),open=all.filter(o=>o.status!=="regle");
 const list=all.filter(o=>(fStat==="tous"||(fStat==="ouvert"?o.status!=="regle":o.status==="regle"))&&(!fType||o.type===fType));
 const brisL=lines.filter(l=>["bris","rep"].includes(lst(l.id).status)).length;
 return seasonBar()+`<div class="kpis"><div class="kpi"><b>${open.length}</b><span>ouverts</span></div><div class="kpi"><b>${all.length-open.length}</b><span>réparés</span></div><div class="kpi"><b>${brisL}</b><span>lignes en bris</span></div></div>
 <div class="filters">${[["ouvert","Ouverts"],["regle","Réparés"],["tous","Tous"]].map(([k,l])=>`<button class="chip" data-fs="${k}" aria-pressed="${fStat===k}">${l}</button>`).join("")}</div>
 <div class="filters">${[["","Tous types"],...Object.entries(TYPES).map(([k,t])=>[k,t.l])].map(([k,l])=>`<button class="chip" data-ft="${k}" aria-pressed="${fType===k}">${l}</button>`).join("")}</div>
 ${list.length?list.map(o=>{const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line);return `<div class="item" data-obs="${esc(o.id)}">${o.photos&&o.photos[0]?pimg(o.photos[0],"thumb"):`<div class="thumb"></div>`}<div style="flex:1"><span class="badge" style="--c:${t.c}">${t.l}</span>${o.status==="regle"?` <span class="meta">· réparé</span>`:""}${sOf(o)<viewSeason?` <span class="meta">· reporté de ${sOf(o)}</span>`:""}<p>${esc(o.note)||"<span class=meta>Sans note</span>"}</p><div class="meta">${fmtD(o.at)}${ln?" · "+esc(ln):""}${o.byName?" · "+esc(o.byName):""}</div></div></div>`}).join(""):`<div class="empty">Aucun signalement ${fStat==="ouvert"?"ouvert ":""}pour cette saison.<br>Touchez <b>Signaler</b> pour ajouter un bris, une photo ou un point GPS.</div>`}`}
function vAct(){return `<div class="h2">Activité</div>${acts.length?acts.map(a=>{const k=ACT[a.kind]||ACT.carte;return `<div class="item" ${a.obs?`data-obs="${esc(a.obs)}"`:""}><span class="badge" style="--c:${k.c};width:104px;flex:none">${k.l}</span><div style="flex:1"><div>${esc(a.text)}</div><div class="meta">${sectors.length>1?esc(sectName(sectOf(a)))+" · ":""}${ago(a.at)}${a.byName?" · "+esc(a.byName):""}</div></div></div>`}).join(""):`<div class="empty">Rien encore. Les signalements, réparations et changements de la carte apparaîtront ici.</div>`}`}
function vLignes(){const tot=lines.reduce((a,l)=>a+l.len,0);
 return `<div class="h2">Maîtres-lignes · saison ${viewSeason}</div><table><thead><tr><th>Ligne</th><th class="n">Longueur</th><th>État</th><th class="n">Ouverts</th></tr></thead><tbody>${lines.map(l=>{const st=lst(l.id).status||"ok",n=visObs().filter(o=>o.line===l.id&&o.status!=="regle").length;return `<tr class="click" data-line="${l.id}"><td>${esc(l.label)}</td><td class="n">${fmtM(l.len)}</td><td><span class="badge" style="--c:${st==="ok"?"#2fa85f":LSTAT[st].h}">${LSTAT[st].l}</span></td><td class="n">${n||"–"}</td></tr>`}).join("")}</tbody><tfoot><tr><td>Total · ${lines.length} lignes</td><td class="n">${fmtM(tot)}</td><td></td><td></td></tr></tfoot></table><p class="small">L'état des lignes repart à OK à chaque nouvelle saison. Longueurs à plat, sans dénivelé.</p>`}
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
function geojson(){return JSON.stringify({type:"FeatureCollection",features:[...obs.filter(o=>o.lat!=null).map(o=>({type:"Feature",properties:{type:(TYPES[o.type]||TYPES.autre).l,note:o.note,statut:o.status==="regle"?"réparé":"ouvert",saison:sOf(o),date:o.at,par:o.byName||"",repare_le:o.doneAt||"",reparation:o.repairNote||"",ligne:lineLabel(o.line)},geometry:{type:"Point",coordinates:[o.lng,o.lat]}})),...lines.map(l=>({type:"Feature",properties:{ligne:l.label,longueur_m:Math.round(l.len),etat:LSTAT[lst(l.id).status||"ok"].l,note:lst(l.id).note||""},geometry:{type:"LineString",coordinates:l.coords}})),...zones.map(z=>({type:"Feature",properties:{zone:z.name,ha:z.ha,potentiel:z.pot},geometry:{type:"Polygon",coordinates:[z.coords]}}))]},null,1)}
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
 v.querySelectorAll("[data-ft]").forEach(b=>b.onclick=()=>{fType=b.dataset.ft;render()});
 v.querySelectorAll("[data-obs]").forEach(b=>b.onclick=()=>{const o=obsAll.find(x=>x.id===b.dataset.obs);if(o){if(sectOf(o)!==curSect)switchSect(sectOf(o),true);toMap();follow=false;locBtn();if(o.lat!=null)map.setView([o.lat,o.lng],Math.max(map.getZoom(),18));openObs(o)}});
 v.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>{const l=lines.find(x=>x.id===b.dataset.line);toMap();follow=false;locBtn();map.fitBounds(lineLayers[l.id].hit.getBounds(),{padding:[60,60],maxZoom:19});openLine(l)});
 v.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{const z=zones.find(x=>x.id===b.dataset.zone);toMap();map.fitBounds(L.latLngBounds(ll(z.coords)),{padding:[30,30]})});
 v.querySelectorAll("[data-feat]").forEach(b=>b.onclick=()=>{const f=[...lines,...zones,...pts,...stations].find(x=>x.id===b.dataset.feat);if(!f)return;toMap();map.fitBounds(L.latLngBounds(ll(f.coords)),{padding:[60,60],maxZoom:19});if(isEd()){setEdit(true);openFeat(f)}});
 const on=(id,fn)=>{const e=v.querySelector(id);if(e)e.onclick=fn};
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
function openSheet(html){sheet.innerHTML=html;scrim.classList.add("on");sheet.scrollTop=0;const x=sheet.querySelector("[data-close]");if(x)x.onclick=closeSheet;hydrate(sheet)}
function closeSheet(){scrim.classList.remove("on");sheet.innerHTML=""}
scrim.addEventListener("click",e=>{if(e.target===scrim)closeSheet()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&scrim.classList.contains("on"))closeSheet()});
const gmaps=(lat,lng)=>`https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
const head=t=>`<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div class="h2" style="margin:0">${t}</div><button class="btn" data-close>Fermer</button></div>`;
const dist=o=>fix&&o.lat!=null?" · à "+fmtM(hav([fix.lng,fix.lat],[o.lng,o.lat]))+" de vous":"";

function openObs(o){const t=TYPES[o.type]||TYPES.autre,ln=lineLabel(o.line),mine=o.by===me.uid,past=sOf(o)<CUR&&o.status==="regle";
 openSheet(`<div class="row" style="justify-content:space-between"><span class="badge" style="--c:${t.c};font-size:16px">${t.l}</span><button class="btn" data-close>Fermer</button></div>
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
    if(o.line){const left=visObs().filter(x=>x.line===o.line&&x.id!==o.id&&x.status!=="regle").length,s=lst(o.line);
     if(!left&&["bris","rep","verif"].includes(s.status)){const {id,...rest}=s;await store.set("lignes",o.line,{...rest,status:"ok",season:CUR,at:new Date().toISOString(),by:me.uid})}}
    closeSheet()}catch(e){ok.disabled=false;ok.textContent="Confirmer la réparation";$("#rErr").textContent="Enregistrement impossible : "+(e.message||e)}}};
 const ro=$("#bReopen");if(ro)ro.onclick=async()=>{await store.upd("obs",o.id,{status:"ouvert",season:CUR});logAct("reouvert","Rouvert : "+t.l+(ln?" · "+ln:""),{obs:o.id});closeSheet()};
 const dl_=$("#bDel");if(dl_)dl_.onclick=()=>{$("#conf").innerHTML=`<div class="row" style="margin-top:10px"><span>Supprimer définitivement ce signalement ?</span><button class="btn red" id="bDel2">Oui, supprimer</button></div>`;
  $("#bDel2").onclick=async()=>{await store.del("obs",o.id);for(const p of [...(o.photos||[]),...(o.repairPhotos||[])])await store.del("photos",p);logAct("suppression","Supprimé : "+t.l+(ln?" · "+ln:""));closeSheet()}};
}
function openLine(l){const s=lst(l.id),st=s.status||"ok",n=visObs().filter(o=>o.line===l.id);
 openSheet(head(esc(l.label))+`<div class="meta">${fmtM(l.len)} · saison ${viewSeason} · ${n.filter(o=>o.status!=="regle").length} signalement(s) ouvert(s) sur ${n.length}</div>
 <label class="f">État de la ligne</label><div class="types">${Object.entries(LSTAT).map(([k,v])=>`<button class="chip" data-st="${k}" aria-pressed="${k===st}">${v.l}</button>`).join("")}</div>
 <label class="f" for="lnote">Note</label><textarea id="lnote" placeholder="Ex. vacuum faible au bout, raccord à changer">${esc(s.note||"")}</textarea>
 ${s.at?`<div class="small">Mis à jour ${fmtD(s.at)}</div>`:""}
 ${viewSeason===CUR?`<div class="row" style="margin-top:14px"><button class="btn pri" id="bSaveL">Enregistrer</button><button class="btn" id="bAddL">Signaler sur cette ligne</button></div>`:""}`);
 let pick=st;sheet.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{pick=b.dataset.st;sheet.querySelectorAll("[data-st]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
 const sv=$("#bSaveL");if(sv)sv.onclick=async()=>{sv.disabled=true;const note=$("#lnote").value.trim();await store.set("lignes",l.id,{sect:curSect,status:pick,note,season:CUR,at:new Date().toISOString(),by:me.uid});if(pick!==st)logAct("ligne",l.label+" → "+LSTAT[pick].l+(note?" — « "+note.slice(0,80)+" »":""));closeSheet()};
 const al=$("#bAddL");if(al)al.onclick=()=>{const usable=fix&&Date.now()-fix.t<60000&&nearestLine(fix.lat,fix.lng).line?.id===l.id;const c=l.coords[Math.floor(l.coords.length/2)];openAdd(usable?{lat:fix.lat,lng:fix.lng,src:"GPS ±"+Math.round(fix.acc)+" m"}:{lat:c[1],lng:c[0],src:"milieu de la ligne"},l.id)};
}
function openZone(z){const b=L.latLngBounds(ll(z.coords));openSheet(head(esc(z.name))+`<p>${z.ha} ha · potentiel ${(+z.pot||0).toLocaleString("fr-CA")} entailles${z.ha&&z.pot?" ("+Math.round(z.pot/z.ha)+"/ha)":""}</p>${z.desc?`<p class="small">${esc(z.desc)}</p>`:""}<p class="meta">${visObs().filter(o=>o.lat!=null&&b.contains([o.lat,o.lng])).length} signalement(s) dans le secteur cette saison</p>`)}
function openPoint(p){const [x,y]=p.coords[0];openSheet(head(esc(p.name))+`${p.desc?`<p>${esc(p.desc)}</p>`:""}<div class="pos">${y.toFixed(6)}, ${x.toFixed(6)}${dist({lat:y,lng:x})} · <a href="${gmaps(y,x)}" target="_blank" rel="noopener">Google Maps</a></div>`)}

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
function openFeat(f){const kindL={ligne:"Ligne",zone:"Zone",point:"Point",station:"Bâtiment"}[f.kind];const c=dec(f.c);
 openSheet(head((f.id?"Modifier · ":"Nouveau · ")+kindL)+`
 <label class="f" for="fName">Nom</label><input type="text" id="fName" value="${esc(f.name)}" placeholder="${f.kind==="ligne"?"Ex. 13":"Ex. Zone 4"}">
 ${f.kind==="zone"?`<div class="row" style="flex-wrap:nowrap"><div style="flex:1"><label class="f" for="fHa">Superficie (ha)</label><input type="number" step="0.1" id="fHa" value="${f.ha||""}"></div><div style="flex:1"><label class="f" for="fPot">Potentiel (entailles)</label><input type="number" id="fPot" value="${f.pot||""}"></div></div><div class="small">Superficie calculée du tracé : ${areaHa(c).toFixed(1)} ha</div>`:""}
 ${f.kind!=="ligne"?`<label class="f">Couleur</label><div class="types">${PALETTE.map(p=>`<button class="chip" data-col="${p}" aria-pressed="${p===f.color}" style="width:46px;background:${p};border:3px solid ${p===f.color?"var(--ink)":p}" aria-label="Couleur ${p}"></button>`).join("")}</div>`:`<div class="small" style="margin-top:8px">${fmtM(c.reduce((a,p,i)=>i?a+hav(c[i-1],p):0,0))} · ${c.length} points</div>`}
 <label class="f" for="fDesc">Description</label><textarea id="fDesc">${esc(f.desc||"")}</textarea>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="fSave" style="flex:1">Enregistrer</button>${f.id?`<button class="btn" id="fShape">Modifier le tracé</button><button class="btn red" id="fDel">Supprimer</button>`:""}</div><div id="fConf"></div><div class="err" id="fErr"></div>`);
 let col=f.color;sheet.querySelectorAll("[data-col]").forEach(b=>b.onclick=()=>{col=b.dataset.col;sheet.querySelectorAll("[data-col]").forEach(x=>{x.setAttribute("aria-pressed",x===b);x.style.borderColor=x===b?"var(--ink)":x.dataset.col})});
 $("#fSave").onclick=async()=>{const b=$("#fSave");b.disabled=true;
  try{await seedBase();const v={sect:f.sect||curSect,kind:f.kind,name:$("#fName").value.trim()||(f.kind==="ligne"?"Sans nom":kindL),desc:$("#fDesc").value.trim(),color:col,c:f.c,ha:f.kind==="zone"?+($("#fHa").value||areaHa(c).toFixed(1)):0,pot:f.kind==="zone"?+($("#fPot").value||0):0,ord:f.ord??Date.now()};
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
 <label class="f">Type</label><div class="types">${Object.entries(TYPES).map(([k,t])=>`<button class="chip" data-ty="${k}" aria-pressed="${d.type===k}">${t.l}</button>`).join("")}</div>
 <label class="f">Position</label><div class="pos">${d.lat!=null?`${d.lat.toFixed(6)}, ${d.lng.toFixed(6)} <span class="meta">· ${esc(d.src)}</span>`:`<span class="meta">Aucune position</span>`}</div>
 <div class="row" style="margin-top:8px"><button class="btn pri" id="dGps">Ma position GPS</button><button class="btn" id="dMap">Toucher la carte</button><button class="btn" id="dMan">Coordonnées</button></div>
 <div id="manBox" style="display:none" class="row"><input type="text" id="dLL" inputmode="decimal" placeholder="46.2657, -74.2446" style="flex:1;margin-top:8px"><button class="btn" id="dLLok" style="margin-top:8px">OK</button></div>
 <div class="err" id="perr"></div>
 <label class="f">Photos</label><label class="btn">Prendre ou ajouter des photos<input type="file" id="dPh" accept="image/*" multiple></label><div class="photos">${d.files.map(p=>`<img alt="" src="${p}">`).join("")}</div>
 <label class="f" for="dLine">Ligne</label><select id="dLine"><option value="">Aucune</option>${lines.map(l=>`<option value="${l.id}" ${d.line===l.id?"selected":""}>${esc(l.label)}</option>`).join("")}</select>
 <label class="f" for="dNote">Note</label><textarea id="dNote" placeholder="Ex. tubulure 5/16 coupée par un chevreuil, 3 m du raccord">${esc(d.note)}</textarea>
 <div class="row" style="margin-top:16px"><button class="btn pri" id="dSave" style="flex:1">Enregistrer</button></div><div class="err" id="serr"></div>`);
 const keep=()=>{d.note=$("#dNote").value;d.line=$("#dLine").value||null};
 sheet.querySelectorAll("[data-ty]").forEach(b=>b.onclick=()=>{keep();d.type=b.dataset.ty;showDraft()});
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
   const rec={sect:curSect,type:d.type,note:d.note.trim(),lat:+d.lat.toFixed(7),lng:+d.lng.toFixed(7),line:d.line||null,status:"ouvert",at:new Date().toISOString(),season:CUR,by:me.uid,byName:me.nom,photos:ids};
   await store.set("obs",id,rec);logAct("signalement",actText(rec),{obs:id});
   if(viewSeason!==CUR){viewSeason=CUR;renderAll()}closeSheet();if(!navigator.onLine)banner("Hors ligne : enregistré sur le téléphone, envoi automatique au retour du réseau.",5000)}
  catch(e){btn.disabled=false;btn.textContent="Enregistrer";$("#serr").textContent="Enregistrement impossible : "+(e.message||e)}};
}

// ---------- connexion
const gate=$("#gate"),gc=$("#gatecard");
function showGate(html){gc.innerHTML=html;gate.classList.add("on")}
function hideGate(){gate.classList.remove("on")}
function loginForm(msg){showGate(`<h2>Érablière Montagne Noire</h2><p class="small">Connectez-vous avec le courriel inscrit par l'administrateur.</p>
 <label class="f" for="gEmail">Courriel</label><input type="email" id="gEmail" autocomplete="email">
 <label class="f" for="gPass">Mot de passe</label><input type="password" id="gPass" autocomplete="current-password">
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
