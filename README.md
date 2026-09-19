# Le Gîte du Lavoir — Bruniquel

Site bilingue (FR/EN) du gîte, généré par un petit script maison (aucune
dépendance npm) et déployé automatiquement sur GitHub Pages à chaque `push`
sur `main`.

```
content/site.json          ← tous les textes du site, dans les deux langues. C'est le CMS.
templates/                 ← la mise en page, en petits fichiers HTML
  page.html                    squelette de la page
  partials/*.html              une section par fichier (hero, chambres, etc.)
assets/
  css/style.css             ← toute la feuille de style
  img/                       ← les photos (vide pour l'instant)
build.js                   ← assemble content + templates → dist/
dist/                       ← généré, jamais modifié à la main (ignoré par git)
.github/workflows/deploy.yml  ← construit et publie le site à chaque push
```

## Modifier un texte (le CMS)

Tout le contenu éditable est dans **`content/site.json`**. Un prix, une phrase,
une distance : c'est là, pas dans le HTML.

Chaque texte traduit est écrit une fois sous la forme :

```json
{ "fr": "Chambres doubles", "en": "Double rooms" }
```

Pour changer une phrase, on édite la valeur `"fr"` ou `"en"` correspondante,
on enregistre, on commit. Pas besoin de toucher au HTML ni au CSS.

### Ajouter une chambre, une adresse à visiter…

Ce sont des listes. Pour ajouter une chambre, copier un bloc existant dans
`rooms.list` et changer ses valeurs :

```json
{
  "count": "1",
  "name": { "fr": "Chambre familiale", "en": "Family room" },
  "description": { "fr": "…", "en": "…" },
  "capacity": { "fr": "4 personnes", "en": "4 people" }
}
```

Même principe pour `around.list` (les lieux à visiter) et `house.facts`
(la liste « Capacité / Location / Cuisine… »).

### Ajouter les photos

Déposer les fichiers dans `assets/img/`. Pour la photo d'accueil, modifier
`hero.image.src` dans `content/site.json` (chemin relatif à `assets/`, donc
`"assets/img/nom-du-fichier.jpg"`) et écrire son texte alternatif dans
`hero.image.alt` (fr/en — décrire ce que montre la photo, pour les personnes
qui utilisent un lecteur d'écran).

Format conseillé : JPEG, 2000 px de large, paysage.

## Construire le site en local

Il faut seulement Node.js (18 ou plus), aucune installation (`npm install`)
n'est nécessaire : le générateur n'a aucune dépendance.

```bash
node build.js
```

Ça écrit `dist/index.html` (français) et `dist/en/index.html` (anglais), et
copie `assets/` dans `dist/assets/`. Pour prévisualiser :

```bash
python3 -m http.server 8080 --directory dist
# puis ouvrir http://localhost:8080/
```

## Comment fonctionne le déploiement

`.github/workflows/deploy.yml` fait tourner `node build.js` sur les serveurs
de GitHub à chaque `push` sur `main`, puis publie le contenu de `dist/` sur
GitHub Pages. Rien à construire ni à déployer à la main.

**Réglage à faire une seule fois**, dans le dépôt GitHub : *Settings → Pages
→ Build and deployment → Source : **GitHub Actions*** (pas « Deploy from a
branch »). Une fois ce réglage fait, chaque `push` sur `main` republie le
site automatiquement ; on suit la progression dans l'onglet *Actions* du
dépôt.

```bash
git clone git@github.com:gitedulavoir/prosite.git
cd prosite
# copier ici tout le contenu de cette archive
git add .
git commit -m "Site bilingue, généré, avec déploiement automatique"
git push origin main
```

Le site sort sur `https://gitedulavoir.github.io/prosite/` en une à deux
minutes (voir l'onglet *Actions* pour suivre le déploiement).

### Domaine personnalisé (ex. gitedulavoir.fr)

Ajouter un fichier `assets/CNAME` (sera copié dans `dist/CNAME` au build)
contenant le nom de domaine, puis chez le registrar : un enregistrement
CNAME `www` vers `gitedulavoir.github.io`, et quatre enregistrements A pour
l'apex vers `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`.

## Comment fonctionne le template

Le moteur de rendu (`build.js`) est volontairement simple, pour rester
lisible sans dépendre d'une bibliothèque tierce. Trois constructions,
utilisées dans les fichiers de `templates/` :

- `{{> partials/nom}}` — inclut `templates/partials/nom.html`
- `{{chemin.vers.valeur}}` — insère une valeur de `content/site.json`
- `{{#each chemin.vers.liste}} … {{this.champ}} … {{/each}}` — répète un
  bloc pour chaque élément d'une liste

Le script résout d'abord la langue (un noeud `{"fr":…, "en":…}` devient une
simple chaîne) avant de passer le contenu au template : les fichiers
`templates/` n'ont donc jamais besoin de savoir dans quelle langue ils sont
rendus, ils sont exécutés une fois par langue.

## À vérifier avant publication

Ces valeurs, dans `content/site.json`, sont plausibles mais à confirmer :

- répartition des 7 chambres (3 doubles, 3 triples, 1 dortoir de 8 → 23 couchages)
- équipements (cheminée, deux fours, lave-vaisselle, Wi-Fi, local à vélos…)
- adresse, e-mail `contact@gitedulavoir.fr` et téléphone (actuellement fictifs)
- distances vers Saint-Antonin, Cordes, Montauban, Albi, Toulouse (approximatives)
- aucun tarif n'est affiché pour l'instant
