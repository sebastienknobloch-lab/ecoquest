# EcoQuest — Contexte projet pour Claude Code

> Nom de code provisoire. À placer à la racine du repo. Claude Code le lit à chaque session.

## Vision
Application mobile qui gamifie les éco-gestes du quotidien **à l'échelle du foyer** (parents + enfants).
Promesse : "Chaque geste compte, et en famille ça se voit."
Objectif : créer un engagement écologique **mesurable** (gestes réalisés, CO2 évité estimé, rétention) et **partageable** (cartes d'impact, défis entre foyers).

## Contraintes non négociables
- **Mobile only** : PWA installable, conçue pour écrans 360–430 px, usage à une main. Aucune version desktop.
- **Zéro build** : HTML / CSS / JS vanilla (modules ES). Déploiement GitHub Pages depuis `main`.
- **Le propriétaire code uniquement depuis son téléphone via Claude Code, 15 min/jour.** Chaque tâche doit tenir en une session : petite, testable sur téléphone, sans manipulation technique manuelle.
- **Données** : localStorage en phases 1–2, clé `ecoquest-v1`. Toute nouvelle propriété est ajoutée avec une valeur par défaut dans `loadState()` (migration douce, jamais de perte de données).
- **Chiffres d'impact** : uniquement issus de sources citées (ADEME / Impact CO2), stockés dans `data/gestes.json` avec un champ `source`. Toujours affichés comme "estimation".
- **Accessibilité** : contraste AA, cibles tactiles ≥ 44 px, textes compréhensibles par un enfant de 10 ans.
- **Gamification positive** : pas de culpabilisation, pas de dark patterns, notifications sobres et désactivables.

## Architecture cible
```
/index.html
/manifest.webmanifest
/sw.js
/css/app.css
/js/app.js            → routeur + init
/js/state.js          → loadState / saveState / migrations
/js/gamification.js   → points, niveaux, séries, badges
/js/views/*.js        → un fichier par écran
/data/gestes.json     → catalogue des gestes
/icons/
/tests/*.test.js      → tests logiques exécutables avec node
CHANGELOG.md
```

## Méthode de travail (à respecter à chaque session)
1. Avant de coder : résumer en 3 lignes ce qui va changer.
2. Modifications ciblées. Pas de réécriture complète d'un fichier sans nécessité.
3. Toute logique de gamification est couverte par un test dans `/tests`.
4. Fin de session : commit explicite, mise à jour de `CHANGELOG.md`, puis afficher **"Comment tester sur mobile"** en 3 étapes maximum.
5. Mettre à jour la section "État actuel" ci-dessous.

## État actuel
- Session 1 : repo initialisé, `CLAUDE.md` déposé (fait hors Claude Code).
- Session 2 : squelette PWA créé — écran d'accueil mobile-first, `manifest.webmanifest`, `sw.js`, `css/app.css`, `js/app.js`, icônes placeholder. Voir `changelog.md`.
- À vérifier par Sébastien : activation de GitHub Pages sur `main` (Settings → Pages) si l'URL de test ne répond pas.
