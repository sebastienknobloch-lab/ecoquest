# Changelog

## 2026-09-12 — Session 2 : Squelette PWA installable
- Ajout de l'écran d'accueil mobile-first (`index.html`) avec le message "Chaque geste compte, et en famille ça se voit."
- Ajout de `manifest.webmanifest` (nom, icônes 192/512, mode standalone, thème vert éco) pour rendre l'app installable.
- Ajout de `sw.js` : service worker minimal (cache-first) qui met en cache l'app shell pour un fonctionnement hors-ligne basique.
- Ajout de `css/app.css` (mobile-first, cibles tactiles ≥ 44px, contraste AA) et `js/app.js` (enregistrement du service worker, détection du mode installé).
- Icônes placeholder générées (`icons/icon-192.png`, `icons/icon-512.png`).
- Point de vigilance reporté à Sébastien : GitHub Pages ne semblait pas encore activé sur `main` au moment de cette session — à vérifier dans Settings → Pages si l'URL de test ne répond pas.
