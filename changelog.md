# Changelog

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
