# EcoQuest — Roadmap en sessions de 15 minutes

Mise à jour du 13/09/2026 : réordonnée autour de la décision « le rappel quotidien est le cœur du produit », et de la stack Capacitor + Supabase.

## Protocole d'une session (15 min, depuis le téléphone)

| Temps | Action |
| --- | --- |
| 0–2 min | Ouvrir Claude → Code → repo `ecoquest`. Coller le prompt du jour. |
| 2–10 min | Claude Code travaille. Tu ne touches à rien. |
| 10–13 min | Tester l'appli sur ton téléphone (les 3 étapes données par Claude). |
| 13–15 min | Valider / merger. La case est cochée par Claude Code dans ce fichier. |

Règles :

- **La session du jour est la première case non cochée, dans l'ordre.** Une session sautée n'est pas perdue : la file n'avance que quand un item est terminé. On ne double jamais deux items dans une même session.
- Si ça bugue : le prompt du lendemain est simplement *« Corrige : [ce que tu as vu] »*, et la case en cours reste ouverte.
- **Le vendredi, pas de code** : la session sert au rayonnement (Piste B).
- Les items marqués 🖥️ **hors session** exigent une vraie machine ou une action manuelle. Ils sont rares et signalés.

---

## Plan réaliste

Hypothèse de travail : **3 sessions de code effectives par semaine**, pas 4. La cible reste 4, mais les vacances scolaires, les semaines chargées et les corrections de bugs consomment le quatrième créneau. Soit environ 13 sessions par mois.

| Phase | Sessions | Horizon | Ce qui est acquis à la fin |
| --- | --- | --- | --- |
| 1 — Consolidation du socle | S11–S18 | fin septembre 2026 | Données fiables, tests en CI, historique sauvegardable, repo présentable |
| 2 — Coquille Android | S19–S26 | fin octobre 2026 | Une vraie app installable, piste de test fermé ouverte sur le Play Store |
| 3 — Notifications, le cœur | S27–S36 | fin novembre 2026 | Rappel quotidien programmé, mesuré, et qui fait revenir |
| 4 — Comptes et push serveur | S37–S48 | mi-janvier 2027 | Compte, synchronisation, notification intelligente côté serveur |
| 5 — Le foyer | S49–S60 | fin février 2027 | Multi-profils multi-appareils, défis et classement bienveillant |
| 6 — Bêta et monétisation | S61+ | mars 2027 | Publication publique, AdMob, premiers chiffres de rétention |

**Risque principal identifié** : ce projet à 15 min/jour tourne en parallèle de l'idle game à 1 h/jour. Si une semaine saute, c'est toujours celle d'EcoQuest. À arbitrer explicitement plutôt que subir.

---

## PISTE A — Construire l'appli

### Phase 0 et 1 — Fondations et MVP solo

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

### Phase 1bis — Consolidation du socle (S11–S18)

Rien de neuf pour l'utilisateur, mais tout ce qui suit s'appuie dessus.

- [ ] **S11** — *« Crée `.github/workflows/tests.yml` : à chaque push sur `main` et sur chaque PR, exécuter `node --test tests/`. Aucune dépendance npm. Ajoute le badge de statut dans README.md si le fichier existe, sinon dis-le moi. »*
- [ ] **S12** — *« Ajoute dans `js/state.js` un export de tout l'état en JSON et un import avec validation, exposés par deux boutons sur l'écran Profil. L'import refuse un fichier invalide sans écraser l'état existant. Tests inclus. »*
- [ ] **S13** — *« Vérifie un par un les gestes de `data/gestes.json` marqués `a_verifier: true` contre les ordres de grandeur ADEME / Impact CO2. Corrige la valeur et la source, ou retire le geste du catalogue si tu ne peux pas le sourcer. Dis-moi lesquels tu as retirés. »*
- [ ] **S14** — *« Même travail pour `EQUIVALENCES_IMPACT` dans `js/gamification.js` : source précise pour chaque facteur, ou retrait de l'équivalence. »*
- [ ] **S15** — *« Écris README.md : ce qu'est EcoQuest, la promesse, une capture, la stack, comment lancer les tests, la licence. Écrit pour un visiteur extérieur, pas pour moi. Ajoute aussi LICENSE (MIT). »*
- [ ] **S16** — *« Onboarding en 3 écrans : prénom, 3 catégories prioritaires, heure de rappel souhaitée. Les gestes du jour tiennent compte des priorités. L'heure est stockée mais pas encore utilisée. »*
- [ ] **S17** — *« Historique : calendrier du mois avec les jours actifs colorés, sur l'écran Profil. »*
- [ ] **S18** — *« Passe d'audit : accessibilité, contraste, taille des cibles, performance au chargement. Corrige les 5 problèmes les plus importants et liste ce que tu laisses de côté. »*

🖥️ **Hors session, à faire en parallèle** : mettre une description et des topics sur le repo GitHub ; créer le compte Google Play Console (25 $, vérification d'identité, compter 2 à 5 jours).

### Phase 2 — Coquille Android (S19–S26)

Objectif : une app installable depuis le Play Store, buildée sans jamais ouvrir Android Studio.

- [ ] **S19** — *« Ajoute `capacitor.config.json` (appId `app.ecoquest`, appName EcoQuest, `webDir` à la racine) et le `package.json` minimal des dépendances Capacitor. Rien à installer de mon côté : ces fichiers ne servent qu'à la CI. »*
- [ ] **S20** — *« Crée `.github/workflows/android.yml` : sur tag `v*`, installer les dépendances, `npx cap add android`, builder un APK de debug non signé et le publier comme artifact du workflow. Le dossier `/android` reste hors du repo (`.gitignore`). »*
- [ ] **S21** — Tester : tag, télécharger l'APK depuis l'onglet Actions, l'installer sur ton téléphone. Session = noter ce qui casse dans la WebView.
- [ ] **S22** — *« Corrige : [ce que tu as vu]. »*
- [ ] **S23** — 🖥️ **Hors session** : générer le keystore de signature (`keytool`), le déposer en secret de dépôt GitHub en base64 avec son mot de passe. C'est la seule étape de tout le projet qui demande un ordinateur, environ 30 minutes.
- [ ] **S24** — *« Fais évoluer `android.yml` : builder un AAB signé avec le keystore stocké dans les secrets, et le publier comme artifact. Ne logue jamais le keystore ni les mots de passe. »*
- [ ] **S25** — 🖥️ **Hors session** : créer la fiche Play Store (titre, description courte et longue, captures, icône), déposer `privacy.html` sur GitHub Pages et renseigner son URL, puis ouvrir une **piste de test fermé**.
- [ ] **S26** — ✅ **Jalon** : recruter 12 testeurs (famille, amis, collègues) sur la piste fermée. Le Play Store exige 12 testeurs actifs pendant 14 jours avant toute publication publique sur un compte personnel — c'est le vrai chemin critique, il démarre maintenant.

### Phase 3 — Notifications, le cœur du produit (S27–S36)

- [ ] **S27** — *« Crée `js/notifications.js` : programmation d'un rappel local quotidien à l'heure choisie dans l'onboarding, avec `@capacitor/local-notifications`. Annulation propre, reprogrammation au changement d'heure. Tests sur la logique de calcul de la prochaine échéance. »*
- [ ] **S28** — *« La demande d'autorisation de notification n'apparaît qu'après la première validation de geste, dans un écran qui explique la valeur en une phrase. Jamais au premier lancement. Si l'utilisateur refuse, ne jamais redemander. »*
- [ ] **S29** — *« Le contenu de la notification cite le geste du jour et son bénéfice concret, jamais un rappel générique. Écris 10 variantes et tire au sort. »*
- [ ] **S30** — *« Réglages de notification sur l'écran Profil : activer/désactiver, changer l'heure, en deux taps maximum. »*
- [ ] **S31** — *« Quand l'app est ouverte depuis une notification, enregistre-le dans l'état et affiche directement le geste du jour. Base du taux d'action. »*
- [ ] **S32** — *« Écran caché (5 taps sur le numéro de version) : notifications envoyées, ouvertes depuis notification, taux d'action sur 7 et 30 jours. C'est mon tableau de bord, pas celui de l'utilisateur. »*
- [ ] **S33** — *« Notification de série en danger : si aucun geste validé à 20 h et qu'une série est en cours, un rappel unique. Jamais deux notifications le même jour. »*
- [ ] **S34–S35** — Corrections issues de l'usage réel.
- [ ] **S36** — ✅ **Jalon** : utilise l'app 14 jours avec les notifications actives. Session = noter le taux d'action réel et 3 frictions. Si le taux d'action est sous 20 %, le problème est le contenu, pas la technique : on itère avant d'avancer.

### Phase 4 — Comptes et push serveur (S37–S48)

- [ ] **S37** — 🖥️ **Hors session** : créer le projet Supabase (offre gratuite).
- [ ] **S38** — *« Propose le schéma Postgres : profils, foyers, gestes validés, séries, historique de notifications. RLS activée dès la création. Donne-moi le SQL à coller dans l'éditeur Supabase. »*
- [ ] **S39** — *« Crée `js/sync.js` : client Supabase importé en ES module depuis un CDN, authentification par lien magique. »*
- [ ] **S40** — *« Migration du localStorage vers la base à la première connexion, sans perte. L'app reste pleinement utilisable hors ligne et sans compte. »*
- [ ] **S41–S42** — Synchronisation bidirectionnelle, résolution de conflits simple (dernier écrit gagne par jour).
- [ ] **S43** — *« Cron GitHub Actions qui ping la base chaque jour : un projet Supabase gratuit se met en pause après 7 jours sans requête. »*
- [ ] **S44–S45** — Edge Function de scheduling : décide quoi envoyer à qui et quand, selon l'historique et le taux d'action.
- [ ] **S46–S47** — Push FCM depuis l'Edge Function, en complément des notifications locales.
- [ ] **S48** — ✅ **Jalon** : la notification du jour est choisie côté serveur et mesurée.

### Phase 5 — Le foyer, ton différenciateur (S49–S60)

- [ ] **S49–S50** — Foyer multi-profils, désormais multi-appareils grâce aux comptes.
- [ ] **S51** — Mode enfant : textes simplifiés, gestes adaptés, avatars.
- [ ] **S52** — Défi hebdomadaire de foyer : objectif collectif, barre commune.
- [ ] **S53** — Classement bienveillant (qui a le plus progressé, pas qui a le plus de points).
- [ ] **S54** — Récompenses familiales définies par les parents.
- [ ] **S55** — Défis entre foyers par lien d'invitation.
- [ ] **S56** — Carte d'impact partageable au format story, exportable.
- [ ] **S57–S59** — Corrections issues des tests en famille et chez les testeurs.
- [ ] **S60** — ✅ **Jalon** : 5 foyers utilisent l'app depuis plus de 30 jours.

### Phase 6 — Bêta et monétisation (S61+)

- [ ] **S61–S62** — Mesure anonyme : rétention J7 / J30, gestes par foyer. **C'est ta preuve d'impact.**
- [ ] **S63** — Politique de confidentialité RGPD complète, consentement, droit à l'effacement.
- [ ] **S64–S65** — AdMob : un emplacement discret, jamais sur l'écran de validation d'un geste.
- [ ] **S66** — Passage en production sur le Play Store.
- [ ] **S67+** — Défis thématiques (écoles, entreprises, collectivités), traduction EN, Play Billing.

---

## PISTE B — Le rayonnement (chaque vendredi)

La reconnaissance ne viendra pas du code, elle viendra de ce que tu **montres** et **prouves**. Cette piste a trois mois de retard sur la piste A : c'est le déséquilibre le plus coûteux du projet, et le moins cher à corriger.

- [ ] **V1** — Post LinkedIn : « Je construis une appli écologique 15 min par jour, depuis mon téléphone, avec une IA. Épisode 1. » À publier **ce vendredi**, sans attendre que l'app soit présentable.
- [ ] **V2** — Le repo comme vitrine : description, topics, README soigné (dépend de S15).
- [ ] **V3–V8** — Un post par semaine : ce qui a été construit, ce qui a raté, une capture.
- [ ] **V9** — Premier chiffre réel (gestes validés, testeurs, taux d'action sur notification).
- [ ] **V10+** — Contacter 1 acteur par mois (association, école, média éco, collectivité) avec tes chiffres.

L'angle « cadre dirigeant + 15 min/jour + IA + famille » est un sujet média en soi. Le taux d'action sur notification sera ton chiffre le plus intéressant : personne ne le publie.

---

## Indicateurs à suivre

- Sessions de code réalisées / semaine (cible réaliste : 3)
- Posts de rayonnement publiés / mois (cible : 4)
- **Taux d'action sur notification** (cible : > 25 %) — l'indicateur central du produit
- Rétention J7 des testeurs (cible bêta : > 30 %)
- Foyers actifs à J30
