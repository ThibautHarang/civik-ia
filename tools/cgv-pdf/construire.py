#!/usr/bin/env python3
"""Tire le PDF d'une version des CGV de Civik-ia, a joindre aux devis (reglement (UE) 2023/2854, article 25.1).

Reprend la mise en page des annexes du devis de Tarare (02-Demos/tarare/.../outils/construire-annexes.py),
avec deux corrections : le titre du document est propre (celui du 16/10 affichait « <re.Match object... »)
et les liens du bandeau de version disparaissent du papier.

Usage : python3 tools/cgv-pdf/construire.py [AAAA-MM-JJ]
  Lit legal/conditions-generales-vente.html, verifie que son bandeau porte la date demandee,
  ecrit legal/conditions-generales-vente-AAAA-MM-JJ.pdf (a cote de la page, comme l'archive du 16/10).
  Sans date, prend celle du bandeau.
A chaque nouvelle version des CGV : la page d'abord, puis ce PDF, dans le meme commit.
"""
import html
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ICI = Path(__file__).resolve().parent
SITE = ICI.parent.parent
PAGE = SITE / "legal" / "conditions-generales-vente.html"
LOGO = SITE / "assets" / "logo-civik-ia-seul.png"

MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]

STYLE = """
@page { size: A4; margin: 18mm 20mm 20mm; }
:root{--navy:#000091;--trait:#2b6fd6;--papier:#fbf9f4;--encre:#20304a;--attenue:#5f6879;
  --filet:rgba(32,48,74,.16);--f-titre:"Poppins",system-ui,sans-serif;--f-texte:"Inter",system-ui,sans-serif}
*{box-sizing:border-box}
html{background:var(--papier);-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;color:var(--encre);font-family:var(--f-texte);font-size:8.6pt;line-height:1.42;
  -webkit-font-smoothing:antialiased;font-kerning:normal}
p,h1,h2,h3,ul,ol{margin:0;padding:0}
.haut{display:flex;justify-content:space-between;align-items:center;padding-bottom:4mm;
  border-bottom:.5pt solid var(--filet);margin-bottom:6mm}
.marque{display:inline-flex;align-items:center;gap:2mm}
.marque img{height:7mm;width:auto;display:block}
.marque .mot{font-family:var(--f-titre);font-weight:700;font-size:12pt;letter-spacing:-.02em;color:var(--navy);line-height:1}
.marque .ia{color:var(--trait)}
.haut .etiquette{font-weight:600;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:var(--attenue)}
h1{font-family:var(--f-titre);font-weight:600;font-size:15pt;line-height:1.25;color:var(--navy)}
.sous-titre{margin-top:1.4mm;color:var(--attenue);font-size:9.5pt}
h2{font-family:var(--f-titre);font-weight:600;font-size:10pt;line-height:1.3;color:var(--navy);
  margin-top:4.6mm;break-after:avoid;page-break-after:avoid}
h3{font-weight:600;font-size:8.6pt;margin-top:2.6mm;break-after:avoid;page-break-after:avoid}
p{margin-top:1.5mm;text-wrap:pretty}
h2+p,h3+p,h2+ul,h3+ul,h2+ol,h3+ol{margin-top:1.6mm}
ul,ol{margin-top:1.6mm;list-style:none}
li{position:relative;padding-left:4.6mm;margin-top:1.1mm;text-wrap:pretty;break-inside:avoid}
ul>li::before{content:"";position:absolute;left:1mm;top:.62em;width:.95mm;height:.95mm;border-radius:50%;background:rgba(32,48,74,.42)}
ol{counter-reset:n}
ol>li{counter-increment:n}
ol>li::before{content:counter(n) ".";position:absolute;left:0;color:var(--attenue);font-variant-numeric:tabular-nums}
b,strong{font-weight:600}
.ref{color:var(--attenue);font-size:7.8pt}
.encadre{margin-top:3mm;padding:3mm 4mm;background:rgba(0,0,145,.035);border-radius:1.5mm;break-inside:avoid}
.colonnes{column-count:2;column-gap:8mm;margin-top:5mm}
.colonnes>:first-child{margin-top:0}
"""

TETE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>{titre}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<style>{style}</style></head><body>
<div class="haut"><div class="marque"><img src="logo.png" alt="" width="72" height="72"><span class="mot">Civik-<span class="ia">ia</span></span></div><p class="etiquette">Conditions générales de vente</p></div>
"""

NBSP = chr(160)


def typo(t: str) -> str:
    """Espaces insecables de la typographie francaise, sur le papier seulement (la page n'en porte aucune)."""
    t = t.replace("« ", "«" + NBSP).replace(" »", NBSP + "»")
    t = re.sub(r" ([:;?!%])", NBSP + r"\1", t)
    t = re.sub(r"(\d) (\d{3})(?!\d)", r"\1" + NBSP + r"\2", t)
    t = re.sub(r"(\d) (€|euros|h\b|mois|ans?\b|jours?\b|heures?\b|points?\b)", r"\1" + NBSP + r"\2", t)
    t = t.replace("€ HT", "€" + NBSP + "HT")
    t = re.sub(r"\b(article|articles|n°) (\d)", r"\1" + NBSP + r"\2", t)
    return t


def date_longue(iso: str) -> str:
    a, m, j = (int(x) for x in iso.split("-"))
    return f"{j} {MOIS[m - 1]} {a}"


def date_du_bandeau(page: str) -> str:
    m = re.search(r"Version du (\d{1,2}) (\w+) (\d{4})", page)
    if not m:
        sys.exit("bandeau de version introuvable dans " + str(PAGE))
    return f"{m.group(3)}-{MOIS.index(m.group(2)) + 1:02d}-{int(m.group(1)):02d}"


def construire(iso: str, dossier: Path) -> Path:
    t = PAGE.read_text(encoding="utf-8")
    if date_du_bandeau(t) != iso:
        sys.exit(f"le bandeau de la page porte {date_du_bandeau(t)}, pas {iso}")
    main = re.search(r'<main class="legal-content">(.*?)</main>', t, re.S)
    h1 = re.search(r'<header class="legal-header">\s*<h1>(.*?)</h1>', t, re.S)
    if not main or not h1:
        sys.exit("contenu des CGV introuvable dans " + str(PAGE))
    c = main.group(1)
    c = re.sub(r'<nav class="toc".*?</nav>', "", c, flags=re.S)
    c = re.sub(r"<a [^>]*>(.*?)</a>", r"\1", c, flags=re.S)
    c = c.replace('class="legal-ref"', 'class="ref"')
    c = re.sub(r'class="(info-box|warning-box)"', 'class="encadre"', c)
    c = re.sub(r'<h2 id="a\d+">', "<h2>", c)
    c = re.sub(r'\s*style="[^"]*"', "", c)
    longue = date_longue(iso)
    titre = f"Conditions générales de vente de Civik-ia, version du {longue}"
    entete = (f"<h1>{h1.group(1).strip()}</h1>"
              f'<p class="sous-titre">Version du {longue}, applicable aux commandes signées à compter de cette date.</p>')
    page = (TETE.format(titre=html.escape(titre), style=STYLE) + typo(entete)
            + '<div class="colonnes">' + typo(c) + "</div>\n</body></html>\n")
    cible = dossier / "cgv.html"
    cible.write_text(page, encoding="utf-8")
    shutil.copyfile(LOGO, dossier / "logo.png")
    return cible


if __name__ == "__main__":
    texte = PAGE.read_text(encoding="utf-8")
    iso = sys.argv[1] if len(sys.argv) > 1 else date_du_bandeau(texte)
    sortie = SITE / "legal" / f"conditions-generales-vente-{iso}.pdf"
    with tempfile.TemporaryDirectory() as tmp:
        source = construire(iso, Path(tmp))
        pied = f"Civik-ia, conditions générales de vente, version du {date_longue(iso)}"
        subprocess.run(["node", str(ICI / "imprimer.mjs"), str(source), str(sortie), pied], check=True)
    print(sortie)
