# Changelog

## 2026-09-16 — Session 18 : Onboarding en 3 écrans
- `js/state.js` : nouveau `state.onboarding = { termine, prenom, categoriesPrioritaires, heureRappel }` (défaut `ONBOARDING_PAR_DEFAUT`, `heureRappel` par défaut "19:00"), avec migration douce comme pour `streak`/`joker`/`erreurs`. Un état déjà en cours d'usage (`points > 0`) sans `onboarding` est marqué `termine: true` pour ne pas ré-afficher l'onboarding à un utilisateur existant. `validerEtat`/`importerEtatJSON` acceptent son absence (anciens exports) et rejettent une structure incomplète.
- Nouvel écran `js/views/onboarding.js` : 3 étapes (prénom → 3 catégories prioritaires parmi les 5 du catalogue → heure de rappel souhaitée), navigable en avant/arrière, bouton "Suivant"/"Terminer" désactivé tant que l'étape n'est pas valide (prénom non vide, exactement 3 catégories). L'heure de rappel est un `<input type="time">` : stockée, mais aucune notification n'est encore programmée (session 29).
- `js/app.js` : l'onboarding s'affiche une seule fois, avant la navigation à onglets, tant que `state.onboarding.termine` est faux ; la tab-bar reste masquée pendant.
- `css/app.css` : ajout de `.tab-bar[hidden] { display: none }` — sans cette règle, le `display: flex` de `.tab-bar` l'emportait sur l'attribut natif `hidden` posé par `js/app.js` et la navigation restait visible pendant l'onboarding (repéré en testant le flux avec Playwright).
- `js/gamification.js` : `selectionDuJour(gestes, dateISO, categoriesPrioritaires)` accepte un 3ᵉ paramètre optionnel. Si l'utilisateur a choisi exactement 3 catégories valides à l'onboarding, les gestes du jour viennent de ces 3 catégories (un geste tiré au sort par catégorie, toujours déterministe par date) ; sinon, comportement inchangé (tirage aléatoire sur les 5 catégories). `js/views/aujourdhui.js` passe `state.onboarding.categoriesPrioritaires`.
- Tests : migrations et validation de `onboarding` dans `tests/state.test.js` et `tests/state-export-import.test.js` ; effet des catégories prioritaires (et repli sur l'aléatoire si absentes/invalides) dans `tests/selection.test.js`.
- `sw.js` : ajout de `js/views/onboarding.js` à l'app shell précaché, cache renommé `ecoquest-shell-v20`.
- Vérifié avec Playwright (Chromium, 390×844) : les 3 écrans s'enchaînent, l'état est bien persisté dans `localStorage`, et les gestes du jour affichés après l'onboarding viennent bien des 3 catégories choisies.

## 2026-09-16 — Session 17 : README.md et licence MIT
- Dette listée dans `CLAUDE.md` : dépôt sans README, sans description, sans licence.
- Ajout de `README.md` pour un visiteur extérieur : promesse du produit, capture d'écran, tableau de stack, comment lancer l'app en local et les tests, licence.
- Capture d'écran réelle de l'écran « Aujourd'hui » générée avec Playwright/Chromium (viewport 390×844) et ajoutée dans `docs/screenshot.png`.
- Ajout de `LICENSE` (MIT), au nom de l'auteur du dépôt.

## 2026-09-16 — Session 16 : Sourçage précis de `EQUIVALENCES_IMPACT`
- Dette listée dans `CLAUDE.md` : les 3 facteurs de conversion de `EQUIVALENCES_IMPACT` (`js/gamification.js`) étaient des ordres de grandeur jamais confrontés précisément à une source ADEME/Impact CO2.
- **voiture (193 g/km)** : gardé, source précisée. Ce chiffre correspond au périmètre ADEME Base Carbone "voiture particulière, moyenne nationale toutes distances et toutes carburations" — carburant (amont + combustion) uniquement, hors fabrication du véhicule. C'est le bon périmètre conceptuel pour "km évités" : ne pas rouler n'évite pas la fabrication déjà réalisée du véhicule, seulement le carburant. À distinguer du chiffre cycle de vie complet (~218 g/km, avec fabrication amortie) que cite Impact CO2 pour "voiture thermique".
- **smartphone (8 g/charge) — retiré.** Le chiffre circulant sur le web se calcule avec le mix électrique **mondial** moyen (567 g CO2/kWh), pas le mix français (~40-60 g CO2/kWh) : avec le mix français, une charge de smartphone (~14 Wh) donne plutôt ~0,6 à 0,8 g CO2, un ordre de grandeur en dessous. Aucune source ADEME/Impact CO2 primaire ne publie de chiffre "1 charge = X g" pour la France — l'outil Impact CO2 "smartphone" modélise le cycle de vie complet et les usages (streaming, etc.), pas une charge isolée. Retiré plutôt que de garder un chiffre non attribuable et probablement faux d'un facteur ~10.
- **douche (300 g/douche courte évitée)** : gardé, source corrigée. L'ancienne source citée ("Réduire sa consommation d'eau chaude sanitaire") n'a pas pu être confirmée comme un document ADEME réel. Remplacée par "Nos conseils pour économiser l'eau à la maison" (ADEME), qui publie le chiffre vérifiable de 58 kWh/m³ pour chauffer l'eau de 10 à 60°C — recoupé avec les volumes bain/douche ADEME et la part de l'électrique dans l'eau chaude sanitaire en France, l'ordre de grandeur de 300 g est cohérent. Le geste `douche-courte` de `data/gestes.json` (déjà sourcé, jamais marqué `a_verifier`) a reçu la même correction de source par cohérence, même claim sous-jacente.
- `js/gamification.js` : `EQUIVALENCES_IMPACT` passe de 3 à 2 entrées (voiture, douche). Aucun changement de logique : `calculerEquivalences` et l'affichage en Profil (`js/views/profil.js`) itèrent déjà dynamiquement sur ce tableau, sans compter dessus une taille fixe.
- Tests : aucun test ne dépendait d'un nombre fixe d'équivalences ou de l'id "smartphone" — `tests/impact.test.js` passe sans modification.
- `sw.js` : cache renommé `ecoquest-shell-v19` (`js/gamification.js` fait partie de l'app shell précaché).

## 2026-09-16 — Session 15 : Vérification des gestes `a_verifier` contre ADEME / Impact CO2
- Dette listée dans `CLAUDE.md` : 25 des 30 gestes de `data/gestes.json` portaient `a_verifier: true`, avec des valeurs `co2_evite_g` provisoires jamais confrontées à une source réelle.
- Chaque geste a été vérifié un par un contre les ordres de grandeur publiés par l'ADEME (Base Carbone, guides pratiques, études) et l'outil Impact CO2. Trois issues possibles, jamais de valeur inventée : la valeur tenait déjà la route (flag retiré, source précisée), la valeur était fausse d'un facteur significatif (corrigée), ou aucun ordre de grandeur unique et défendable n'existe pour le geste tel que formulé (retiré du catalogue).
- **9 gestes gardés, flag retiré, valeur inchangée, source précisée** : `debrancher-veille`, `repas-vegetarien`, `legumineuses-proteines`, `covoiturage`, `transport-commun`, `eco-conduite`, `sac-reutilisable`, `limiter-streaming-hd`, `recherche-directe`.
- **6 gestes gardés avec valeur corrigée** (l'ancienne valeur était surestimée ou sous-estimée d'un facteur ≥ 2, ou la source citée n'existait pas) : `baisser-chauffage` (900 → 1000 g, hypothèse chauffage au gaz précisée), `linge-air-libre` (1500 → 150 g, l'ancienne source "Impact CO2 — Sèche-linge" n'existe pas sur impactco2.fr), `lave-linge-plein` (120 → 50 g), `zero-gaspillage` (400 → 150 g), `eau-du-robinet` (150 → 300 g par litre), `eteindre-wifi-nuit` (40 → 15 g).
- **10 gestes retirés du catalogue**, faute d'ordre de grandeur ADEME/Impact CO2 unique et défendable :
  - `fruits-legumes-saison` — l'ADEME ne publie qu'un facteur relatif (ex. "une tomate hors-saison sous serre émet ~7x plus"), jamais de valeur absolue en grammes par portion.
  - `cuisine-maison` — aucune comparaison chiffrée ADEME entre repas maison et repas livré ; le geste mélange deux variables (contenu de l'assiette vs mode de livraison).
  - `trajet-groupe` — principe qualitatif cité par l'ADEME (optimisation des trajets) mais sans valeur chiffrée type, dépendante d'une distance inventée.
  - `trottinette-partagee` — le seul chiffre défendable trouvé (Fraunhofer ISI, Arcadis) n'est pas une source ADEME/Impact CO2, contrainte non négociable de `CLAUDE.md`.
  - `compost` — écart entre compost et enfouissement (méthane évité) allant de 35 g à 6,25 kg de CO2 par kg selon la filière locale de traitement des déchets : trop variable pour un chiffre unique.
  - `reparer-plutot-jeter` — les exemples ADEME concrets vont de 28 kg (vêtement) à 100 kg (électroménager) : la valeur générique de 3 kg était sous-estimée d'un facteur 10 à 30 et ne représente aucun objet réel.
  - `seconde-main` — même problème : 24,6 kg (smartphone reconditionné) à 108 kg (fauteuil de bureau) selon l'ADEME, incompatible avec un chiffre générique.
  - `supprimer-mails-vieux` — l'ADEME indique elle-même que le stockage ne représente qu'environ 0,5 % de l'empreinte d'un email (92 % vient de la fabrication du terminal) : le geste repose sur une prémisse que la source invalide.
  - `visio-plutot-que-deplacement` — le déplacement évité varie d'un facteur 60 à 70 selon le mode de transport remplacé (train régional à vol), aucune hypothèse par défaut n'étant défendable.
  - `mode-sombre-eco` — aucune source ADEME/Impact CO2 ne chiffre d'impact CO2 ; la littérature indépendante disponible est contradictoire et ne porte que sur la batterie, jamais sur les émissions.
- Catalogue : 30 → 20 gestes. Répartition par catégorie : `energie` 6, `alimentation` 4, `deplacements` 4, `dechets` 3, `numerique` 3 (n'est plus équilibrée à 6/catégorie).
- `tests/points.test.js` : le total attendu passe de 30 à 20 ; l'assertion "exactement 6 gestes par catégorie" est remplacée par "au moins 3 gestes par catégorie" (le minimum pour garder de la variété dans la sélection du jour), puisque l'équilibrage strict à 6 n'a plus de raison d'être une fois les gestes invérifiables retirés.
- `sw.js` : `data/gestes.json` fait partie de l'app shell précaché ; cache renommé `ecoquest-shell-v18` pour propager le nouveau catalogue aux appareils qui ont déjà installé l'app.

## 2026-09-14 — Session 14 : Export/import JSON de l'état, exposés en Profil
- Dette listée dans `CLAUDE.md` : aucun export des données, un vidage du stockage du navigateur détruisait tout l'historique. Seul filet de sécurité en attendant la synchronisation Supabase (phase 4).
- `js/state.js` : `exporterEtatJSON(state)` sérialise l'état dans une enveloppe `{ format: "ecoquest-export", version, exporteLe, etat }` (plutôt que l'état brut) pour pouvoir distinguer un fichier EcoQuest d'un JSON quelconque à l'import, et faire évoluer le format plus tard sans casser les anciens exports.
- `js/state.js` : `validerEtat(etat)` vérifie strictement la structure (types de `points`, `gestesCochesParDate`, `activeTab`, `streak`, `joker`, `erreurs`) sans dépendre du catalogue de gestes (indisponible à l'import). `importerEtatJSON(texte)` parse et valide, ne lève jamais d'exception : renvoie toujours `{ valide: false, erreur }` pour un fichier invalide (JSON corrompu, structure inattendue, types incorrects), sans qu'aucun état ne soit appliqué — l'état existant n'est écrasé qu'après validation complète, jamais avant. Accepte aussi bien l'enveloppe d'export qu'un état brut.
- `js/views/profil.js` : nouvelle section « Sauvegarde de tes données » avec un bouton **Exporter mes données** (télécharge un `.json` horodaté, même mécanique que l'export de l'écran de debug — `nomFichierExportEtat()`) et **Importer une sauvegarde** (sélecteur de fichier caché, lu avec `File.text()`). Un import valide appelle `persist()` puis rafraîchit l'impact et les badges affichés sans recharger le catalogue ; un import invalide affiche le message d'erreur renvoyé par `importerEtatJSON` sans toucher à l'état.
- `css/app.css` : styles `.sauvegarde-*` et `.bouton-secondaire`, cibles tactiles ≥ 44px déjà couvertes par les règles `button` existantes.
- Ajout de `tests/state-export-import.test.js` (aller-retour export/import, validation de chaque champ pris isolément, rejet d'un JSON corrompu ou d'une structure inattendue sans exception) et `tests/profil-export.test.js` (nom de fichier d'export, même logique que `tests/debug-export.test.js`).
- `sw.js` : `js/state.js` et `js/views/profil.js` étaient déjà dans l'app shell ; cache renommé `ecoquest-shell-v17` pour propager les changements.

## 2026-09-14 — Session 13 : Gestionnaire global d'erreurs JS + écran de debug
- Sans Mac ni câble USB, la console embarquée (Eruda, session 12) permet d'inspecter l'app en direct, mais ne garde aucune trace d'une erreur survenue avant qu'on pense à l'activer — dette listée dans `ROADMAP.md` (S13).
- Ajout de `js/erreurs.js` : `installerGestionnaireErreurs(getState, persist)` pose `window.onerror` et `window.addEventListener("unhandledrejection", …)` au démarrage de l'app (`js/app.js`), **toujours actif**, pas seulement en mode debug — c'est ce qui alimente l'écran de debug, jamais l'inverse. Un `window.onerror` déjà posé par un outil tiers n'est jamais court-circuité : il est toujours rappelé après l'enregistrement. Chaque erreur enregistrée porte son type (`erreur`/`promesse-rejetee`), son message, sa source/ligne/colonne quand disponibles, sa pile d'appel et son horodatage.
- `ajouterErreur(state, erreur)` ne garde jamais plus de `MAX_ERREURS_STOCKEES` (50) entrées : au-delà, les plus anciennes sont retirées en premier (file FIFO), pour ne jamais faire grossir l'état indéfiniment même en cas d'avalanche d'erreurs répétées.
- `js/state.js` : nouvelle propriété `erreurs` (défaut `[]`), ajoutée dans `DEFAULT_STATE` — migration douce automatique via la fusion superficielle déjà en place dans `loadState()`, aucun changement de logique nécessaire.
- Ajout de `js/views/debug.js` : `afficherEcranDebug()`, un overlay plein écran (pas un 5e onglet, pour ne jamais apparaître en usage normal) listant les erreurs stockées (les plus récentes en premier), avec un bouton **Exporter** (télécharge un fichier `.json` horodaté) et un bouton **Fermer**. Lit toujours l'état le plus récent depuis `localStorage` au moment de l'ouverture, jamais un état capturé au rendu d'une vue précédente qui pourrait être périmé.
- Deux déclencheurs, les mêmes que pour Eruda (`js/views/profil.js`, `js/app.js`) : le paramètre d'URL `?debug=1` et 5 taps rapprochés sur le numéro de version en Profil ouvrent désormais la console Eruda **et** l'écran de debug ensemble.
- `css/app.css` : styles de l'overlay (`.debug-*`), au-dessus de la tab-bar, cibles tactiles ≥ 44px, mobile-first.
- Ajout de `tests/erreurs.test.js` (plafond FIFO à 50, formatage des deux types d'erreur, robustesse sans `Error` réelle, câblage de `window.onerror`/`unhandledrejection` sans court-circuiter un gestionnaire existant) et `tests/debug-export.test.js` (nom de fichier d'export). `tests/state.test.js` mis à jour pour le nouveau champ `erreurs` (état par défaut, migration d'un état ancien, aller-retour `saveState`/`loadState`).
- Vérifié avec un navigateur headless (Playwright) en local : une erreur non interceptée et un rejet de promesse non géré sont bien capturés et persistés dans `localStorage` (survivent à un rechargement de page), l'écran de debug les affiche avec horodatage et pile, l'export télécharge un JSON valide, et `?debug=1` ouvre directement l'écran (vide, avec le bon message, sur une app sans erreur).
- `sw.js` : `js/erreurs.js` et `js/views/debug.js` ajoutés à l'app shell mis en cache ; cache renommé `ecoquest-shell-v16`.

## 2026-09-14 — Correction : `?debug=1` fonctionnait en onglet web mais pas sur l'app installée
- Précision apportée par Sébastien : « ça marche en web pas sur l'app ». Cause identifiée : une PWA installée est le plus souvent *reprise* depuis l'arrière-plan par l'OS (processus gardé en mémoire) plutôt que rechargée à chaque ouverture. Dans ce cas, l'événement `load` ne se redéclenche jamais, donc le code qui enregistre/vérifie le service worker (`initServiceWorker()`) ne s'exécute pas non plus — contrairement à un onglet de navigateur classique, toujours rechargé au prochain accès, qui ne rencontrait donc pas le problème. Une PWA installée pouvait ainsi rester bloquée indéfiniment sur une ancienne version.
- `js/app.js` : ajout de `verifierMiseAJourAuRetourPremierPlan(registration)`, qui appelle explicitement `registration.update()` à chaque fois que l'app repasse au premier plan (`visibilitychange` → `visible`), en complément du rechargement automatique au changement de service worker actif (`surveillerMiseAJourServiceWorker()`, correctif précédent). Les deux mécanismes se combinent : la reprise au premier plan force la vérification, le changement de contrôleur déclenche le rechargement.
- Vérifié avec un navigateur headless (Playwright) en local, sur une copie isolée du repo : après modification du cache dans `sw.js` pendant qu'une page reste ouverte, le nouveau service worker s'installe, prend le contrôle, et la page se recharge automatiquement — seul le nouveau cache subsiste ensuite.
- `sw.js` : cache renommé `ecoquest-shell-v15`.

## 2026-09-14 — Correction : échec silencieux du chargement d'Eruda
- Après le correctif du service worker, `?debug=1` restait sans effet visible pour l'utilisateur dans certains cas : `activerConsoleDebug()` (`js/debug.js`) ne tentait qu'un seul CDN (esm.sh) et avalait silencieusement toute erreur d'import — si ce CDN était bloqué ou indisponible sur le réseau de l'utilisateur, rien ne s'affichait, ni erreur ni console. Ironique pour l'outil censé justement rendre les erreurs visibles sur un téléphone sans accès à la console du navigateur.
- `js/debug.js` : `activerConsoleDebug()` essaie désormais `esm.sh` puis, en cas d'échec, `https://cdn.jsdelivr.net/npm/eruda@3/+esm` (les deux CDN prévus par `CLAUDE.md`). Si les deux échouent, un `window.alert()` explicite prévient l'utilisateur au lieu de rester muet.
- Vérifié avec un navigateur headless (Playwright) en local : la requête vers `esm.sh` est bien déclenchée dès que `?debug=1` est présent, puis, quand les deux CDN sont injoignables, `activerConsoleDebug()` bascule bien vers `jsdelivr` puis affiche l'alerte — comportement conforme à celui décrit ci-dessus.
- `sw.js` : cache renommé `ecoquest-shell-v14`.

## 2026-09-14 — Correction : `?debug=1` sans effet sur un téléphone où l'app était déjà installée
- Après le merge de la session 12, `?debug=1` ne déclenchait rien sur un téléphone où l'app était déjà installée : le nouveau service worker (cache `v12`) s'installait bien en tâche de fond, mais l'ancien service worker actif continuait de servir l'ancien `js/app.js` (sans la logique de debug) tant que la page n'était pas rechargée manuellement — exactement le même type de bug que les trois occurrences précédentes de « cache du service worker non renouvelé » listées plus bas dans ce journal, sauf que cette fois le nom de cache avait bien été changé.
- `js/app.js` : ajout de `surveillerMiseAJourServiceWorker()`, qui recharge automatiquement la page une seule fois dès qu'un nouveau service worker prend le contrôle (`controllerchange`), au lieu de compter sur une réouverture manuelle. Corrige la classe de bug à la racine pour toutes les sessions futures, pas seulement celle-ci.
- `sw.js` : cache renommé `ecoquest-shell-v13`.
- Sur un téléphone déjà installé, il faut encore rouvrir l'app une fois après ce correctif pour que le nouveau service worker (celui qui recharge automatiquement) prenne le contrôle ; les mises à jour suivantes se rechargeront ensuite seules.

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
