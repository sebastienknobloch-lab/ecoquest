# Changelog

## 2026-09-12 — Session 5 : Navigation à 4 onglets + catalogue de 30 gestes
- **Navigation** : ajout d'une barre basse fixe à 4 onglets (Aujourd'hui, Défis, Foyer, Profil), cibles tactiles ≥ 44px, `padding-bottom: env(safe-area-inset-bottom)` pour l'encoche iOS, onglet actif distingué par couleur ET fond (pas seulement la couleur, pour l'accessibilité).
- Ajout d'un routeur minimal dans `js/app.js` (aucun framework) et de 4 modules de vue : `js/views/aujourdhui.js`, `js/views/defis.js`, `js/views/foyer.js`, `js/views/profil.js`. Défis/Foyer/Profil affichent un titre et « Bientôt » en attendant leur contenu.
- L'écran existant (gestes + points) devient l'onglet Aujourd'hui, sans régression : mêmes gestes cochables, mêmes points, même état de service worker (déplacé dans l'en-tête, séparé du statut de chargement des gestes).
- `js/state.js` : nouvelle propriété `activeTab` (défaut `"aujourdhui"`) mémorisant l'onglet actif, ajoutée avec valeur par défaut dans `loadState()` (migration douce, aucune perte des points/gestes déjà enregistrés).
- **Catalogue** : `data/gestes.json` étendu de 5 à 30 éco-gestes, répartis en 5 catégories (énergie, alimentation, déplacements, déchets, numérique) de 6 gestes chacune. Chaque geste a désormais `libelle` (remplace `label`), `difficulte` (1 à 3), `points` (barème 10/20/30 selon la difficulté), `co2_evite_g` (entier) et `source` (ADEME ou Impact CO2). Les gestes dont l'ordre de grandeur du CO2 n'est pas sûr portent `"a_verifier": true` — à vérifier avant d'afficher ces chiffres comme définitifs. Les 5 gestes de la session 4 sont conservés avec leurs ids d'origine.
- `js/gamification.js` : `cocherGeste()`/`decocherGeste()` prennent désormais le geste complet et utilisent ses `points` (au lieu d'une valeur fixe de 10), sans double comptage. Ajout de `pointsPourDifficulte()` et du barème `POINTS_PAR_DIFFICULTE`.
- Onglet Aujourd'hui : les gestes sont groupés par catégorie dans des sections repliables (`<details>`), seule la première (Énergie) ouverte par défaut.
- `tests/points.test.js` : mis à jour pour les points liés à la difficulté, et étendu avec des tests de validité du catalogue (30 gestes, ids uniques, champs requis, catégories/difficultés valides, 6 gestes par catégorie).
- `sw.js` : cache renommé `ecoquest-shell-v3` et app shell complété avec `js/views/*.js`, pour forcer le rechargement de la nouvelle version sur les téléphones déjà installés.

## 2026-09-12 — Session 4 : Premier écran de gestes + points
- Ajout de `data/gestes.json` : 5 éco-gestes du quotidien (lumière, douche courte, vélo/marche, gourde réutilisable, tri des déchets), chacun avec un CO2 évité estimé et une `source` citant ADEME ou Impact CO2.
- Ajout de `js/state.js` : `loadState()`/`saveState()` sur `localStorage` (clé `ecoquest-v1`), avec valeurs par défaut fusionnées pour toute nouvelle propriété (migration douce, aucune perte de données existantes).
- Ajout de `js/gamification.js` : `cocherGeste()` (+10 points) et `decocherGeste()` (-10 points), sans double comptage si un geste est déjà coché.
- `index.html` + `js/app.js` réécrits pour afficher un écran unique mobile-first : total de points en en-tête, liste des 5 gestes du jour avec case à cocher (cible tactile ≥ 44px), état persistant via `state.js`.
- `css/app.css` : styles de l'en-tête et de la liste de gestes, cases à cocher agrandies pour un usage à une main.
- `sw.js` : cache de l'app shell mis à jour (`js/state.js`, `js/gamification.js`, `data/gestes.json`), nom de cache passé à `ecoquest-shell-v2` pour forcer le renouvellement.
- Ajout de `tests/points.test.js` (exécutable avec `node tests/points.test.js`) : vérifie l'attribution des points, l'absence de double comptage et le retrait des points au décochage.
- Ajout de `package.json` minimal (`"type": "module"`) pour que les tests `import`/`export` s'exécutent avec `node`, sans introduire d'étape de build.

## 2026-09-12 — Session 3 : Câblage GitHub Pages réparé
- Le site était en ligne mais mal câblé : `app.css` et les icônes étaient restés à la racine du repo, alors qu'`index.html` référençait déjà `css/app.css`, `icons/icon-192.png` et `icons/icon-512.png` → CSS absent, page bloquée sur « Chargement… », app non installable.
- `app.css` déplacé vers `css/app.css`, `icon-192.png` et `icon-512.png` déplacés vers `icons/`.
- Ajout de `js/app.js` : enregistrement du service worker et remplacement du texte « Chargement… » par l'état d'installation (installée / prête / hors-ligne indisponible).
- Ajout de `manifest.webmanifest` (nom EcoQuest, `display: standalone`, thème vert `#2e7d32`, icônes 192 et 512).
- Ajout de `sw.js` : cache-first minimal de l'app shell (`index.html`, `css/app.css`, `js/app.js`, `manifest.webmanifest`, icônes) avec repli hors-ligne sur `index.html`.
- `index.html` vérifié : les chemins qu'il référence (`css/app.css`, `js/app.js`, `manifest.webmanifest`, `icons/icon-192.png`) étaient déjà corrects, aucune modification nécessaire.

## 2026-09-12 — Session 2 : Squelette PWA installable
- Ajout de l'écran d'accueil mobile-first (`index.html`) avec le message "Chaque geste compte, et en famille ça se voit."
- Ajout de `manifest.webmanifest` (nom, icônes 192/512, mode standalone, thème vert éco) pour rendre l'app installable.
- Ajout de `sw.js` : service worker minimal (cache-first) qui met en cache l'app shell pour un fonctionnement hors-ligne basique.
- Ajout de `css/app.css` (mobile-first, cibles tactiles ≥ 44px, contraste AA) et `js/app.js` (enregistrement du service worker, détection du mode installé).
- Icônes placeholder générées (`icons/icon-192.png`, `icons/icon-512.png`).
- Point de vigilance reporté à Sébastien : GitHub Pages ne semblait pas encore activé sur `main` au moment de cette session — à vérifier dans Settings → Pages si l'URL de test ne répond pas.
