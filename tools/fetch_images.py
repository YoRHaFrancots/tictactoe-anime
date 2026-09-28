"""Baja las imágenes de personajes y animes desde AniList y genera js/images.js.

Uso:  python tools/fetch_images.py
Solo busca lo que falta, así que se puede volver a correr después de agregar personajes.
"""
import json
import re
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "js" / "data.js"
OUT = ROOT / "js" / "images.js"
API = "https://graphql.anilist.co"
BATCH = 8

CHAR_FIELDS = "name { full } image { large } media(perPage: 15) { nodes { title { romaji english } } }"


def gql(query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    for _ in range(6):
        req = urllib.request.Request(API, data=body, headers={
            "Content-Type": "application/json", "Accept": "application/json",
            "User-Agent": "TicTacToeAnime/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                remaining = int(r.headers.get("X-RateLimit-Remaining", "10"))
                data = json.load(r).get("data")
            if remaining < 3:
                time.sleep(20)
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("Retry-After", "60"))
                print(f"  límite de AniList, esperando {wait}s", flush=True)
                time.sleep(wait + 1)
            else:
                print(f"  error HTTP {e.code}", flush=True)
                time.sleep(3)
        except Exception as e:
            print(f"  error {e}", flush=True)
            time.sleep(3)
    return None


def squash(s):
    s = unicodedata.normalize("NFD", s)
    return re.sub(r"[^a-z0-9]", "", "".join(ch for ch in s if not unicodedata.combining(ch)).lower())


def parse_data():
    text = DATA.read_text(encoding="utf-8")
    animes = []
    for m in re.finditer(r"A\('(\w+)',\s*'((?:[^'\\]|\\.)*)',\s*'([^']*)',\s*`([^`]*)`\)", text):
        aid, display, search, body = m.groups()
        chars = []
        for line in body.splitlines():
            if not line.strip():
                continue
            parts = [p.strip() for p in line.split("|")]
            aliases = [a.strip() for a in parts[1].split(";")] if len(parts) > 1 and parts[1] else []
            chars.append((parts[0], aliases))
        keys = {squash(search), squash(display.replace("\\u2019", ""))}
        animes.append((aid, search, keys, chars))
    return animes


def load_existing():
    if not OUT.exists():
        return {}, {}
    text = OUT.read_text(encoding="utf-8")

    def grab(name):
        m = re.search(rf"window\.{name} = (\{{.*?\}});", text, re.S)
        return json.loads(m.group(1)) if m else {}
    return grab("CHAR_IMAGES"), grab("ANIME_IMAGES")


def save(chars, animes):
    OUT.write_text(
        "// Generado por tools/fetch_images.py — imágenes de AniList.\n"
        f"window.CHAR_IMAGES = {json.dumps(chars, ensure_ascii=False, indent=0, sort_keys=True)};\n"
        f"window.ANIME_IMAGES = {json.dumps(animes, ensure_ascii=False, indent=0, sort_keys=True)};\n",
        encoding="utf-8")


def clean_name(name):
    return re.sub(r"\s*\(.*?\)", "", name).strip()


def pick(results, keys):
    for c in results or []:
        titles = [squash(n["title"].get(k) or "") for n in c["media"]["nodes"] for k in ("romaji", "english")]
        if any(k in t for k in keys for t in titles):
            return c["image"]["large"]
    return None


def run_batch(jobs):
    """jobs: lista de (cid, texto_a_buscar, keys). Devuelve {cid: url}."""
    parts = [f'q{i}: Page(perPage: 6) {{ characters(search: {json.dumps(s)}) {{ {CHAR_FIELDS} }} }}'
             for i, (_, s, _) in enumerate(jobs)]
    data = gql("query { " + " ".join(parts) + " }") or {}
    found = {}
    for i, (cid, _, keys) in enumerate(jobs):
        url = pick((data.get(f"q{i}") or {}).get("characters"), keys)
        if url:
            found[cid] = url
    return found


def main():
    chars, anime_imgs = load_existing()
    animes = parse_data()

    missing_anime = [(aid, search) for aid, search, _, _ in animes if aid not in anime_imgs]
    for i in range(0, len(missing_anime), BATCH):
        group = missing_anime[i:i + BATCH]
        q = " ".join(f'a{j}: Media(search: {json.dumps(s)}, type: ANIME, sort: POPULARITY_DESC) {{ coverImage {{ large }} }}'
                     for j, (_, s) in enumerate(group))
        data = gql("query { " + q + " }") or {}
        for j, (aid, _) in enumerate(group):
            m = data.get(f"a{j}")
            if m:
                anime_imgs[aid] = m["coverImage"]["large"]
    print(f"Animes con portada: {len(anime_imgs)}/{len(animes)}", flush=True)

    # Cada personaje tiene una lista de variantes: nombre, nombre sin paréntesis, alias...
    pending = {}
    for aid, _, keys, clist in animes:
        for name, aliases in clist:
            cid = f"{aid}:{name}"
            if cid not in chars:
                variants = list(dict.fromkeys([clean_name(name)] + aliases))
                pending[cid] = (variants, keys)

    attempt = 0
    while pending and attempt < 4:
        jobs = [(cid, v[attempt], keys) for cid, (v, keys) in pending.items() if attempt < len(v)]
        if not jobs:
            break
        print(f"Pasada {attempt + 1}: {len(jobs)} búsquedas", flush=True)
        for i in range(0, len(jobs), BATCH):
            found = run_batch(jobs[i:i + BATCH])
            chars.update(found)
            for cid in found:
                pending.pop(cid, None)
            print(f"  {min(i + BATCH, len(jobs))}/{len(jobs)}", flush=True)
            time.sleep(2.2)
        attempt += 1

    save(chars, anime_imgs)
    print(f"Listo: {len(chars)} personajes con imagen.")
    if pending:
        print("Sin imagen:", ", ".join(sorted(pending)))


if __name__ == "__main__":
    main()
