# Changelog

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
