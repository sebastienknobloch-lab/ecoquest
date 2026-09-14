# Changelog

## 2026-09-14 — Session 12 : Console de debug embarquée (Eruda)
- Sans Mac ni câble USB, il n'y avait aucun moyen de voir ce qui se passe réellement dans la WebView Android une fois l'app empaquetée — dette listée dans `ROADMAP.md` (S12).
- Ajout de `js/debug.js` : `activerConsoleDebug()` charge [Eruda](https://eruda.liriliri.io/) via `import()` dynamique depuis `https://esm.sh/eruda@3` (aucune dépendance ajoutée au repo, conforme à la contrainte zéro build) puis appelle `eruda.init()`. Si le CDN est injoignable (hors-ligne), l'échec est silencieux et n'empêche jamais l'app de fonctionner normalement.
- Deux déclencheurs, jamais actifs par défaut : le paramètre d'URL `?debug=1` (`debugDemandeParUrl()`, vérifié une fois au démarrage dans `js/app.js`), ou 5 taps rapprochés (moins de 2 s entre chaque) sur le numéro de version affiché en bas de l'écran Profil. La logique de comptage des taps (`creerCompteurTaps()`) est isolée de tout accès DOM pour rester testable.
- Ajout de `js/version.js` (`APP_VERSION`, constante à faire évoluer manuellement) et d'un nouveau footer discret sur l'écran Profil (`js/views/profil.js`, classe `.profil-version` dans `css/app.css`) affichant « EcoQuest v1.0.0 ». C'est la première fois qu'un numéro de version est visible dans l'app.
- Ajout de `tests/debug.test.js` : `debugActiveDepuisRecherche()` (seul `?debug=1` active, tout le reste n'active rien) et `creerCompteurTaps()` (5 taps rapprochés déclenchent une seule fois, réarmement après une pause trop longue ou après un déclenchement, seuil/délai personnalisables).
- `sw.js` : `js/debug.js` et `js/version.js` ajoutés à l'app shell mis en cache ; cache renommé `ecoquest-shell-v12` pour forcer la mise à jour sur les téléphones déjà installés.
- `ROADMAP.md` : case **S12** cochée.

## 2026-09-13 — Correction : la liste des catégories du catalogue n'était plus dérivée des données
- La liste des 5 catégories existait en trois exemplaires : la constante `CATEGORIES` de `js/views/aujourdhui.js`, les données de `data/gestes.json`, et `CATEGORIES_VALIDES` dans `tests/points.test.js`. `afficherCatalogueComplet()` itérait sur la constante de la vue : une catégorie présente dans les données mais absente de cette liste aurait disparu silencieusement du catalogue complet, alors que `selectionDuJour()` l'aurait quand même proposée dans les 3 gestes du jour.
- `js/views/aujourdhui.js` : `afficherCatalogueComplet()` construit désormais la liste des catégories à afficher directement à partir des gestes chargés (ordre de première apparition), au lieu d'une liste figée côté vue. La constante devient `LIBELLES_CATEGORIES` (exportée), une simple table d'étiquettes lisibles (emoji + libellé) utilisée via `libelleCategorie()`, avec repli sur l'identifiant brut si une catégorie inconnue apparaît dans les données.
- `tests/points.test.js` : ajout d'une assertion qui échoue si une catégorie du catalogue n'a pas d'étiquette définie dans `LIBELLES_CATEGORIES`.
- `sw.js` : cache renommé `ecoquest-shell-v11` pour forcer la mise à jour sur les téléphones déjà installés.
- Aucun changement d'état, aucun nouveau fichier.

## 2026-09-13 — Correction : cache du service worker non renouvelé (à nouveau)
- Le correctif précédent (« les catégories du catalogue se refermaient à chaque geste coché ») modifiait `js/views/aujourdhui.js` sans renommer le cache dans `sw.js` (resté à `ecoquest-shell-v9`) — même oubli déjà survenu et corrigé une fois dans ce projet (voir l'entrée « cache du service worker non renouvelé » plus bas), qui aurait dû être vérifié systématiquement à chaque édition de fichier JS. Conséquence : la correction était bien fusionnée sur `main`, mais toute PWA déjà installée continuait de servir l'ancien `aujourdhui.js` en cache, donc les catégories continuaient à se refermer.
- `sw.js` : cache renommé `ecoquest-shell-v10` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-13 — Correction : les catégories du catalogue se refermaient à chaque geste coché
- Dans l'onglet Aujourd'hui, cocher un geste depuis le catalogue complet (`js/views/aujourdhui.js`) appelait `basculerGeste()` puis `afficherTout()`, qui vidait `categoriesEl` et recréait tous les `<details>` de catégorie — perdant leur attribut `open` à chaque fois. Résultat : toute catégorie dépliée se refermait dès qu'on cochait un geste à l'intérieur.
- `afficherCatalogueComplet()` relève désormais, avant de vider `categoriesEl`, les ids des catégories actuellement ouvertes (`dataset.categorieId`, ajouté sur chaque `<details class="categorie">`), et repose `open` sur les mêmes après reconstruction.
- Cela permet aussi de rétablir le comportement annoncé en session 5 et disparu depuis : au tout premier affichage (`categoriesEl` encore vide), la catégorie Énergie s'ouvre par défaut, les autres restent fermées.
- Aucun changement de structure de l'état ni de la logique de points.

## 2026-09-13 — Correction : contraste insuffisant sur les badges verrouillés
- L'écran Profil (session 9) affichait le texte des badges verrouillés en `#8a8a8a` sur fond `#eceae4`, soit 2,87:1, déjà sous le minimum AA de 4,5:1 — et la règle `opacity: 0.75` posée sur `.badge-carte--verrouille` faisait tomber le rendu réel à 2,10:1. L'entrée de changelog de la session 9 affirmait à tort un « contraste AA » respecté ; corrigée ci-dessous dans son entrée d'origine.
- `css/app.css` : suppression de `opacity: 0.75` sur `.badge-carte--verrouille`, et texte de `.badge-carte--verrouille .badge-libelle`/`.badge-description` assombri de `#8a8a8a` à `#5a5a5a` (5,74:1 sur `#eceae4`, au-dessus du minimum AA). La distinction visuelle obtenu/verrouillé (fond grisé + cadenas) est inchangée.

## 2026-09-13 — Session 11 : CI des tests (`.github/workflows/tests.yml`)
- Les 7 fichiers de `tests/` existaient mais rien ne les exécutait automatiquement (dette connue listée dans `CLAUDE.md`) : un test cassé pouvait être fusionné sur `main` sans que personne ne le remarque.
- Ajout de `.github/workflows/tests.yml` : à chaque push sur `main` et sur chaque pull request, un job GitHub Actions installe Node 22 puis exécute `node --test tests/*.test.js` (pas de `npm install` ni `npm ci` : le projet n'a aucune dépendance). Le job échoue visiblement si un test échoue, puisque `node --test` retourne un code de sortie non nul dans ce cas.
- Commande volontairement `node --test tests/*.test.js` et non `node --test tests/` : sur Node 22, cette dernière forme tente d'exécuter `tests/` comme un module et échoue avec « Cannot find module .../tests ».
- `ROADMAP.md` : case **S11** cochée, et son prompt corrigé pour citer la bonne commande (`node --test tests/*.test.js` au lieu de `node --test tests/`).

## 2026-09-13 — Tests pour `js/state.js`
- `js/state.js` était le seul module du projet sans test, alors que `loadState()` porte trois migrations douces (rattachement de `completedToday` à `gestesCochesParDate`, valeurs par défaut pour `streak`/`joker`, déduction de `joker.dejaUtilise`) qui protègent les données déjà enregistrées par l'utilisateur.
- Ajout de `tests/state.test.js` : un faux `localStorage` est installé sur `globalThis` avant d'importer `js/state.js`. Couvre le stockage vide, un JSON corrompu, un `localStorage` qui lève une exception à la lecture, chacune des trois migrations (isolément et sans écraser les champs déjà présents), et un aller-retour `saveState` puis `loadState`.
- Aucune modification de `js/state.js` : les 8 cas passent tels quels, aucun défaut réel constaté pendant l'écriture des tests.

## 2026-09-13 — Correction : cache du service worker non renouvelé
- La session précédente (« Rendre visible le statut « a_verifier » des gestes ») modifiait `js/views/aujourdhui.js` et `js/views/profil.js` sans renommer le cache dans `sw.js` (resté à `ecoquest-shell-v8`) — oubli par rapport à la pratique systématique des sessions précédentes. Conséquence : le changement était bien fusionné sur `main`, mais toute PWA déjà installée continuait de servir indéfiniment les anciens fichiers JS en cache, sans jamais voir « ordre de grandeur à confirmer ».
- `sw.js` : cache renommé `ecoquest-shell-v9` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-13 — Rendre visible le statut « a_verifier » des gestes
- 25 des 30 gestes de `data/gestes.json` portent `"a_verifier": true`, mais ce champ n'était lu nulle part : leur chiffre CO2 s'affichait exactement comme celui des gestes sourcés définitivement, sans distinction pour l'utilisateur. Aucune valeur ni source du catalogue n'a été modifiée — seul l'affichage change.
- Onglet Aujourd'hui (`js/views/aujourdhui.js`) : quand `geste.a_verifier` est vrai, le détail sous chaque geste affiche désormais « ordre de grandeur à confirmer — [source] » au lieu de « ≈ X g CO2 évités (estimation) — [source] », pour ne pas présenter un chiffre non sourcé précisément avec la même assurance qu'un chiffre vérifié.
- `js/gamification.js` : ajout de `nombreGestesAVerifier(état, gestes)`, qui compte les gestes validés (toutes dates confondues, comme `impactCumuleGrammes`) dont `co2_evite_g` repose encore sur un `a_verifier`. **Recalculé à la volée, jamais stocké dans l'état**, même règle que le reste des dérivés (niveau, badges, impact).
- Écran Profil (`js/views/profil.js`) : sous le total d'impact cumulé, nouvelle ligne discrète (« Dont X gestes validés basés sur un ordre de grandeur encore à confirmer. »), masquée quand ce compte est à 0.
- `css/app.css` : style `.impact-a-verifier` (texte discret, `#6a6a6a` sur fond blanc, contraste AA conforme comme `.impact-source`).
- `tests/impact.test.js` : ajout de tests pour `nombreGestesAVerifier` (0 quand rien à confirmer, comptage correct sur plusieurs dates sans déduplication, robustesse sans catalogue).
- `tests/points.test.js` : ajout d'un test qui échoue si un geste du catalogue sans `a_verifier` (donc considéré sourcé définitivement) a une source vide.

## 2026-09-13 — Consolidation des fichiers de pilotage
- Le repo portait cinq fichiers de pilotage au lieu de deux (`CLAUDE.md`, `CLAUDE-1.md`, `ROADMAP.md`, `ROADMAP-1.md`, `ROADMAP-2.md`). Les versions à jour du 13/09/2026 étaient `CLAUDE-1.md` et `ROADMAP-2.md`, les autres périmées.
- `CLAUDE.md` remplacé par le contenu de `CLAUDE-1.md` (vision, contraintes, stack cible et architecture mises à jour : rythme 15 min/jour abandonné au profit d'un modèle où la source de vérité de l'avancement est `ROADMAP.md`).
- `ROADMAP.md` remplacé par le contenu de `ROADMAP-2.md` (rythme 1h/jour, sessions 1 à 10 déjà réalisées cochées, phases 1bis à 6 détaillées, piste B visibilité/acquisition).
- Dans `ROADMAP.md`, la ligne du backlog d'audit a été corrigée : elle renvoyait à un fichier `cowork-audit-hebdo-ecoquest.md` qui n'existe pas dans le repo. L'audit hebdomadaire est en réalité une routine automatique (« Audit hebdomadaire EcoQuest ») qui publie son rapport en artifact, pas un fichier versionné — la ligne le décrit désormais correctement.
- `CLAUDE-1.md`, `ROADMAP-1.md` et `ROADMAP-2.md` supprimés. Vérifié qu'aucun fichier du repo ne les référence plus.

## 2026-09-13 — Session 10 : Compteur d'impact cumulé sur le Profil
- Ajout dans `js/gamification.js` de `impactCumuleGrammes(état, gestes)`, qui somme les `co2_evite_g` de tous les gestes réellement validés dans `gestesCochesParDate`, toutes dates confondues — **recalculé à la volée à chaque affichage, jamais stocké dans l'état**, pour éviter tout double comptage (comme le niveau et les badges).
- Ajout de `EQUIVALENCES_IMPACT` (3 équivalents : km en voiture évités, charges de smartphone évitées, douches courtes évitées, avec leur facteur de conversion ADEME / Impact CO2 sourcé) et de `calculerEquivalences(état, gestes)`, qui convertit le total cumulé en ces équivalents parlants.
- Écran Profil (`js/views/profil.js`) : nouveau bloc « 🌍 Ton impact cumulé » en haut de l'écran, affichant le total en kg de CO2 « estimation », puis les 3 équivalents avec leur source citée à côté de chacun. Sans catalogue disponible, le bloc l'indique clairement plutôt que d'afficher un chiffre faux.
- Aucun nouveau champ d'état : le calcul repose uniquement sur `gestesCochesParDate` (déjà existant) et le catalogue `data/gestes.json` — pas de migration nécessaire dans `js/state.js`.
- `css/app.css` : styles du bloc d'impact et de sa liste d'équivalents.
- Ajout de `tests/impact.test.js` : somme sur plusieurs dates, absence de déduplication, robustesse si un id coché est absent du catalogue, cohérence de chaque équivalent avec son facteur de conversion, et vérification qu'aucune propriété n'est ajoutée à l'état.
- `sw.js` : cache renommé `ecoquest-shell-v8` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-12 — Session 9 : 8 badges + écran Profil
- Ajout de 8 badges dans `js/gamification.js` (`BADGES` + `calculerBadges(état, gestes)`), tous **recalculés à la volée** à partir de l'état existant (points, streak, joker, historique `gestesCochesParDate`) : jamais stockés séparément, pour éviter tout double comptage. Badges : Premier pas (1 geste validé), Une semaine (streak ≥ 7), Toutes les couleurs (5 catégories touchées), Niveau 3, Niveau 5 (max), 50 gestes (total toutes dates confondues), Joker utilisé, Semaine sans faute (streak ≥ 7 sans joker).
- Deux des huit badges ("Joker utilisé", "Semaine sans faute") ont besoin d'un signal que le streak/joker existants ne portaient pas : ajout de `joker.dejaUtilise` (jamais réinitialisé, contrairement à `disponible`) et `streak.jokerUtiliseDansStreak` (vrai si le joker a comblé un jour de la série en cours, remis à false au démarrage d'une nouvelle série). Mis à jour dans `cocherGeste()`/`decocherGeste()` aux mêmes endroits que le reste du streak, sans nouvelle logique parallèle.
- `js/state.js` : migration douce pour `joker.dejaUtilise` — un état déjà en cours d'utilisation du joker (disponible < 1 avant cette version) se voit attribuer `dejaUtilise: true` pour ne pas priver injustement du badge correspondant. Un état ancien sans `streak`/`joker` du tout reste géré sans planter (valeurs par défaut).
- Ajout de `js/views/profil.js` : grille de 8 cartes de badges, badges obtenus visuellement distincts (icône couleur + bordure verte) des badges à débloquer (fond grisé + cadenas 🔒), recalculés à chaque affichage de l'onglet. Le catalogue (`data/gestes.json`) est chargé pour le seul badge "Toutes les couleurs" ; s'il est indisponible, les 7 autres badges restent corrects.
- `css/app.css` : styles de la grille de badges (2 colonnes, cibles ≥ 44px). Le contraste des badges verrouillés était en réalité insuffisant (corrigé le 13/09/2026, voir plus haut dans ce journal).
- Ajout de `tests/badges.test.js` : vérifie chacune des 8 conditions de déblocage indépendamment, ainsi que la robustesse sur un état ancien sans historique complet.
- `sw.js` : cache renommé `ecoquest-shell-v7` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-12 — Session 8 : Streak (jours consécutifs) + joker hebdomadaire
- `js/gamification.js` : ajout du streak de jours consécutifs. Le streak avance dès que le premier geste d'un jour est validé et que la veille avait aussi été validée ; sinon il repart de 1. Ajout d'un joker hebdomadaire (`JOKERS_PAR_SEMAINE = 1`) qui permet de sauter un unique jour manqué sans casser le streak ; il se recharge automatiquement à chaque nouvelle semaine ISO (`semaineISO()`). `cocherGeste()`/`decocherGeste()` mettent à jour `state.streak` et `state.joker` uniquement quand le nombre de gestes validés du jour passe de 0 à 1 (ou inversement), pour ne jamais double-compter : décocher le dernier geste d'un jour annule proprement l'incrément du streak (et restitue le joker s'il avait été utilisé pour ce jour-là).
- `js/state.js` : migration douce dans `loadState()` — si `streak`/`joker` sont absents (ou incomplets) dans l'état existant, ils sont initialisés à leurs valeurs par défaut sans toucher aux points ni aux gestes déjà enregistrés.
- Onglet Aujourd'hui (`js/views/aujourdhui.js`) : ajout d'un bloc affichant le streak actuel (« 🔥 X jours de suite ») et la disponibilité du joker de la semaine, mis à jour à chaque geste coché/décoché.
- `css/app.css` : style `.streak-bloc`.
- Ajout de `tests/streak.test.js` : incrément/reset du streak, calcul de la semaine ISO, consommation et recharge hebdomadaire du joker, et annulation correcte au décochage (y compris restitution du joker).
- `sw.js` : cache renommé `ecoquest-shell-v6` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-12 — Session 7 : Niveaux de progression
- `js/gamification.js` : ajout de `SEUILS_NIVEAUX` (0/50/150/300/500, 5 niveaux) et de `calculerNiveau(points)`, qui renvoie le niveau actuel (1 à 5), les points restants avant le niveau suivant et le pourcentage de progression dans le niveau courant. Le niveau **n'est jamais stocké dans l'état** : toujours recalculé à la volée à partir de `state.points`, pour éviter tout double comptage avec les points.
- Onglet Aujourd'hui (`js/views/aujourdhui.js`) : ajout en haut de l'écran d'un bloc « Niveau X » avec une barre de progression visuelle vers le niveau suivant (ou « Niveau maximum atteint ! » au niveau 5), mise à jour à chaque geste coché/décoché en même temps que le total de points.
- `css/app.css` : styles de la barre de niveau (`.niveau-bloc`, `.niveau-barre`, `.niveau-barre-remplissage`).
- Ajout de `tests/niveaux.test.js` : vérifie les seuils, le passage exact de niveau à chaque seuil, le calcul des points restants et du pourcentage de progression, ainsi que le comportement au niveau maximum.
- `sw.js` : cache renommé `ecoquest-shell-v5` pour forcer la mise à jour sur les téléphones déjà installés.

## 2026-09-12 — Session 6 : 3 gestes du jour (sélection déterministe)
- **Onglet Aujourd'hui repensé** : au lieu d'afficher les 30 gestes d'un coup, l'écran met en avant « Tes 3 gestes du jour », un geste piochés dans 3 catégories différentes.
- La sélection est **déterministe par date** (nouvelle fonction `selectionDuJour()` dans `js/gamification.js`, PRNG déterministe seedé par la date AAAA-MM-JJ) : les mêmes 3 gestes s'affichent à chaque rechargement dans la journée, et le tirage change à minuit — jamais de tirage aléatoire à chaque visite.
- `js/state.js` : la propriété `completedToday` (gestes cochés sans notion de date) est remplacée par `gestesCochesParDate` (objet `{ "AAAA-MM-JJ": [ids...] }`), ajoutée avec une valeur par défaut dans `loadState()`. Migration douce : les gestes déjà cochés avant cette session sont rattachés à la date du jour lors du premier chargement, aucun point déjà gagné n'est perdu.
- `js/gamification.js` : `cocherGeste()`/`decocherGeste()` prennent désormais la date en plus du geste et lisent/écrivent dans `gestesCochesParDate[date]`, toujours sans double comptage (que le geste soit coché depuis la sélection du jour ou depuis le catalogue complet, qui partagent le même état).
- Le catalogue complet des 30 gestes reste accessible depuis l'onglet Aujourd'hui, dans une section repliée « Catalogue complet », groupée par catégorie comme avant.
- Chaque geste du jour se coche en un tap (cible ≥ 44px) avec une micro-animation de validation sobre (léger flash de couleur, 0,5 s), désactivée automatiquement si l'utilisateur a activé « réduire les animations » (`prefers-reduced-motion`).
- `tests/points.test.js` : mis à jour pour la nouvelle signature `cocherGeste(état, geste, date)`/`decocherGeste(...)` et le nouveau stockage par date, avec un test vérifiant l'indépendance des gestes cochés entre deux dates différentes.
- Ajout de `tests/selection.test.js` : vérifie que `selectionDuJour()` renvoie toujours 3 gestes, de 3 catégories différentes, de façon déterministe pour une date donnée (même date → même sélection) et change avec la date.
- `sw.js` : cache renommé `ecoquest-shell-v4` pour forcer la mise à jour sur les téléphones déjà installés.

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
