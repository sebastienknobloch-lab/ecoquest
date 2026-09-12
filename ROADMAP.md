# EcoQuest — Roadmap en sessions de 15 minutes

## Protocole d'une session (15 min, depuis le téléphone)
| Temps | Action |
|---|---|
| 0–2 min | Ouvrir Claude → Code → repo `ecoquest`. Coller le prompt du jour. |
| 2–10 min | Claude Code travaille. Tu ne touches à rien. |
| 10–13 min | Tester l'appli sur ton téléphone (les 3 étapes données par Claude). |
| 13–15 min | Valider/merger. Cocher la session ci-dessous. |

Règles :
- **Session ratée = session suivante, pas de rattrapage.** On ne double jamais.
- Si ça bugue : le prompt du lendemain est simplement *"Corrige : [ce que tu as vu]"*.
- **Le vendredi, pas de code** : la session sert au rayonnement (voir Piste B).

---

## PISTE A — Construire l'appli

### Phase 0 — Fondations (S1–S3)
- [ ] **S1** — Hors Claude Code : créer le repo GitHub `ecoquest` (public), y déposer `CLAUDE.md`, activer GitHub Pages sur `main`. Connecter le repo dans Claude Code.
- [ ] **S2** — *"Lis CLAUDE.md. Crée le squelette de l'architecture cible avec un écran d'accueil 'EcoQuest' mobile-first, un manifest et un service worker pour que l'appli soit installable. Donne-moi l'URL GitHub Pages à tester."*
- [ ] **S3** — *"Ajoute une barre de navigation basse à 4 onglets (Aujourd'hui, Défis, Foyer, Profil) avec un écran vide pour chacun. Pouces-friendly."*

### Phase 1 — MVP solo (S4–S15)
- [ ] **S4** — *"Crée data/gestes.json avec 30 éco-gestes du quotidien répartis en 5 catégories (énergie, alimentation, déplacements, déchets, numérique). Pour chacun : id, libellé court, catégorie, difficulté 1-3, points, CO2 évité estimé en g, source. Utilise uniquement des ordres de grandeur ADEME / Impact CO2 et marque 'à vérifier' si incertain."*
- [ ] **S5** — *"Écran Aujourd'hui : propose 3 gestes du jour tirés du catalogue, cochables en un tap, avec une micro-animation de validation. Sauvegarde dans state.js."*
- [ ] **S6** — *"Implémente les points et 5 niveaux dans gamification.js avec tests. Affiche la barre de progression vers le niveau suivant en haut de l'écran Aujourd'hui."*
- [ ] **S7** — *"Ajoute la série (streak) de jours consécutifs, avec 1 'joker' par semaine pour ne pas casser la série. Tests inclus."*
- [ ] **S8** — *"Ajoute 8 badges (premier geste, 7 jours, 5 catégories touchées, etc.). Écran Profil : grille des badges obtenus / à débloquer."*
- [ ] **S9** — *"Compteur d'impact cumulé en équivalents parlants (km en voiture évités, charges de smartphone…), avec la mention 'estimation' et la source."*
- [ ] **S10** — *"Onboarding en 3 écrans : prénom, 3 catégories prioritaires, heure de rappel. Les gestes du jour tiennent compte des priorités."*
- [ ] **S11** — *"Permettre d'ajouter un geste personnalisé (libellé + catégorie), sans chiffre CO2."*
- [ ] **S12** — *"Historique : calendrier du mois avec les jours actifs colorés."*
- [ ] **S13** — *"Passe d'audit : accessibilité, contraste, taille des cibles, performance. Corrige les 5 problèmes les plus importants."*
- [ ] **S14** — *"Notification de rappel quotidienne locale à l'heure choisie, désactivable. Explique-moi les limites iOS."*
- [ ] **S15** — ✅ **Jalon MVP** : utilise l'appli toi-même 7 jours avant la phase 2. Session = noter 3 frictions.

### Phase 2 — Le foyer, ton différenciateur (S16–S25)
- [ ] **S16** — *"Transforme l'état en foyer multi-profils sur le même appareil (parents + enfants), avec sélection du profil actif. Migration douce des données existantes."*
- [ ] **S17** — *"Mode enfant : textes simplifiés, gestes adaptés, avatars."*
- [ ] **S18** — *"Défi hebdomadaire de foyer : objectif collectif de points, barre commune."*
- [ ] **S19** — *"Classement bienveillant du foyer (qui a le plus progressé, pas qui a le plus de points)."*
- [ ] **S20** — *"Récompenses familiales définies par les parents (ex : soirée film choisie par le gagnant)."*
- [ ] **S21–S23** — Corrections issues de tes tests en famille.
- [ ] **S24** — *"Carte d'impact partageable : génère une image verticale (format story) du bilan de la semaine du foyer, exportable."*
- [ ] **S25** — ✅ **Jalon** : 5 foyers testeurs (amis, collègues) utilisent l'appli.

### Phase 3 — Données et social (S26–S35)
- [ ] **S26–S27** — Backend Supabase (offre gratuite) : comptes, synchronisation du foyer.
- [ ] **S28–S29** — Défis entre foyers via lien d'invitation.
- [ ] **S30** — Mesure anonyme : rétention J7 / J30, gestes par foyer. **C'est ta preuve d'impact.**
- [ ] **S31–S35** — Landing page, politique de confidentialité RGPD, itérations.

### Phase 4 — Échelle (S36+)
Bêta ouverte, défis thématiques (écoles, entreprises, collectivités), traduction EN.

---

## PISTE B — Le rayonnement (1 vendredi sur 1)
La reconnaissance ne viendra pas du code, elle viendra de ce que tu **montres** et **prouves**.

- [ ] **V1** — Post LinkedIn : "Je construis une appli écologique 15 min par jour, depuis mon téléphone, avec une IA. Épisode 1."
- [ ] **V2–V6** — Un post par semaine : ce qui a été construit, ce qui a raté, une capture.
- [ ] **V7** — Premier chiffre réel (nb de gestes, foyers testeurs).
- [ ] **V8+** — Contacter 1 acteur par mois (association, école, média éco, collectivité) avec tes chiffres.

Le récit "cadre dirigeant + 15 min/jour + IA + famille" est un angle média en soi.

---

## Indicateurs à suivre
- Sessions réalisées / semaine (cible : 4)
- Foyers actifs à J30
- Rétention J7 (cible bêta : > 30 %)
- Abonnés au récit build in public
