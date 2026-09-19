# EcoQuest — Roadmap

Mise à jour du 13/09/2026. Changements par rapport à la version précédente : rythme 1h/jour au lieu de 15 min, items hors code remontés en tête de file, Piste B réduite aux jalons réels, ajout des outils de diagnostic (console embarquée, journalisation d'erreurs) devenus nécessaires faute de Mac.

## Rythme et protocole

**1 heure de code par jour, du lundi au jeudi. Le vendredi, pas de code.**

Une heure = **3 items terminés**, pas 4. Le quatrième créneau part en corrections, et c'est normal : le code assisté produit vite, il ne produit pas juste.

| Temps | Action |
| --- | --- |
| 0–2 min | Claude → Code → repo `ecoquest`. Coller les prompts du jour. |
| 2–45 min | Claude Code travaille, item par item. |
| 45–55 min | Tester sur téléphone après chaque item. |
| 55–60 min | Merger. Claude Code coche les cases et met à jour `changelog.md`. |

Règles :

- **La session du jour part de la première case non cochée, dans l'ordre.** Une session sautée n'est pas perdue : la file n'avance que quand un item est terminé.
- Si ça bugue, le prompt suivant est *« Corrige : [ce que tu as vu] »*, et la case reste ouverte.
- 🖥️ = **hors session** : exige une machine, un navigateur ou une action manuelle. Rare, signalé.
- ✅ = **jalon** : rien à coder, quelque chose à observer ou à obtenir.

---

## Le chemin critique n'est pas le code

À 12 items par semaine, le code sera fini avant les autorisations. Ce qui commande le calendrier :

| Contrainte | Durée plancher | À lancer |
| --- | --- | --- |
| Compte Play Console + vérification d'identité | 2 à 5 jours | **cette semaine** |
| Keystore de signature 🖥️ | 30 min sur un ordinateur | **ce week-end** |
| 12 testeurs actifs en test fermé | **14 jours consécutifs** | dès que l'AAB existe |
| Ton usage réel avec notifications | 14 jours | phase 3 |
| Revue Play Store | quelques jours | mi-octobre |
| 5 foyers à J30 | 30 jours | après publication |

**Conséquence : à partir de la semaine 3, tu auras des heures libres pendant que le compteur des 14 jours tourne.** Utilise-les pour le backlog d'audit et le recrutement de foyers, pas pour empiler des fonctionnalités.

| Jalon | Horizon |
| --- | --- |
| Socle consolidé | 17 septembre |
| APK installable sur ton téléphone | 22 septembre |
| Test fermé ouvert, 12 testeurs recrutés | 24 septembre |
| Notifications en production | fin septembre |
| Fin de la fenêtre 12 testeurs × 14 j | ~8 octobre |
| **Publication publique Play Store** | **mi-octobre** |
| Foyer multi-appareils | fin octobre |
| Rétention J30 mesurée — ta preuve d'impact | mi-novembre |

---

## À faire cette semaine, hors code

- [ ] **H1** — Créer le compte Google Play Console (25 $, vérification d'identité). **Ce soir.** C'est 2 à 5 jours d'attente que tu ne veux pas découvrir en S25.
- [ ] **H2** — Générer le keystore de signature (`keytool`) et le déposer en secret GitHub en base64. Une demi-heure sur un ordinateur, la seule de tout le projet.
- [ ] **H3** — Lister 15 personnes à solliciter comme testeurs (il en faut 12 actifs, prévois la marge). Famille, amis, collègues, parents d'élèves.
- [ ] **H4** — Sécuriser l'accès à un iPhone, même emprunté, pour le jour où tu attaqueras iOS.

---

## PISTE A — Construire l'appli

### Phases 0 et 1 — Fondations et MVP solo ✔

- [x] **S1** — Repo créé, `CLAUDE.md` déposé, GitHub Pages activé.
- [x] **S2** — Squelette PWA : écran d'accueil, manifest, service worker.
- [x] **S3** — Câblage GitHub Pages corrigé, arborescence conforme.
- [x] **S4** — Premier écran de gestes, `state.js`, `gamification.js`, premier test.
- [x] **S5** — Navigation basse 4 onglets, catalogue étendu à 30 gestes.
- [x] **S6** — « Tes 3 gestes du jour », sélection déterministe par date.
- [x] **S7** — 5 niveaux et barre de progression.
- [x] **S8** — Série de jours consécutifs + joker hebdomadaire.
- [x] **S9** — 8 badges et écran Profil.
- [x] **S10** — Impact cumulé et équivalences parlantes.

### Phase 1bis — Consolidation du socle (S11–S20)

Rien de visible pour l'utilisateur. Tout le reste s'appuie dessus.

- [x] **S11** — *« Crée `.github/workflows/tests.yml` : à chaque push sur `main` et sur chaque PR, exécuter `node --test tests/*.test.js`. Aucune dépendance npm. »*
- [x] **S12** — *« Ajoute une console de debug embarquée (Eruda, importée depuis un CDN) activée uniquement par le paramètre d'URL `?debug=1` ou 5 taps sur le numéro de version. Jamais chargée en usage normal. »* Sans Mac, c'est le seul moyen de voir ce qui se passe dans une WebView.
- [x] **S13** — *« Ajoute un gestionnaire global d'erreurs JS (`window.onerror` + `unhandledrejection`) qui stocke les 50 dernières erreurs dans l'état, consultables et exportables depuis l'écran de debug. »*
- [x] **S14** — *« Ajoute dans `js/state.js` un export complet de l'état en JSON et un import avec validation, exposés sur l'écran Profil. L'import refuse un fichier invalide sans écraser l'état existant. Tests inclus. »*
- [x] **S15** — *« Vérifie un par un les gestes de `data/gestes.json` marqués `a_verifier: true` contre les ordres de grandeur ADEME / Impact CO2. Corrige valeur et source, ou retire le geste. Dis-moi lesquels tu as retirés. »*
- [x] **S16** — *« Même travail pour `EQUIVALENCES_IMPACT` dans `js/gamification.js` : source précise pour chaque facteur, ou retrait de l'équivalence. »*
- [x] **S17** — *« Écris README.md pour un visiteur extérieur : promesse, capture, stack, comment lancer les tests, licence. Ajoute LICENSE (MIT). »*
- [x] **S18** — *« Onboarding en 3 écrans : prénom, 3 catégories prioritaires, heure de rappel souhaitée. Les gestes du jour tiennent compte des priorités. L'heure est stockée, pas encore utilisée. »*
- [x] **S19** — *« Historique : calendrier du mois avec les jours actifs colorés, sur l'écran Profil. »*
- [x] **S20** — *« Rédige `privacy.html` : politique de confidentialité exigée par le Play Store, à l'état actuel de l'app (données locales uniquement, aucune collecte). À faire évoluer en phase 4 et en S65. »*

### Phase 2 — Coquille Android (S21–S28)

Objectif : une app installable, buildée sans jamais ouvrir Android Studio.

- [x] **S21** — *« Ajoute `capacitor.config.json` (appId `app.ecoquest`, appName EcoQuest, `webDir` à la racine) et le `package.json` minimal des dépendances Capacitor. Ces fichiers ne servent qu'à la CI, rien à installer chez moi. Ajoute `/android` au `.gitignore`. »*
- [x] **S22** — *« Crée `.github/workflows/android.yml` : sur tag `v*`, installer les dépendances, `npx cap add android`, builder un APK de debug non signé, le publier comme artifact du workflow. »*
- [x] **S23** — Tag, télécharger l'APK depuis l'onglet Actions, l'installer. Noter tout ce qui casse dans la WebView.
- [x] **S24** — *« Corrige : [ce que tu as vu]. »*
- [x] **S25** — 🖥️ Keystore de signature en secret GitHub (voir H2, normalement déjà fait).
- [x] **S26** — *« Fais évoluer `android.yml` : builder un AAB signé avec le keystore des secrets, publié comme artifact. Ne logue jamais le keystore ni les mots de passe. »*
- [x] **S27** — 🖥️ Fiche Play Store : titre, descriptions, captures, icône, URL de `privacy.html` sur GitHub Pages. Ouvrir une **piste de test fermé**.
- [x] **S28** — ✅ **Jalon** : 12 testeurs inscrits et actifs sur la piste fermée. Le compteur des 14 jours démarre ici, et rien ne l'accélère.

### Phase 3 — Notifications, le cœur du produit (S29–S38)

- [ ] **S29** — *« Crée `js/notifications.js` : rappel local quotidien à l'heure choisie, via `@capacitor/local-notifications`. Annulation propre, reprogrammation au changement d'heure. Tests sur le calcul de la prochaine échéance. »*
- [ ] **S30** — *« La demande d'autorisation n'apparaît qu'après la première validation de geste, dans un écran qui explique la valeur en une phrase. Jamais au premier lancement. Si l'utilisateur refuse, ne jamais redemander. »*
- [ ] **S31** — *« Le contenu de la notification cite le geste du jour et son bénéfice concret, jamais un rappel générique. Écris 10 variantes, tire au sort. »*
- [ ] **S32** — *« Réglages de notification sur l'écran Profil : activer/désactiver, changer l'heure, en deux taps maximum. »*
- [ ] **S33** — *« Ouverture depuis une notification : l'enregistrer dans l'état et afficher directement le geste du jour. »*
- [ ] **S34** — *« Sur l'écran de debug : notifications envoyées, ouvertes depuis notification, taux d'action sur 7 et 30 jours. Mon tableau de bord, pas celui de l'utilisateur. »*
- [ ] **S35** — *« Série en danger : si aucun geste validé à 20 h et série en cours, un rappel unique. Jamais deux notifications le même jour. »*
- [ ] **S36–S37** — Corrections issues de l'usage réel et des retours testeurs.
- [ ] **S38** — ✅ **Jalon** : 14 jours d'usage avec notifications actives. Noter le taux d'action et 3 frictions. **Sous 20 % de taux d'action, le problème est le contenu, pas la technique** — on itère sur S31 avant d'avancer.

### Phase 4 — Comptes et push serveur (S39–S50)

- [ ] **S39** — 🖥️ Créer le projet Supabase (offre gratuite).
- [ ] **S40** — *« Propose le schéma Postgres : profils, foyers, gestes validés, séries, historique de notifications, erreurs clientes. RLS activée dès la création — un foyer ne voit jamais les données d'un autre. Donne-moi le SQL à coller. »*
- [ ] **S41** — *« Crée `js/sync.js` : client Supabase importé en ES module depuis un CDN, authentification par lien magique. »*
- [ ] **S42** — *« Migration du localStorage vers la base à la première connexion, sans perte. L'app reste pleinement utilisable hors ligne et sans compte. »*
- [ ] **S43–S44** — Synchronisation bidirectionnelle, conflits résolus au dernier écrit par jour.
- [ ] **S45** — *« Cron GitHub Actions qui ping la base chaque jour : un projet Supabase gratuit se met en pause après 7 jours sans requête. »*
- [ ] **S46** — *« Remonte les erreurs JS collectées en S13 vers Supabase. C'est ce qui remplace l'inspecteur Safari que je n'aurai pas. »*
- [ ] **S47–S48** — Edge Function de scheduling : quoi envoyer, à qui, quand, selon l'historique et le taux d'action.
- [ ] **S49** — Push FCM depuis l'Edge Function, en complément des notifications locales.
- [ ] **S50** — ✅ **Jalon** : la notification du jour est choisie côté serveur et mesurée.

### Phase 5 — Le foyer, ton différenciateur (S51–S62)

- [ ] **S51–S52** — Foyer multi-profils, multi-appareils grâce aux comptes.
- [ ] **S53** — Mode enfant : textes simplifiés, gestes adaptés, avatars.
- [ ] **S54** — Défi hebdomadaire de foyer : objectif collectif, barre commune.
- [ ] **S55** — Classement bienveillant : qui a le plus progressé, pas qui a le plus de points.
- [ ] **S56** — Récompenses familiales définies par les parents.
- [ ] **S57** — Défis entre foyers par lien d'invitation.
- [ ] **S58** — Carte d'impact partageable au format story.
- [ ] **S59–S61** — Corrections issues des tests en famille et chez les testeurs.
- [ ] **S62** — ✅ **Jalon** : 5 foyers utilisent l'app depuis plus de 30 jours.

### Phase 6 — Bêta et monétisation (S63+)

- [ ] **S63–S64** — Mesure anonyme : rétention J7 / J30, gestes par foyer. **C'est ta preuve d'impact.**
- [ ] **S65** — `privacy.html` en version RGPD complète : consentement, droit à l'effacement.
- [ ] **S66–S67** — AdMob : un emplacement discret, jamais sur l'écran de validation d'un geste.
- [ ] **S68** — Passage en production sur le Play Store.
- [ ] **S69+** — iOS via runners macOS GitHub (gratuits sur repo public), défis thématiques écoles et collectivités, traduction EN, Play Billing.

---

## PISTE B — Visibilité et acquisition

Deux objectifs distincts, à ne plus mélanger.

### B1 — Visibilité professionnelle (LinkedIn, aux jalons seulement)

Pas de journal de bord, pas de rythme hebdomadaire : un post ne sort que quand il apprend quelque chose à un pair qui gère des roadmaps et des équipes. Le projet est l'anecdote, pas le sujet.

- [ ] **B1.1** — À la publication Play Store (mi-octobre) : ce que dix fonctionnalités en 36 heures disent du vrai goulot d'un produit.
- [ ] **B1.2** — Au premier chiffre de rétention (mi-novembre) : le taux d'action sur notification, un chiffre que personne ne publie.
- [ ] **B1.3** — Optionnel, sans date : ce que le code assisté change au métier de PM. À écrire seulement s'il y a vraiment quelque chose à dire.

### B2 — Acquisition (en direct, pas en publication)

- [ ] **B2.1** — 12 testeurs depuis l'entourage direct (voir H3). Aucune plateforme.
- [ ] **B2.2** — Après le jalon rétention : associations de parents d'élèves, enseignants, centres de loisirs.
- [ ] **B2.3** — Un acteur institutionnel par mois (école, association écolo, collectivité), chiffres en main.

### Le vendredi

Créneau « hors code » : recrutement de testeurs, fiche Play Store, sourcing des chiffres CO2, démarchage. Pas de publication imposée.

---

## Backlog d'audit

Alimenté chaque semaine par la routine automatique « Audit hebdomadaire EcoQuest », qui publie son rapport en artifact (pas de fichier dans le repo). Les constats validés deviennent des items numérotés `A1`, `A2`… traités en priorité sur les nouvelles fonctionnalités.

- [ ] *(vide au 13/09/2026 — premier audit le dimanche 20 septembre)*

---

## Indicateurs à suivre

- Items terminés / semaine (cible réaliste : 12)
- **Taux d'action sur notification** (cible : > 25 %) — l'indicateur central du produit
- Rétention J7 des testeurs (cible bêta : > 30 %)
- Foyers actifs à J30
- Erreurs clientes remontées / semaine (doit baisser, pas rester à zéro)
