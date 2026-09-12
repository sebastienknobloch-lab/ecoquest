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
- Session 3 : correction du câblage GitHub Pages — `app.css` et les icônes traînaient à la racine au lieu de `css/` et `icons/`, et `js/app.js`, `manifest.webmanifest`, `sw.js` n'existaient pas encore alors qu'`index.html` les référençait déjà. Fichiers déplacés/créés à leur place, page testée conforme à l'architecture cible. Voir `changelog.md`.
- Session 4 : premier écran de gestes. `data/gestes.json` (5 gestes sourcés ADEME/Impact CO2), `js/state.js` (localStorage `ecoquest-v1`, migration douce), `js/gamification.js` (+10 points par geste coché, retrait au décochage), écran unique avec total de points + liste de gestes cochables (cibles ≥ 44px), test `tests/points.test.js`. Voir `changelog.md`.
- Session 5 : navigation basse à 4 onglets (Aujourd'hui, Défis, Foyer, Profil) avec routeur minimal `js/app.js` + `js/views/*.js` conformes à l'architecture cible ; `data/gestes.json` étendu à 30 gestes (5 catégories x 6, champs `libelle`/`difficulte`/`points`/`co2_evite_g`/`source`, `a_verifier` sur les ordres de grandeur incertains) ; `js/gamification.js` lit désormais les points du geste (barème 10/20/30 selon difficulté) ; onglet Aujourd'hui groupé par catégorie en sections repliables ; `sw.js` en `ecoquest-shell-v3`. Voir `changelog.md`.
- Session 6 : onglet Aujourd'hui remplacé par « Tes 3 gestes du jour », sélection déterministe par date (`selectionDuJour()` dans `js/gamification.js`, 1 geste dans chacune de 3 catégories différentes, stable dans la journée, change à minuit) ; `js/state.js` stocke désormais les gestes cochés par date dans `gestesCochesParDate` (migration douce depuis l'ancien `completedToday`, aucune perte de points) ; catalogue complet des 30 gestes toujours accessible en section repliée en bas d'écran ; micro-animation de validation au tap, désactivée si `prefers-reduced-motion` ; tests `tests/points.test.js` (mis à jour) et `tests/selection.test.js` (nouveau) ; `sw.js` en `ecoquest-shell-v4`. Voir `changelog.md`.
- Session 7 : 5 niveaux de progression. `calculerNiveau(points)` dans `js/gamification.js` (seuils 0/50/150/300/500, niveau + points restants + pourcentage), calculé à la volée depuis `state.points` — jamais stocké dans l'état, pas de double comptage. Barre de progression visuelle + niveau affiché en haut de l'onglet Aujourd'hui (`js/views/aujourdhui.js`), mise à jour à chaque geste coché/décoché. Tests `tests/niveaux.test.js` (nouveau). `sw.js` en `ecoquest-shell-v5`. Voir `changelog.md`.
- À vérifier par Sébastien : activation de GitHub Pages sur `main` (Settings → Pages) si l'URL de test ne répond pas ; les gestes marqués `"a_verifier": true` dans `data/gestes.json` ont des ordres de grandeur de CO2 estimés à affiner avec une source ADEME/Impact CO2 précise.
