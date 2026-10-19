import re, os, glob
from collections import defaultdict
t = open('public/resources/index.html', encoding='utf-8').read()
# tolerant: attribute order / extra classes / case all OK
pairs = []
for m in re.finditer(r'<a\b([^>]*class="card"[^>]*)>(.*?)</a>', t, re.S | re.I):
    attrs, inner = m.group(1), m.group(2)
    h = re.search(r'href="([^"]+)"', attrs)
    ti = re.search(r'<h3[^>]*>(.*?)</h3>', inner, re.S)
    if h:
        title = re.sub(r'<[^>]+>', '', ti.group(1)).strip() if ti else '(no h3)'
        pairs.append((h.group(1), title))
print("TOTAL CARDS:", len(pairs))
norm = lambda s: re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s.lower())).strip()
# (a) same href in >1 card  -> a card was written twice
by_href = defaultdict(list)
for h, ti in pairs: by_href[h].append(ti)
print("\n=== DUPLICATE HREFS (same file linked by >1 card) ===")
for h, tis in sorted(by_href.items()):
    if len(tis) > 1: print(f"[{len(tis)}x] {h}")
# (b) same title, different href -> true content dup
by_title = defaultdict(list)
for h, ti in pairs: by_title[norm(ti)].append((h, ti))
print("\n=== DUPLICATE TITLES (same title, >1 card) ===")
for k, v in sorted(by_title.items()):
    if len(v) > 1:
        print(f"[{len(v)}x] {v[0][1][:70]}")
        for h, _ in v: print("      ", h)
# (c) near-dup clusters (first 4 words match, distinct titles) -> siblings, judge by eye
coarse = defaultdict(set)
for h, ti in pairs: coarse[' '.join(norm(ti).split()[:4])].add(ti)
print("\n=== NEAR-DUP CLUSTERS (first 4 words match, >1 distinct title) ===")
for k, v in sorted(coarse.items()):
    if len(v) > 1:
        print(f"-- {k} --")
        for ti in sorted(v): print("     ", ti)
# (d) orphan files on disk, not linked by any card
files = {os.path.basename(f) for f in glob.glob('public/resources/*.html')}
hrefs = {h.split('/')[-1] for h, _ in pairs}
print("\n=== ORPHAN FILES (on disk, no card) ===")
for f in sorted(files - hrefs - {'index.html'}): print("     ", f)
# (e) broken cards -> missing file
print("\n=== BROKEN CARDS (href, no file) ===")
for h, _ in pairs:
    fn = h.split('/')[-1]
    if fn and fn not in files: print("     ", h)
# (f) sitemap vs cards
sm = open('public/sitemap.xml', encoding='utf-8').read()
locs = {l.split('/')[-1] for l in re.findall(r'<loc>[^<]*/resources/([^<]+)</loc>', sm)}
print("\n=== SITEMAP DIFFS ===")
print("  in sitemap, no card:", sorted(locs - hrefs))
print("  card, not in sitemap:", sorted(hrefs - locs - {'index.html'}))
