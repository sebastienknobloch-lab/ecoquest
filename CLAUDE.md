# EcoQuest — Contexte projet pour Claude Code

> À la racine du repo. Claude Code le lit à chaque session.

## Vision

Application mobile qui gamifie les éco-gestes du quotidien **à l'échelle du foyer** (parents + enfants).

Promesse : « Chaque geste compte, et en famille ça se voit. »

Objectif : créer un engagement écologique **mesurable** (gestes réalisés, CO2 évité estimé, rétention) et **partageable** (cartes d'impact, défis entre foyers).

**Le rappel quotidien est le cœur du produit, pas un accessoire.** Ce qui fait revenir un utilisateur, c'est la notification du jour — pas la taille du catalogue. Toute décision de conception se tranche avec cette phrase.

## Contraintes non négociables

- **Mobile only** : conçue pour écrans 360–430 px, usage à une main. Aucune version desktop.
- **Zéro build côté auteur** : HTML / CSS / JS vanilla (modules ES). Aucun bundler, aucun transpileur, aucun `npm install` à lancer pour travailler. Les dépendances externes s'importent en ES module depuis un CDN (esm.sh / jsDelivr). npm et Gradle n'existent que dans GitHub Actions.
- **Pas de React, pas de Vite, pas de TypeScript.** Décision arrêtée le 13/09/2026 : le gain est nul à cette échelle et le coût casse la contrainte ci-dessus.
- **Le propriétaire code uniquement depuis son téléphone via Claude Code, 15 min/jour.** Chaque tâche tient en une session : petite, testable sur téléphone, sans manipulation technique manuelle. Toute étape qui exige une machine est listée explicitement comme « hors session » dans ROADMAP.md.
- **Données** : localStorage (clé `ecoquest-v1`) jusqu'à la phase 4, puis synchronisation Supabase. Toute nouvelle propriété est ajoutée avec une valeur par défaut dans `loadState()` (migration douce, jamais de perte de données).
- **Chiffres d'impact** : uniquement issus de sources citées (ADEME / Impact CO2), stockés avec un champ `source`. Toujours affichés comme « estimation ». Aucun chiffre ne part en bêta publique avec `a_verifier: true`.
- **Accessibilité** : contraste AA, cibles tactiles ≥ 44 px, textes compréhensibles par un enfant de 10 ans.
- **Gamification positive** : pas de culpabilisation, pas de dark patterns.
- **Économie de la permission notification** : la demande d'autorisation n'arrive **jamais** au premier lancement, mais après la première validation de geste. Contenu toujours spécifique (jamais « N'oublie pas tes gestes ! »), fréquence plafonnée à 1/jour, désactivation en deux taps. On a un seul essai par utilisateur.

## Stack cible

| Couche | Choix |
| --- | --- |
| Front | HTML / CSS / JS vanilla, modules ES |
| Coquille mobile | Capacitor (Android d'abord), `webDir` = racine du repo |
| Notifications locales | `@capacitor/local-notifications` |
| Push serveur | FCM, déclenché par une Edge Function Supabase |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, cron) — offre gratuite |
| Monétisation | AdMob (`@capacitor-community/admob`), puis Play Billing |
| Web statique | GitHub Pages : landing + politique de confidentialité uniquement |
| CI / build | GitHub Actions (tests, génération et signature de l'AAB) |
| Distribution | Google Play (Android). iOS hors périmètre. |

Décisions écartées, à ne pas rouvrir sans raison nouvelle : Vercel (inutile, l'app est empaquetée dans l'APK), Expo / React Native (réécriture pour un gain limité aux widgets et Live Activities iOS), Firebase comme base de données (NoSQL mal adapté aux classements et séries), backend maison.

## Architecture cible

```
/index.html
/manifest.webmanifest
/sw.js
/css/app.css
/js/app.js              → routeur + init
/js/state.js            → loadState / saveState / migrations / export-import
/js/gamification.js     → points, niveaux, séries, badges, impact
/js/notifications.js    → programmation et annulation des rappels
/js/sync.js             → client Supabase (phase 4+)
/js/views/*.js          → un fichier par écran
/data/gestes.json       → catalogue des gestes
/icons/
/tests/*.test.js        → tests logiques, exécutables avec `node --test`
/.github/workflows/     → tests.yml, android.yml
/privacy.html           → politique de confidentialité (exigée par le Play Store)
capacitor.config.json
changelog.md            → en minuscules, c'est le nom réel du fichier
CLAUDE.md
ROADMAP.md
README.md
LICENSE
```

Le dossier `/android` **n'est jamais commité** : il est généré à la volée par GitHub Actions (`npx cap add android`) à chaque build. Ne jamais l'éditer à la main, ne jamais demander à l'auteur de l'ouvrir.

## Méthode de travail (à respecter à chaque session)

1. Avant de coder : résumer en 3 lignes ce qui va changer.
2. Modifications ciblées. Pas de réécriture complète d'un fichier sans nécessité.
3. Toute logique de gamification, de série ou de programmation de notification est couverte par un test dans `/tests`.
4. Fin de session : commit explicite, entrée dans `changelog.md`, **cocher la case correspondante dans `ROADMAP.md`**, puis afficher « Comment tester sur mobile » en 3 étapes maximum.
5. Ne rien écrire dans une section « état actuel » de ce fichier : elle n'existe plus.

## Où en est le projet

**Une seule source de vérité pour l'avancement : les cases à cocher de `ROADMAP.md`.** Le détail de ce qui a été fait est dans `changelog.md`. Ce fichier-ci ne décrit que la cible et les règles.

La session du jour est **toujours la première case non cochée de ROADMAP.md**, dans l'ordre. Une session sautée n'est pas perdue : la file avance uniquement quand un item est terminé.

Sessions 1 à 10 : réalisées. Socle PWA, catalogue de 30 gestes, sélection de 3 gestes/jour, points, 5 niveaux, série avec joker hebdomadaire, 8 badges, impact cumulé avec équivalences, navigation à 4 onglets, tests unitaires par module. Tout le dérivé (niveau, badges, impact) est recalculé à la volée depuis `state` et jamais stocké — conserver cette règle.

## Dette connue, à traiter en priorité

- Plusieurs gestes de `data/gestes.json` portent `a_verifier: true`.
- Les facteurs d'équivalence dans `js/gamification.js` (`EQUIVALENCES_IMPACT` : 193 g/km voiture, 8 g/charge smartphone, 300 g/douche) sont des ordres de grandeur à sourcer précisément.
- Les tests existent mais rien ne les exécute automatiquement.
- Aucun export des données : un vidage du stockage du navigateur détruit tout l'historique de l'utilisateur.
- Repo sans README, sans description, sans licence.
