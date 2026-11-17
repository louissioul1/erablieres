#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
erab-bridge 2 — passerelle AUTOMATIQUE « systèmes de surveillance d'érablière → apps Érablières Grégoire »
Python 3.6+, bibliothèque standard seulement. Aucun compte, aucune question.

Tout seul, la passerelle :
  - détecte les sources de données présentes (bases SQLite, exports CSV, API web locales) en LECTURE SEULE ;
  - envoie chaque composante (vide, niveau de bassin, température, débit, pression, pompes en marche, Brix…)
    à Firestore (collections capteurs, capteurs_log, capteurs_sources) ;
  - envoie son rapport de découverte (collection passerelles) et applique la configuration
    qu'un administrateur y dépose à distance (champ « config ») ;
  - envoie une alerte ntfy quand un capteur passe en vide bas, en alarme ou hors ligne ;
  - se met à jour elle-même depuis le dépôt GitHub.

Commandes (facultatives) : run | test | etat | decouvrir [fichier] | simuler
"""
import json, os, sys, time, math, random, socket, struct, glob, csv, io, re, sqlite3, subprocess, platform, uuid
import urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone

VERSION = "2.1.0"
HERE = os.path.dirname(os.path.abspath(__file__))
ETC = os.environ.get("ERAB_ETC", "/etc/erab-bridge")
VAR = os.environ.get("ERAB_VAR", "/var/lib/erab-bridge")
CFG_PATH, CAPT_PATH, ID_PATH = os.path.join(ETC, "config.json"), os.path.join(ETC, "capteurs.json"), os.path.join(ETC, "id")
QUEUE_PATH, STATE_PATH = os.path.join(VAR, "file.json"), os.path.join(VAR, "etat.json")
DEF_PATHS = [os.path.join(ETC, "defaults.json"), os.path.join(HERE, "defaults.json")]

def now_iso(): return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
def log(*a): print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), *a, flush=True)
def load_json(p, d):
    try:
        with open(p, encoding="utf-8") as f: return json.load(f)
    except (OSError, ValueError): return d
def save_json(p, v, mode=0o640):
    os.makedirs(os.path.dirname(p), exist_ok=True); tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(v, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, mode); os.replace(tmp, p)
def defaults():
    for p in DEF_PATHS:
        d = load_json(p, None)
        if d: return d
    sys.exit("defaults.json introuvable")
def device_id():
    i = None
    try:
        with open(ID_PATH) as f: i = f.read().strip()
    except OSError: pass
    if not i:
        i = uuid.uuid4().hex; os.makedirs(ETC, exist_ok=True)
        with open(ID_PATH, "w") as f: f.write(i)
    return i

# ---------------------------------------------------------------- dates, unités, états
def parse_at(at):
    """Accepte ISO (avec ou sans Z), 'AAAA-MM-JJ HH:MM:SS' (heure locale), JJ/MM/AAAA, époque s/ms. Retourne ISO UTC."""
    if at in (None, ""): return now_iso()
    if isinstance(at, (int, float)) or (isinstance(at, str) and re.fullmatch(r"\d{9,13}(\.\d+)?", at.strip())):
        x = float(at); return datetime.fromtimestamp(x / (1000 if x > 1e11 else 1), timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    s = str(at).strip().replace("/", "-")
    m = re.match(r"(\d{2})-(\d{2})-(\d{4})(.*)", s)
    if m: s = "%s-%s-%s%s" % (m.group(3), m.group(2), m.group(1), m.group(4))
    s = s.replace(" ", "T", 1)
    try:
        if s.endswith("Z"): return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%dT%H:%M:%SZ")
        if re.search(r"[+-]\d{2}:?\d{2}$", s): return datetime.fromisoformat(s).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        d = datetime.strptime(s[:19] if len(s) >= 19 else s[:16], "%Y-%m-%dT%H:%M:%S" if len(s) >= 19 else "%Y-%m-%dT%H:%M")
        return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # heure locale de la machine
    except ValueError:
        return now_iso()
def ts(iso):
    try: return datetime.strptime(iso[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc).timestamp()
    except Exception: return time.time()
TYPES = {  # ordre = priorité de reconnaissance par nom de colonne
    "vide": {"u": "inHg", "rx": r"vac|vide|vacuum|inhg|depression|dépression"},
    "niveau": {"u": "%", "rx": r"niveau|level|bassin|tank|r[eé]servoir|hauteur|cuve|fill|volume"},
    "temperature": {"u": "°C", "rx": r"temp|degr|celsius"},
    "debit": {"u": "L/h", "rx": r"d[eé]bit|flow|gpm|gph|lph"},
    "concentration": {"u": "°Brix", "rx": r"brix|concentr|sucre|sugar"},
    "pression": {"u": "psi", "rx": r"pression|pressure|psi"},
    "marche": {"u": "", "rx": r"marche|running|pompe|pump|relais|relay|moteur|motor|extract|onoff|on_off|actif|state|status"},
    "compteur": {"u": "", "rx": r"compteur|counter|cycles|heures|hours|totali"},
}
LIB = {"vide": "vide", "niveau": "niveau", "temperature": "température", "debit": "débit", "concentration": "Brix", "pression": "pression", "marche": "marche", "compteur": "compteur", "autre": "mesure"}
SEUILS0 = {"vide": {"bas": 22, "alarme": 18}, "niveau": {"max": 90, "alarmeMax": 97}}
def classer(nom):
    n = str(nom or "")
    for t, v in TYPES.items():
        if re.search(v["rx"], n, re.I): return t
    return None
def num(v):
    if isinstance(v, bool): return 1.0 if v else 0.0
    if isinstance(v, (int, float)): return float(v)
    t = str(v).strip().lower()
    if t in ("on", "true", "marche", "oui", "yes", "run", "running", "actif", "ouvert", "open"): return 1.0
    if t in ("off", "false", "arret", "arrêt", "non", "no", "stop", "stopped", "inactif", "ferme", "fermé", "closed"): return 0.0
    return float(re.sub(r"[^\d.,-]", "", t).replace(",", "."))
def to_inhg(val, unit):
    u = (unit or "inHg").lower().replace(" ", ""); v = abs(float(val))
    return {"kpa": v * 0.2953, "mbar": v * 0.02953, "hpa": v * 0.02953, "bar": v * 29.53, "psi": v * 2.036, "mmhg": v / 25.4, "torr": v / 25.4}.get(u, v)
def etat_de(val, at, typ, seuils):
    """seuils : globaux (horsLigneMin) + par type ({vide:{bas,alarme}, niveau:{max,alarmeMax,min,alarmeMin}, …}) + par capteur."""
    if time.time() - ts(at) > seuils.get("horsLigneMin", 30) * 60 or val is None: return "hors_ligne"
    s = dict(SEUILS0.get(typ, {}), **seuils.get(typ, {}), **{k: v for k, v in seuils.items() if k in ("bas", "alarme", "min", "max", "alarmeMin", "alarmeMax")})
    if typ == "vide":
        if val < s.get("alarme", 18): return "alarme"
        if val < s.get("bas", 22): return "bas"
        return "ok"
    if ("alarmeMax" in s and val >= s["alarmeMax"]) or ("alarmeMin" in s and val <= s["alarmeMin"]): return "alarme"
    if ("max" in s and val >= s["max"]) or ("min" in s and val <= s["min"]): return "bas"
    return "ok"
def unite_vers(val, typ, unit):
    u = (unit or "").lower().replace(" ", "")
    if typ == "vide": return round(to_inhg(val, unit), 2), "inHg"
    if typ == "temperature" and u in ("f", "°f", "degf", "fahrenheit"): return round((val - 32) / 1.8, 1), "°C"
    return round(val, 3), unit or TYPES.get(typ, {}).get("u", "")

# ---------------------------------------------------------------- adaptateurs
def pick(row, key):
    if key is None or not isinstance(row, dict): return None
    cur = row
    for part in str(key).split("."):
        if isinstance(cur, dict) and part in cur: cur = cur[part]
        elif isinstance(cur, list) and part.isdigit() and int(part) < len(cur): cur = cur[int(part)]
        else: return None
    return cur
def normalise_rows(rows, champs, d):
    """Trois formes acceptées :
       - « mesures » : [{col, type, unit}] → plusieurs composantes par ligne (ex. vide + température + niveau) ;
       - champs.typeCol : une colonne dit le type de la mesure (format « long ») ;
       - champs.val + typeMesure : une seule mesure par ligne."""
    last, mes = {}, d.get("mesures")
    for r in rows:
        try:
            i = pick(r, champs.get("id", "id"))
            if i in (None, ""): continue
            base = {"at": parse_at(pick(r, champs.get("at", "at")))}
            for k in ("bat", "signal", "nom"):
                x = pick(r, champs.get(k, k))
                if x not in (None, ""): base[k] = x
            items = []
            if mes:
                for mm in mes:
                    v = pick(r, mm["col"])
                    if v in (None, ""): continue
                    items.append(("%s_%s" % (i, mm.get("suffixe", mm["type"])) if len(mes) > 1 else str(i), num(v), mm["type"], mm.get("unit") or pick(r, champs.get("unit", "unit"))))
            else:
                v = pick(r, champs.get("val", "val"))
                if v in (None, ""): continue
                if champs.get("typeCol"):
                    typ = classer(pick(r, champs["typeCol"])) or "autre"; iid = "%s_%s" % (i, typ)
                else:
                    typ, iid = d.get("typeMesure", "vide"), str(i)
                items.append((iid, num(v), typ, pick(r, champs.get("unit", "unit")) or d.get("unit")))
            for iid, v, typ, unit in items:
                m = dict(base, id=str(iid).strip(), val=v, type=typ, unit=unit or TYPES.get(typ, {}).get("u", ""))
                if iid != str(i) and "nom" not in base: m["nom"] = "%s · %s" % (i, LIB.get(typ, typ))
                if m["id"] not in last or m["at"] >= last[m["id"]]["at"]: last[m["id"]] = m
        except (ValueError, TypeError): continue
    return list(last.values())

class Adaptateur:
    def __init__(self, cfg): self.cfg = cfg
class Simulateur(Adaptateur):
    def __init__(self, cfg):
        super().__init__(cfg); self.vals = {"SIM%02d" % (i + 1): random.uniform(23, 26.5) for i in range(int(cfg.get("capteurs", 6)))}
    def lire(self):
        out = []
        for k in self.vals:
            self.vals[k] = max(10, min(28, self.vals[k] + random.uniform(-0.6, 0.55)))
            out.append({"id": k, "val": round(self.vals[k], 2), "unit": "inHg", "type": "vide", "at": now_iso(), "nom": "Simulé " + k})
        out.append({"id": "BASSIN1", "val": round(random.uniform(40, 80), 1), "unit": "%", "type": "niveau", "at": now_iso(), "nom": "Bassin simulé"})
        out.append({"id": "TEMP1", "val": round(random.uniform(-5, 8), 1), "unit": "°C", "type": "temperature", "at": now_iso(), "nom": "Température simulée"})
        out.append({"id": "POMPE1", "val": 1.0, "unit": "", "type": "marche", "at": now_iso(), "nom": "Pompe simulée"})
        return out
class CSVDossier(Adaptateur):
    def lire(self):
        fs = sorted(glob.glob(os.path.join(self.cfg["dossier"], self.cfg.get("motif", "*.csv"))), key=os.path.getmtime)
        if not fs: raise RuntimeError("aucun fichier dans " + self.cfg["dossier"])
        with open(fs[-1], encoding=self.cfg.get("encodage", "utf-8-sig"), errors="replace") as fh: txt = fh.read()
        sep = self.cfg.get("separateur") or (";" if txt.count(";") > txt.count(",") else ",")
        return normalise_rows(list(csv.DictReader(io.StringIO(txt), delimiter=sep))[-5000:], self.cfg.get("champs", {}), self.cfg)
class SQLiteLecture(Adaptateur):
    def lire(self):
        con = sqlite3.connect("file:%s?mode=ro" % urllib.parse.quote(self.cfg["chemin"]), uri=True, timeout=5)
        try:
            con.row_factory = sqlite3.Row; rows = [dict(r) for r in con.execute(self.cfg["requete"]).fetchall()]
        finally: con.close()
        return normalise_rows(rows, self.cfg.get("champs", {}), self.cfg)
class HTTPJson(Adaptateur):
    def lire(self):
        with urllib.request.urlopen(urllib.request.Request(self.cfg["url"], headers=self.cfg.get("entetes", {})), timeout=15) as r:
            data = json.loads(r.read().decode("utf-8", "replace"))
        rows = pick(data, self.cfg["liste"]) if self.cfg.get("liste") else data
        if isinstance(rows, dict): rows = [dict(v, id=k) if isinstance(v, dict) else {"id": k, "val": v} for k, v in rows.items()]
        return normalise_rows(rows or [], self.cfg.get("champs", {}), self.cfg)
class ModbusTCP(Adaptateur):
    def _lire(self, s, unite, fc, adr, n):
        s.sendall(struct.pack(">HHHBBHH", random.randint(0, 65535), 0, 6, unite, fc, adr, n)); h = s.recv(9)
        if len(h) < 9 or h[7] != fc: raise RuntimeError("réponse Modbus invalide")
        d = b""
        while len(d) < h[8]: d += s.recv(h[8] - len(d))
        return d
    def lire(self):
        out = []
        with socket.create_connection((self.cfg["hote"], int(self.cfg.get("port", 502))), timeout=8) as s:
            for r in self.cfg.get("registres", []):
                f = r.get("format", "int16"); d = self._lire(s, int(self.cfg.get("unite", 1)), 4 if r.get("type") == "input" else 3, int(r["adresse"]), 2 if f == "float32" else 1)
                v = struct.unpack(">f", d[:4])[0] if f == "float32" else struct.unpack(">H" if f == "uint16" else ">h", d[:2])[0]
                out.append({"id": str(r["id"]), "val": v * float(r.get("echelle", 1)), "unit": r.get("unit", "inHg"), "type": r.get("typeMesure", "vide"), "at": now_iso(), "nom": r.get("nom", r["id"])})
        return out
class Commande(Adaptateur):
    def lire(self):
        p = subprocess.run(self.cfg["commande"], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if p.returncode: raise RuntimeError(p.stderr.decode("utf-8", "replace")[:300])
        t = p.stdout.decode("utf-8", "replace").strip()
        try: rows = json.loads(t)
        except ValueError: rows = [json.loads(l) for l in t.splitlines() if l.strip().startswith("{")]
        return normalise_rows(rows if isinstance(rows, list) else [rows], self.cfg.get("champs", {}), self.cfg)
GEN = {"simulateur": Simulateur, "csv": CSVDossier, "sqlite": SQLiteLecture, "http": HTTPJson, "modbus": ModbusTCP, "commande": Commande}
def creer(src):
    via = src.get("via") or src.get("type")
    if via not in GEN: raise RuntimeError("source sans moyen de lecture valide (via = csv, sqlite, http, modbus, commande)")
    return GEN[via](src)

# ---------------------------------------------------------------- détection automatique (lecture seule)
RX_ID1 = re.compile(r"(capteur|sensor|node|noeud|transmet|device|serial|serie|tag|probe|sonde|address|adresse|point|ligne|line|nom|name)", re.I)
RX_ID = re.compile(r"^(id|uid|code)$", re.I)
RX_VAL = re.compile(r"(valeur|value|reading|lecture|mesure|val$)", re.I)
RX_TYPECOL = re.compile(r"^(type|kind|categorie|catégorie|sensor_?type|type_?capteur|grandeur|parametre|paramètre|unit[eé]?)$", re.I)
RX_T = re.compile(r"(date|time|stamp|heure|recorded|created|^ts$|_at$|^at$)", re.I)
RX_BAT = re.compile(r"(bat|batt|battery|batterie|volt)", re.I)
MOTS = re.compile(r"datacer|lapierre|cdl|smartrek|h2o|maple|erabl|vacuum|vide|sugar|sirop|tevatronic|sensor|capteur", re.I)
RACINES = ("/opt", "/srv", "/home", "/var/lib", "/var/log", "/usr/local", "/root", "/mnt", "/data", "/media")

def _cols(cols):
    """Retourne (colonne id, colonne temps, colonne batterie, mesures [{col,type}], colonne valeur générique, colonne type)."""
    tc = next((c for c in cols if RX_T.search(c)), None)
    bc = next((c for c in cols if RX_BAT.search(c) and c != tc), None)
    idc = next((c for c in cols if RX_ID1.search(c) and c not in (tc, bc) and not classer(c) and not RX_VAL.search(c)), None) or next((c for c in cols if RX_ID.search(c)), None)
    autres = [c for c in cols if c not in (idc, tc, bc)]
    mes = [{"col": c, "type": classer(c)} for c in autres if classer(c) and not RX_TYPECOL.search(c)]
    valc = next((c for c in autres if RX_VAL.search(c)), None)
    typec = next((c for c in autres if RX_TYPECOL.search(c)), None)
    return idc, tc, bc, mes, valc, typec
def _plan(cols):
    """Construit la partie « lecture » d'une source à partir des noms de colonnes, ou None."""
    idc, tc, bc, mes, valc, typec = _cols(cols)
    if not idc: return None
    champs = {"id": idc}
    if tc: champs["at"] = tc
    if bc: champs["bat"] = bc
    if valc and typec: champs.update(val=valc, typeCol=typec); return {"champs": champs}
    if mes: return {"champs": champs, "mesures": mes}
    if valc: champs["val"] = valc; return {"champs": champs, "typeMesure": "vide"}
    return None
def _plausible(ms):
    return len(ms) >= 1 and all(math.isfinite(m["val"]) and abs(m["val"]) < 1e7 for m in ms) and all(abs(m["val"]) <= 110 for m in ms if m["type"] == "vide")
def _unites(src, ms):
    vs = sorted(abs(m["val"]) for m in ms if m["type"] == "vide")
    if vs and vs[len(vs) // 2] > 31:
        for mm in src.get("mesures", []):
            if mm["type"] == "vide": mm["unit"] = "kPa"
        if not src.get("mesures"): src["unit"] = "kPa"
def fichiers(exts, maxn=4000):
    n = 0
    for r in RACINES:
        if not os.path.isdir(r): continue
        for dp, dn, fn in os.walk(r):
            if dp.count(os.sep) > 8 or "erab-bridge" in dp: dn[:] = []; continue
            for f in fn:
                if f.lower().endswith(exts):
                    n += 1
                    if n > maxn: return
                    yield os.path.join(dp, f)
def marque(txt):
    t = txt.lower()
    return "datacer" if ("datacer" in t or "lapierre" in t) else "cdl" if "cdl" in t else "h2o" if ("h2o" in t or "smartrek" in t) else "tevatronic" if "tevatronic" in t else "auto"
def detecter(sect):
    """Retourne une liste de sources candidates (toutes composantes), triées par score."""
    cand = []
    def ajouter(src, ms, bonus):
        if not _plausible(ms): return
        _unites(src, ms)
        types = sorted(set(m["type"] for m in ms))
        recent = ms and time.time() - ts(max(m["at"] for m in ms)) < 86400
        score = bonus + min(len(ms), 60) + 8 * len(types) + (20 if recent else 0) + (20 if MOTS.search(json.dumps(src)) else 0)
        src["types"] = types
        cand.append((score, src, len(ms)))
    for db in fichiers((".db", ".sqlite", ".sqlite3", ".db3")):
        try:
            con = sqlite3.connect("file:%s?mode=ro" % urllib.parse.quote(db), uri=True, timeout=3)
            tables = [r[0] for r in con.execute("select name from sqlite_master where type in ('table','view')").fetchall()]
            for t in tables:
                q = t.replace('"', '')
                cols = [c[1] for c in con.execute('pragma table_info("%s")' % q)]
                plan = _plan(cols)
                if not plan: continue
                tc = plan["champs"].get("at")
                src = dict(plan, via="sqlite", marque=marque(db + t), nom=os.path.basename(db) + ":" + t, sect=sect, chemin=db,
                           requete='SELECT * FROM "%s" ORDER BY %s DESC LIMIT 5000' % (q, '"%s"' % tc if tc else "rowid"))
                try: ajouter(src, SQLiteLecture(src).lire(), 10 + (15 if tc else 0))
                except Exception: pass
            con.close()
        except Exception: continue
    for f in fichiers((".csv",)):
        try:
            if time.time() - os.path.getmtime(f) > 3 * 86400: continue
            with open(f, encoding="utf-8-sig", errors="replace") as fh: head = fh.read(20000)
            sep = ";" if head.count(";") > head.count(",") else ","
            plan = _plan(next(csv.reader(io.StringIO(head), delimiter=sep), []))
            if not plan: continue
            src = dict(plan, via="csv", marque=marque(f), nom=os.path.basename(f), sect=sect, dossier=os.path.dirname(f), motif="*" + os.path.splitext(f)[1], separateur=sep)
            ajouter(src, CSVDossier(src).lire(), 30)
        except Exception: continue
    ports = subprocess.run("ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null", shell=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout.decode("utf-8", "replace")
    for port in sorted(set(int(x) for x in re.findall(r"[:\]](\d{2,5})\s", ports) if 20 < int(x) < 65535))[:25]:
        for chemin in ("/api/sensors", "/api/nodes", "/api/data", "/api/transmitters", "/api/devices", "/api/tanks", "/data.json", "/sensors", "/api"):
            url = "http://127.0.0.1:%d%s" % (port, chemin)
            try:
                with urllib.request.urlopen(url, timeout=3) as r: data = json.loads(r.read(2000000).decode("utf-8", "replace"))
            except Exception: continue
            liste, rows = None, data
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list) and v and isinstance(v[0], dict): liste, rows = k, v; break
            if not (isinstance(rows, list) and rows and isinstance(rows[0], dict)): continue
            plan = _plan(list(rows[0].keys()))
            if not plan: continue
            src = dict(plan, via="http", marque="auto", nom="port %d%s" % (port, chemin), sect=sect, url=url, liste=liste)
            try: ajouter(src, HTTPJson(src).lire(), 40)
            except Exception: pass
    cand.sort(key=lambda x: -x[0])
    return [dict(c[1], score=c[0], capteurs=c[2]) for c in cand[:10]]

def sh(cmd):
    try: return subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=40).stdout.decode("utf-8", "replace")
    except Exception as e: return "(%s)" % e
def rapport(cands):
    L = ["# erab-bridge %s — %s — %s" % (VERSION, socket.gethostname(), datetime.now().strftime("%Y-%m-%d %H:%M")), "Lecture seule.", ""]
    L += ["## Système", sh("uname -a; head -3 /etc/os-release 2>/dev/null; python3 --version"), "## Réseau", sh("ip -4 addr 2>/dev/null | grep inet || ifconfig 2>/dev/null | grep 'inet '")]
    L += ["## Processus", sh("ps aux 2>/dev/null | grep -iE 'datacer|lapierre|cdl|smartrek|h2o|maple|vacuum|node|java|python|mono|dotnet|mosquitto|modbus|php|nginx|lighttpd' | grep -v grep | cut -c1-200")]
    L += ["## Ports", sh("ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null"), "## Série/USB", sh("ls /dev/ttyUSB* /dev/ttyACM* /dev/serial/by-id/* 2>/dev/null; lsusb 2>/dev/null")]
    L.append("## Fichiers évocateurs")
    n = 0
    for f in fichiers((".db", ".sqlite", ".sqlite3", ".csv", ".json", ".xml", ".conf", ".ini", ".cfg", ".yaml", ".yml", ".log")):
        if MOTS.search(f) or f.lower().endswith((".db", ".sqlite", ".sqlite3")):
            try: L.append("%s (%d o, %s)" % (f, os.path.getsize(f), datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M")))
            except OSError: pass
            n += 1
            if n > 200: break
    L += ["", "## Sources détectées automatiquement"] + [json.dumps(c, ensure_ascii=False) for c in cands]
    return "\n".join(L)

# ---------------------------------------------------------------- Firestore REST (clé de passerelle, aucun compte)
class Firestore:
    def __init__(self, d):
        self.d = d; self.base = "projects/%s/databases/(default)/documents" % d["projectId"]
    def _req(self, url, body=None, method="POST"):
        req = urllib.request.Request(url + ("&" if "?" in url else "?") + "key=" + self.d["apiKey"], data=json.dumps(body).encode() if body is not None else None,
                                     headers={"Content-Type": "application/json"}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as r: return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            raise RuntimeError("HTTP %s : %s" % (e.code, e.read().decode("utf-8", "replace")[:300]))
    @staticmethod
    def enc(v):
        if v is None: return {"nullValue": None}
        if isinstance(v, bool): return {"booleanValue": v}
        if isinstance(v, (int, float)): return {"doubleValue": float(v)} if math.isfinite(v) else {"nullValue": None}
        if isinstance(v, dict): return {"mapValue": {"fields": {k: Firestore.enc(x) for k, x in v.items()}}}
        if isinstance(v, list): return {"arrayValue": {"values": [Firestore.enc(x) for x in v]}}
        return {"stringValue": str(v)}
    @staticmethod
    def dec(f):
        k, v = next(iter(f.items()))
        if k == "mapValue": return {a: Firestore.dec(b) for a, b in v.get("fields", {}).items()}
        if k == "arrayValue": return [Firestore.dec(x) for x in v.get("values", [])]
        if k in ("integerValue",): return int(v)
        return v
    def commit(self, docs):
        """docs : (collection, id, dict, merge?) — la clé de passerelle est ajoutée à chaque document."""
        for i in range(0, len(docs), 400):
            w = []
            for d in docs[i:i + 400]:
                c, did, v = d[0], d[1], dict(d[2], cle=self.d["cle"])
                one = {"update": {"name": "%s/%s/%s" % (self.base, c, re.sub(r"[/\s]", "_", did)), "fields": {k: self.enc(x) for k, x in v.items()}}}
                if len(d) > 3 and d[3]: one["updateMask"] = {"fieldPaths": ["`%s`" % k if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", k) else k for k in v]}
                w.append(one)
            self._req("https://firestore.googleapis.com/v1/%s:commit" % self.base, {"writes": w})
    def get(self, c, did):
        r = self._req("https://firestore.googleapis.com/v1/%s/%s/%s" % (self.base, c, did), method="GET")
        return {k: self.dec(v) for k, v in (r or {}).get("fields", {}).items()} if r else None

def fmt(x):
    if x.get("type") == "marche": return "en marche" if x["val"] else "arrêt"
    u = x.get("unit") or ""
    return ("%s\"" % x["val"]) if u == "inHg" else "%s %s" % (x["val"], u)
def libelle(x):
    t, e = x.get("type"), x["etat"]
    if e == "hors_ligne": return "Hors ligne"
    if t == "vide": return "Fuite probable" if e == "alarme" else "Vide bas"
    haut = x["val"] >= 50
    if t == "niveau": return ("Bassin presque plein" if haut else "Bassin presque vide") if e == "alarme" else ("Niveau haut" if haut else "Niveau bas")
    nom = {"temperature": "Température", "debit": "Débit", "pression": "Pression", "concentration": "Brix", "marche": "État", "compteur": "Compteur"}.get(t, "Mesure")
    return nom + (" critique" if e == "alarme" else " hors limites")

# ---------------------------------------------------------------- cœur
class Passerelle:
    def __init__(self, dry=False):
        self.d = defaults(); self.id = device_id(); self.dry = dry
        self.fs = Firestore(self.d)
        self.cfg = load_json(CFG_PATH, {}) or {}
        self.capt = load_json(CAPT_PATH, {})
        self.etat = load_json(STATE_PATH, {"envoye": {}, "heures": {}, "sources": {}, "srcEnv": {}, "alerte": {}})
        for k in ("envoye", "heures", "sources", "srcEnv", "alerte"): self.etat.setdefault(k, {})
        self.file = load_json(QUEUE_PATH, [])
        self.auto, self.t_det, self.t_cfg, self.t_maj, self._al = [], 0, 0, 0, []
        self.construire()
    def construire(self):
        srcs = [s for s in self.cfg.get("sources", []) if s.get("actif", True)]
        if not srcs and self.cfg.get("auto", True):  # sources détectées les plus sûres (plusieurs tables possibles : vide, bassins…)
            srcs = [a for a in self.auto if a.get("score", 0) >= 60][:5] or self.auto[:1]
        self.adapt = []
        for s in srcs:
            try: self.adapt.append((s, creer(s)))
            except Exception as e: log("Source ignorée :", s.get("nom"), "-", e)
        self.sources_en_service = srcs
    def sect(self): return self.cfg.get("sect") or "montagne-noire"
    @staticmethod
    def sid(s): return re.sub(r"[^a-z0-9_-]", "_", ("%s_%s" % (s.get("via", s.get("type", "")), s.get("nom", ""))).lower())[:120]
    # --- tâches de fond
    def taches(self):
        t = time.time()
        if t - self.t_cfg > 600:  # config à distance toutes les 10 min
            self.t_cfg = t
            try:
                doc = self.fs.get("passerelles", self.id)
                if doc and doc.get("config"):
                    c = json.loads(doc["config"]) if isinstance(doc["config"], str) else doc["config"]
                    if c != self.cfg:
                        self.cfg = c; save_json(CFG_PATH, c); self.capt = c.get("capteurs", self.capt); save_json(CAPT_PATH, self.capt)
                        log("Nouvelle configuration reçue à distance"); self.construire()
            except Exception as e: log("Config à distance indisponible :", e)
        if t - self.t_det > 6 * 3600:  # détection + rapport toutes les 6 h
            self.t_det = t
            try:
                self.auto = detecter(self.sect())
                if not self.cfg.get("sources"): self.construire()
                self.fs.commit([("passerelles", self.id, {"hote": socket.gethostname(), "version": VERSION, "os": platform.platform(), "majAt": now_iso(),
                                 "rapport": rapport(self.auto)[:400000], "detection": json.dumps(self.auto, ensure_ascii=False),
                                 "enService": json.dumps(self.sources_en_service, ensure_ascii=False), "sect": self.sect()}, True)])
                log("Rapport envoyé : %d source(s) détectée(s)" % len(self.auto))
            except Exception as e: log("Rapport non envoyé :", e)
        if t - self.t_maj > 24 * 3600 and self.d.get("majUrl"):  # mise à jour quotidienne
            self.t_maj = t; self.maj()
    def maj(self):
        try:
            with urllib.request.urlopen(self.d["majUrl"] + "?t=%d" % time.time(), timeout=30) as r: code = r.read().decode("utf-8")
            m = re.search(r'VERSION = "([\d.]+)"', code)
            if not m or tuple(map(int, m.group(1).split("."))) <= tuple(map(int, VERSION.split("."))): return
            compile(code, "erab_bridge.py", "exec")
            p = os.path.abspath(__file__)
            with open(p + ".new", "w", encoding="utf-8") as f: f.write(code)
            os.chmod(p + ".new", 0o755); os.replace(p + ".new", p)
            log("Mise à jour vers", m.group(1), "— redémarrage"); save_json(STATE_PATH, self.etat); save_json(QUEUE_PATH, self.file)
            os.execv(sys.executable, [sys.executable, p] + sys.argv[1:])
        except Exception as e: log("Mise à jour impossible :", e)
    def alerte(self, did, d, avant):
        """Accumule les changements d'état ; envoyer_alertes() les regroupe en une seule notification par cycle."""
        if self.dry or d["etat"] == "ok" or d["etat"] == avant: return
        if time.time() - self.etat["alerte"].get(did, 0) < 1800: return
        self.etat["alerte"][did] = time.time(); self._al.append(d)
    def envoyer_alertes(self):
        al, self._al = self._al, []
        if not al or not self.d.get("ntfy") or self.cfg.get("alertes", True) is False: return
        lignes = []
        for e in ("alarme", "bas", "hors_ligne"):
            groupes = {}
            for x in al:
                if x["etat"] == e: groupes.setdefault(libelle(x), []).append(x)
            for lab, xs in groupes.items():
                lignes.append("%s (%d) : %s" % (lab, len(xs), ", ".join("%s%s %s" % (x["nom"], " [" + (x.get("ligne") or x.get("emplacement")) + "]" if (x.get("ligne") or x.get("emplacement")) else "", fmt(x)) for x in xs[:12]) + (" …" if len(xs) > 12 else "")))
        sects = sorted(set(x.get("sect", "") for x in al))
        try:
            urllib.request.urlopen(urllib.request.Request("https://ntfy.sh/" + self.d["ntfy"], data="\n".join(lignes).encode("utf-8"),
                headers={"Title": "Erabliere - " + re.sub(r"[^\x20-\x7e]", "", ", ".join(sects)), "Priority": "5" if any(x["etat"] == "alarme" for x in al) else "3", "Tags": "warning"}), timeout=15)
        except Exception as e: log("Alerte non envoyée :", e)
    def cycle(self):
        if not self.dry: self.taches()
        now_ts, iso = time.time(), now_iso(); seuils = self.cfg.get("seuils", {})
        docs, mesures = [], []
        for s, a in self.adapt:
            sid = self.sid(s)
            try:
                lus = a.lire(); self.etat["sources"][sid] = {"ok": True, "derniereLecture": iso, "n": len(lus), "erreur": None}
            except Exception as e:
                lus = []; self.etat["sources"][sid] = dict(self.etat["sources"].get(sid, {}), ok=False, erreur=str(e)[:300]); log("Lecture impossible", sid, "-", e)
            st, pv = self.etat["sources"][sid], self.etat["srcEnv"].get(sid)
            if not pv or pv["ok"] != st["ok"] or now_ts - pv["t"] >= 900:
                docs.append(("capteurs_sources", sid, dict(st, via=s.get("via"), nom=s.get("nom", ""), sect=s.get("sect") or self.sect(), passerelle=self.id, hote=socket.gethostname(), majAt=iso)))
                self.etat["srcEnv"][sid] = {"ok": st["ok"], "t": now_ts}
            src = s.get("marque") or s.get("type") or s.get("via") or "auto"
            for m in lus:
                did = "%s_%s" % (src, m["id"]); mc = self.capt.get(did, {})
                typ = mc.get("type") or m.get("type", "vide")
                val, unit = unite_vers(m["val"], typ, mc.get("unit") or m.get("unit"))
                d = {"nom": mc.get("nom") or m.get("nom") or m["id"], "source": src, "type": typ, "val": val, "unit": unit, "emplacement": mc.get("emplacement", ""),
                     "at": m["at"], "majAt": iso, "sect": mc.get("sect") or s.get("sect") or self.sect(), "ligne": mc.get("ligne", ""), "bat": m.get("bat"), "signal": m.get("signal"), "passerelle": self.id}
                if mc.get("lat") is not None: d["lat"], d["lng"] = mc["lat"], mc.get("lng")
                d["etat"] = etat_de(val, m["at"], typ, dict(seuils, **mc.get("seuils", {})))
                mesures.append((did, d))
                hk = did + "_" + datetime.now(timezone.utc).strftime("%Y%m%d%H"); h = self.etat["heures"].get(did)
                if h and h["k"] != hk:
                    docs.append(("capteurs_log", h["k"], {"capteur": did, "heure": h["heure"], "min": h["min"], "max": h["max"], "moy": round(h["s"] / h["n"], 2), "n": h["n"], "sect": d["sect"]})); h = None
                if not h: h = {"k": hk, "heure": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00:00Z"), "min": val, "max": val, "s": 0, "n": 0}
                h.update(min=min(h["min"], val), max=max(h["max"], val), s=h["s"] + val, n=h["n"] + 1); self.etat["heures"][did] = h
                prev = self.etat["envoye"].get(did)
                dl = self.cfg.get("delta", {}).get(typ) if isinstance(self.cfg.get("delta"), dict) else None
                dl = dl if dl is not None else {"vide": 0.3, "niveau": 1, "temperature": 0.5, "concentration": 0.2, "pression": 0.5, "debit": max(1, abs(val) * 0.05)}.get(typ, 0.0001)
                if not prev or abs(prev["val"] - val) >= dl or prev["etat"] != d["etat"] or now_ts - prev["t"] >= self.cfg.get("forcerMin", 15) * 60:
                    docs.append(("capteurs", did, d)); self.alerte(did, d, prev["etat"] if prev else "ok")
                    self.etat["envoye"][did] = {"val": val, "etat": d["etat"], "t": now_ts}
        if self.dry: return mesures, docs
        self.envoyer_alertes()
        self.file = (self.file + [list(x) for x in docs])[-20000:]
        if self.file:
            try:
                self.fs.commit([tuple(x) for x in self.file]); log("Envoyé %d document(s) · %d capteur(s)" % (len(self.file), len(mesures))); self.file = []
            except Exception as e: log("Envoi reporté (%d en attente) : %s" % (len(self.file), e))
        save_json(QUEUE_PATH, self.file); save_json(STATE_PATH, self.etat)
        return mesures, docs
    def boucle(self):
        log("erab-bridge %s démarré (passerelle %s)" % (VERSION, self.id))
        while True:
            t0 = time.time()
            try: self.cycle()
            except Exception as e: log("Erreur de cycle :", e)
            time.sleep(max(5, self.cfg.get("intervalleSec", 60) - (time.time() - t0)))

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "aide"
    if cmd == "run": Passerelle().boucle()
    elif cmd == "test":
        p = Passerelle(dry=True)
        if not p.adapt: p.auto = detecter(p.sect()); p.construire()
        print("Sources en service :", json.dumps(p.sources_en_service, ensure_ascii=False))
        mes, docs = p.cycle()
        for did, d in mes: print("%-30s %7s %-5s %-10s %-14s %s" % (did, d["val"], d["unit"], d["etat"], d["sect"], d["ligne"]))
        print("%d capteur(s)" % len(mes))
    elif cmd == "detecter": print(json.dumps(detecter("?"), ensure_ascii=False, indent=1))
    elif cmd == "decouvrir":
        out = sys.argv[2] if len(sys.argv) > 2 else "decouverte-%s.txt" % socket.gethostname()
        with open(out, "w", encoding="utf-8") as f: f.write(rapport(detecter("?")))
        print("Rapport :", out)
    elif cmd == "simuler":
        p = Passerelle(); p.adapt = [({"via": "simulateur", "type": "simulateur", "nom": "test", "sect": p.sect()}, Simulateur({"capteurs": 4}))]
        p.cfg["forcerMin"] = 0; p.t_cfg = p.t_det = p.t_maj = time.time(); mes, _ = p.cycle(); print("%d mesures simulées, %d en attente" % (len(mes), len(p.file)))
    elif cmd == "etat":
        e = load_json(STATE_PATH, {}); print("Passerelle :", device_id(), "· en attente :", len(load_json(QUEUE_PATH, [])))
        for k, v in e.get("sources", {}).items(): print(" -", k, "OK" if v.get("ok") else "ERREUR", v.get("derniereLecture", ""), v.get("erreur") or "")
    else: print(__doc__)

if __name__ == "__main__":
    main()
