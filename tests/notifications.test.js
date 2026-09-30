import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  parserHeure,
  calculerProchaineEcheance,
  doitProposerPermission,
  genererContenuRappel,
  gesteDuRappel,
  peutActiverRappel,
  contenuRappelPourAujourdhui,
  avecDelaiMax,
  enregistrerOuvertureDepuisNotification,
  OUVERTURES_MAX,
  suivreReglageRappel,
  compterRappelsEnvoyes,
  compterOuvertures,
  statistiquesNotifications,
  JOURNAL_RAPPEL_MAX,
  fusionnerJournauxNotifications,
  serieEnDangerLe,
  genererContenuSerieEnDanger,
  planifierRappels,
  JOURS_PROGRAMMES,
} from "../js/notifications.js";
import { selectionDuJour, semaineISO } from "../js/gamification.js";
import { dateDuJour } from "../js/state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gestes = JSON.parse(
  readFileSync(path.join(__dirname, "../data/gestes.json"), "utf-8")
);
const gesteTest = { id: "geste-test", libelle: "Éteindre la lumière en sortant d'une pièce", co2_evite_g: 10 };

// parserHeure : découpe "HH:MM" en heure/minute numériques
{
  assert.deepEqual(parserHeure("19:00"), { heure: 19, minute: 0 });
  assert.deepEqual(parserHeure("07:05"), { heure: 7, minute: 5 });
}

// calculerProchaineEcheance : heure du jour pas encore passée -> aujourd'hui
{
  const maintenant = new Date(2026, 8, 20, 10, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getFullYear(), 2026);
  assert.equal(echeance.getMonth(), 8);
  assert.equal(echeance.getDate(), 20);
  assert.equal(echeance.getHours(), 19);
  assert.equal(echeance.getMinutes(), 0);
}

// calculerProchaineEcheance : heure du jour déjà passée -> demain
{
  const maintenant = new Date(2026, 8, 20, 20, 30, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getDate(), 21);
  assert.equal(echeance.getHours(), 19);
  assert.equal(echeance.getMinutes(), 0);
}

// calculerProchaineEcheance : pile à l'heure -> considérée comme passée, reportée à demain
{
  const maintenant = new Date(2026, 8, 20, 19, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getDate(), 21);
}

// calculerProchaineEcheance : gère le changement de mois
{
  const maintenant = new Date(2026, 8, 30, 20, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getMonth(), 9);
  assert.equal(echeance.getDate(), 1);
}

// calculerProchaineEcheance : gère le changement d'année
{
  const maintenant = new Date(2026, 11, 31, 20, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getFullYear(), 2027);
  assert.equal(echeance.getMonth(), 0);
  assert.equal(echeance.getDate(), 1);
}

// calculerProchaineEcheance : une reprogrammation à une heure plus tôt dans la
// journée (changement d'heure côté utilisateur) recalcule bien depuis l'heure
// actuelle, pas depuis une échéance précédemment programmée
{
  const maintenant = new Date(2026, 8, 20, 18, 0, 0);
  const echeanceAvant = calculerProchaineEcheance("19:00", maintenant);
  const echeanceApres = calculerProchaineEcheance("08:00", maintenant);
  assert.equal(echeanceAvant.getDate(), 20);
  assert.equal(echeanceApres.getDate(), 21);
  assert.equal(echeanceApres.getHours(), 8);
}

// doitProposerPermission : jamais au premier lancement, aucun geste encore validé
{
  const etat = { gestesCochesParDate: {}, notifications: { permissionDemandee: false, permissionAccordee: null } };
  assert.equal(doitProposerPermission(etat), false);
}

// doitProposerPermission : dès le premier geste validé, si jamais encore proposée
{
  const etat = {
    gestesCochesParDate: { "2026-09-20": ["geste-a"] },
    notifications: { permissionDemandee: false, permissionAccordee: null },
  };
  assert.equal(doitProposerPermission(etat), true);
}

// doitProposerPermission : déjà proposée une fois (acceptée) -> ne redemande jamais
{
  const etat = {
    gestesCochesParDate: { "2026-09-20": ["geste-a"] },
    notifications: { permissionDemandee: true, permissionAccordee: true },
  };
  assert.equal(doitProposerPermission(etat), false);
}

// doitProposerPermission : déjà proposée une fois (refusée) -> ne redemande jamais non plus
{
  const etat = {
    gestesCochesParDate: { "2026-09-20": ["geste-a"] },
    notifications: { permissionDemandee: true, permissionAccordee: false },
  };
  assert.equal(doitProposerPermission(etat), false);
}

// doitProposerPermission : `notifications` absent (état ancien avant migration) -> traité
// comme jamais demandé, ne plante pas
{
  const etat = { gestesCochesParDate: { "2026-09-20": ["geste-a"] } };
  assert.equal(doitProposerPermission(etat), true);
}

// genererContenuRappel : cite toujours le libellé du geste et son bénéfice
// concret (co2_evite_g)
{
  for (let i = 0; i < 10; i++) {
    const contenu = genererContenuRappel(gesteTest, () => i / 10);
    assert.ok(contenu.body.includes(gesteTest.libelle), `variante ${i} : geste cité`);
    assert.ok(contenu.body.includes(String(gesteTest.co2_evite_g)), `variante ${i} : chiffre cité`);
    assert.ok(contenu.body.includes("estimation"), `variante ${i} : présenté comme une estimation`);
  }
}

// genererContenuRappel : exactement 10 variantes, tirées au sort via `alea`
// (0 -> première variante, juste sous 1 -> dernière, sans dépasser le tableau)
{
  const contenus = new Set();
  for (let i = 0; i < 10; i++) {
    contenus.add(JSON.stringify(genererContenuRappel(gesteTest, () => i / 10)));
  }
  assert.equal(contenus.size, 10, "les 10 tirages possibles donnent 10 contenus distincts");

  const dernier = genererContenuRappel(gesteTest, () => 0.999999);
  assert.ok(dernier.body.includes(gesteTest.libelle));
}

// genererContenuRappel : deux gestes différents ne donnent jamais le même
// contenu pour un même tirage (le geste, pas seulement la formulation, varie)
{
  const autreGeste = { id: "autre", libelle: "Manger un repas végétarien", co2_evite_g: 990 };
  const contenuA = genererContenuRappel(gesteTest, () => 0.42);
  const contenuB = genererContenuRappel(autreGeste, () => 0.42);
  assert.notEqual(contenuA.body, contenuB.body);
}

// gesteDuRappel : cite le premier des 3 gestes du jour, cohérent avec ce que
// l'écran Aujourd'hui affiche pour la même date (même sélection déterministe)
{
  const dateISO = "2026-09-21";
  const attendu = selectionDuJour(gestes, dateISO)[0];
  assert.deepEqual(gesteDuRappel(gestes, dateISO), attendu);
}

// gesteDuRappel : respecte les catégories prioritaires, comme selectionDuJour
{
  const dateISO = "2026-09-21";
  const prioritaires = ["dechets", "numerique", "energie"];
  const attendu = selectionDuJour(gestes, dateISO, prioritaires)[0];
  const obtenu = gesteDuRappel(gestes, dateISO, prioritaires);
  assert.deepEqual(obtenu, attendu);
  assert.ok(prioritaires.includes(obtenu.categorie));
}

// peutActiverRappel : seule une autorisation système déjà accordée permet
// d'activer le réglage depuis Profil — jamais si jamais demandée ou refusée
{
  assert.equal(peutActiverRappel({ notifications: { permissionAccordee: true } }), true);
  assert.equal(peutActiverRappel({ notifications: { permissionAccordee: false } }), false);
  assert.equal(peutActiverRappel({ notifications: { permissionAccordee: null } }), false);
  assert.equal(peutActiverRappel({}), false);
}

// contenuRappelPourAujourdhui : cite le même geste que gesteDuRappel() pour
// la date du jour et les mêmes catégories prioritaires
{
  const state = { onboarding: { categoriesPrioritaires: ["dechets", "numerique", "energie"] } };
  const attendu = gesteDuRappel(gestes, dateDuJour(), state.onboarding.categoriesPrioritaires);
  const contenu = contenuRappelPourAujourdhui(gestes, state, () => 0.5);
  assert.ok(contenu.body.includes(attendu.libelle));
  assert.ok(contenu.body.includes(String(attendu.co2_evite_g)));
}

// contenuRappelPourAujourdhui : deux dates différentes, deux gestes cités
// différents — c'est pourquoi le rappel (répété à l'identique par Android)
// est reprogrammé à chaque démarrage de l'app (js/app.js)
{
  const state = { onboarding: { categoriesPrioritaires: [] } };
  const [jour1, jour2] = ["2026-09-30", "2026-10-01"];
  const geste1 = gesteDuRappel(gestes, jour1, []);
  const geste2 = gesteDuRappel(gestes, jour2, []);
  assert.notEqual(geste1.id, geste2.id);
  const contenu1 = contenuRappelPourAujourdhui(gestes, state, () => 0.5, jour1);
  const contenu2 = contenuRappelPourAujourdhui(gestes, state, () => 0.5, jour2);
  assert.ok(contenu1.body.includes(geste1.libelle));
  assert.ok(contenu2.body.includes(geste2.libelle));
  assert.ok(!contenu1.body.includes(geste2.libelle));
  assert.ok(!contenu2.body.includes(geste1.libelle));
}

// contenuRappelPourAujourdhui : catalogue vide ou absent -> null, jamais
// de contenu générique (l'appelant ne programme alors aucun rappel)
{
  assert.equal(contenuRappelPourAujourdhui([], {}), null);
  assert.equal(contenuRappelPourAujourdhui(null, {}), null);
}

// contenuRappelPourAujourdhui : catalogue présent -> contenu citant le
// libellé et le chiffre du geste du jour
{
  const state = { onboarding: { categoriesPrioritaires: [] } };
  const dateISO = "2026-09-30";
  const attendu = gesteDuRappel(gestes, dateISO, []);
  const contenu = contenuRappelPourAujourdhui(gestes, state, () => 0, dateISO);
  assert.ok(contenu.title);
  assert.ok(contenu.body.includes(attendu.libelle));
  assert.ok(contenu.body.includes(String(attendu.co2_evite_g)));
}

// avecDelaiMax : une promesse qui résout avant le délai renvoie sa valeur normalement
{
  const resultat = await avecDelaiMax(Promise.resolve("ok"), 50);
  assert.equal(resultat, "ok");
}

// avecDelaiMax : une promesse qui ne se résout jamais (import() ou appel au
// pont natif qui reste bloqué, symptôme reproduit sur téléphone : le bouton
// "Activer les rappels" restait désactivé pour toujours) est rejetée au bout
// du délai plutôt que de bloquer l'appelant indéfiniment
{
  await assert.rejects(avecDelaiMax(new Promise(() => {}), 20));
}

// avecDelaiMax : une promesse qui rejette avant le délai propage son erreur normalement
{
  await assert.rejects(avecDelaiMax(Promise.reject(new Error("échec réseau")), 50), /échec réseau/);
}

console.log("✅ tests notifications : OK");

// enregistrerOuvertureDepuisNotification : journalise l'ouverture, bascule
// sur Aujourd'hui, ne modifie jamais l'état reçu (session 33)
{
  const avant = {
    points: 5,
    activeTab: "profil",
    notifications: { permissionDemandee: true, permissionAccordee: true, actif: true, ouvertures: [] },
  };
  const maintenant = new Date("2026-09-23T19:02:00Z");
  const apres = enregistrerOuvertureDepuisNotification(avant, 1, maintenant);
  assert.equal(apres.activeTab, "aujourdhui");
  assert.deepEqual(apres.notifications.ouvertures, [{ le: "2026-09-23T19:02:00.000Z", notificationId: 1 }]);
  assert.equal(apres.notifications.actif, true);
  assert.equal(apres.points, 5);
  assert.equal(avant.activeTab, "profil");
  assert.deepEqual(avant.notifications.ouvertures, []);
}

// Journal absent (état antérieur à la session 33) : créé à la volée
{
  const apres = enregistrerOuvertureDepuisNotification({ notifications: { actif: true } }, null, new Date("2026-09-23T19:00:00Z"));
  assert.equal(apres.notifications.ouvertures.length, 1);
  assert.equal(apres.notifications.ouvertures[0].notificationId, null);
}

// Journal plafonné : les plus anciennes ouvertures partent en premier
{
  let etat = { notifications: { ouvertures: [] } };
  for (let i = 0; i < OUVERTURES_MAX + 5; i++) {
    etat = enregistrerOuvertureDepuisNotification(etat, i, new Date(Date.UTC(2026, 0, 1 + i)));
  }
  assert.equal(etat.notifications.ouvertures.length, OUVERTURES_MAX);
  assert.equal(etat.notifications.ouvertures[0].notificationId, 5);
  assert.equal(etat.notifications.ouvertures.at(-1).notificationId, OUVERTURES_MAX + 4);
}

// --- Tableau de bord de l'écran de debug (session 34) ---
// Dates construites en heure locale : les tests ne dépendent pas du fuseau.
const local = (j, h = 0, m = 0) => new Date(2026, 8, j, h, m);
const entree = (date, actif, heure = "19:00") => ({ le: date.toISOString(), actif, heure });

// suivreReglageRappel : rien à noter pour un rappel jamais activé
{
  const etat = { onboarding: { heureRappel: "19:00" }, notifications: { actif: false } };
  assert.equal(suivreReglageRappel(etat, local(20)), etat);
}

// suivreReglageRappel : activation, puis même réglage (inchangé), puis changement d'heure
{
  let etat = { onboarding: { heureRappel: "19:00" }, notifications: { actif: true } };
  etat = suivreReglageRappel(etat, local(20, 10));
  assert.deepEqual(etat.notifications.journalRappel, [entree(local(20, 10), true)]);
  assert.equal(suivreReglageRappel(etat, local(21)), etat);
  etat = suivreReglageRappel({ ...etat, onboarding: { heureRappel: "08:30" } }, local(21, 12));
  assert.deepEqual(etat.notifications.journalRappel.at(-1), entree(local(21, 12), true, "08:30"));
  etat = suivreReglageRappel({ ...etat, notifications: { ...etat.notifications, actif: false } }, local(22));
  assert.equal(etat.notifications.journalRappel.length, 3);
  assert.equal(etat.notifications.journalRappel.at(-1).actif, false);
}

// suivreReglageRappel : journal plafonné
{
  let etat = { onboarding: { heureRappel: "19:00" }, notifications: { actif: true } };
  for (let i = 0; i < JOURNAL_RAPPEL_MAX + 5; i++) {
    etat = suivreReglageRappel({ ...etat, notifications: { ...etat.notifications, actif: i % 2 === 0 } }, local(1, 0, i));
  }
  assert.equal(etat.notifications.journalRappel.length, JOURNAL_RAPPEL_MAX);
}

// compterRappelsEnvoyes : actif depuis longtemps, rappel du jour pas encore passé
{
  const journal = [entree(local(1), true)];
  assert.equal(compterRappelsEnvoyes(journal, 7, local(24, 18)), 6);
  assert.equal(compterRappelsEnvoyes(journal, 7, local(24, 19)), 7);
  assert.equal(compterRappelsEnvoyes(journal, 30, local(24, 20)), 24); // du 1er au 24
  assert.equal(compterRappelsEnvoyes([], 7, local(24, 20)), 0);
}

// compterRappelsEnvoyes : activé après l'heure du jour, puis désactivé
{
  const journal = [entree(local(20, 19, 30), true), entree(local(23, 12), false)];
  // 21 et 22 seulement (le 20 : activé après 19 h ; le 23 : désactivé avant 19 h)
  assert.equal(compterRappelsEnvoyes(journal, 7, local(24, 22)), 2);
}

// compterRappelsEnvoyes : changement d'heure en cours de journée, les deux rappels partent
{
  const journal = [entree(local(1), true, "08:00"), entree(local(24, 9), true, "20:00")];
  assert.equal(compterRappelsEnvoyes(journal, 1, local(24, 21)), 2);
  assert.equal(compterRappelsEnvoyes(journal, 1, local(24, 19)), 1);
}

// compterOuvertures : uniquement dans la fenêtre des N derniers jours calendaires
{
  const ouvertures = [local(10, 19, 5), local(18, 19, 1), local(24, 19, 2)].map((d) => ({ le: d.toISOString(), notificationId: 1 }));
  assert.equal(compterOuvertures(ouvertures, 7, local(24, 20)), 2);
  assert.equal(compterOuvertures(ouvertures, 30, local(24, 20)), 3);
  assert.equal(compterOuvertures(undefined, 7, local(24, 20)), 0);
}

// statistiquesNotifications : taux d'action, null sans envoi, plafonné à 100 %
{
  const etat = {
    notifications: {
      journalRappel: [entree(local(1), true)],
      ouvertures: [local(23, 19, 1), local(24, 19, 1)].map((d) => ({ le: d.toISOString(), notificationId: 1 })),
    },
  };
  assert.deepEqual(statistiquesNotifications(etat, 7, local(24, 20)), { envoyees: 7, ouvertes: 2, tauxAction: 2 / 7 });
  assert.deepEqual(statistiquesNotifications({ notifications: {} }, 7, local(24, 20)), { envoyees: 0, ouvertes: 0, tauxAction: null });
  const trop = { notifications: { journalRappel: [entree(local(24, 10), true)], ouvertures: etat.notifications.ouvertures } };
  assert.equal(statistiquesNotifications(trop, 7, local(24, 20)).tauxAction, 1);
}

// fusionnerJournauxNotifications : même enchaînement que persist() (js/app.js).
{
  const persister = (actuel, suivant, maintenant) =>
    suivreReglageRappel(fusionnerJournauxNotifications(actuel, suivant), maintenant);
  const t = (h) => new Date(Date.UTC(2026, 8, 30, h));
  const reglage = (etat, actif, heure) => ({
    ...etat,
    onboarding: { ...etat.onboarding, heureRappel: heure },
    notifications: { ...etat.notifications, actif },
  });

  // Rendu de Profil : rappel actif à 19:00, journal à une entrée.
  let app = { onboarding: { heureRappel: "19:00" }, notifications: { actif: true, journalRappel: [entree(t(8), true)], ouvertures: [] } };
  const copieVue = app;

  // 1er réglage (désactivation) : persist() ajoute l'entrée « désactivé ».
  app = persister(app, reglage(copieVue, false, "19:00"), t(9));
  assert.equal(app.notifications.journalRappel.length, 2);

  // 2e réglage depuis la copie périmée de la vue (réactivation) : l'entrée
  // « désactivé » survit, et la réactivation est bien notée.
  app = persister(app, reglage(copieVue, true, "19:00"), t(10));
  assert.deepEqual(
    app.notifications.journalRappel.map((e) => e.actif),
    [true, false, true]
  );

  // 19:00 -> 08:00 -> 21:30 depuis la même copie : l'entrée 08:00 survit.
  let app2 = { onboarding: { heureRappel: "19:00" }, notifications: { actif: true, journalRappel: [entree(t(8), true)], ouvertures: [] } };
  const copie2 = app2;
  app2 = persister(app2, reglage(copie2, true, "08:00"), t(9));
  app2 = persister(app2, reglage(copie2, true, "21:30"), t(10));
  assert.deepEqual(app2.notifications.journalRappel.map((e) => e.heure), ["19:00", "08:00", "21:30"]);

  // Une ouverture ajoutée entre deux rendus survit aussi, et une nouvelle
  // ouverture envoyée par l'appelant est bien ajoutée.
  const avecOuverture = enregistrerOuvertureDepuisNotification(app, 1, t(11));
  const apres = persister(avecOuverture, { ...copieVue, activeTab: "profil" }, t(12));
  assert.equal(apres.notifications.ouvertures.length, 1);
  assert.equal(apres.activeTab, "profil");
  const encore = persister(apres, enregistrerOuvertureDepuisNotification(apres, 2, t(13)), t(13));
  assert.deepEqual(encore.notifications.ouvertures.map((o) => o.notificationId), [1, 2]);

  // Plafond conservé après fusion.
  const plein = Array.from({ length: OUVERTURES_MAX }, (_, i) => ({ le: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(), notificationId: i }));
  const fusion = fusionnerJournauxNotifications({ notifications: { ouvertures: plein } }, { notifications: { ouvertures: [{ le: t(1).toISOString(), notificationId: 999 }] } });
  assert.equal(fusion.notifications.ouvertures.length, OUVERTURES_MAX);
  assert.equal(fusion.notifications.ouvertures.at(-1).notificationId, 999);
}

// --- Série en danger (session 35) ---
{
  const alea = () => 0;
  // Mercredi 30/09/2026. Série de 5 jours, dernier geste validé la veille.
  const etat = (surcharges = {}) => ({
    gestesCochesParDate: {},
    streak: { actuel: 5, dernierJourValide: "2026-09-29", dernierJourViaJoker: false, jokerUtiliseDansStreak: false },
    joker: { disponible: 1, semaine: semaineISO("2026-09-30"), dejaUtilise: false },
    onboarding: { heureRappel: "19:00", categoriesPrioritaires: [] },
    notifications: { actif: true },
    ...surcharges,
  });
  const a = (jour, h, m = 0) => new Date(2026, 8, jour, h, m, 0, 0);
  const cle = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const unParJourAuPlus = (plan) => {
    const jours = plan.map((n) => cle(n.at));
    assert.equal(new Set(jours).size, jours.length, "jamais deux notifications le même jour");
    assert.equal(new Set(plan.map((n) => n.id)).size, plan.length, "identifiants uniques");
  };

  // serieEnDangerLe : série en cours, rien validé aujourd'hui -> en danger.
  assert.equal(serieEnDangerLe(etat(), "2026-09-30"), true);
  // Un geste validé aujourd'hui -> plus en danger.
  assert.equal(
    serieEnDangerLe(etat({ gestesCochesParDate: { "2026-09-30": ["g1"] } }), "2026-09-30"),
    false
  );
  // Pas de série en cours -> rien à sauver.
  assert.equal(serieEnDangerLe(etat({ streak: { actuel: 0, dernierJourValide: null } }), "2026-09-30"), false);
  // Série déjà cassée (dernier geste il y a 3 jours) -> pas en danger.
  assert.equal(serieEnDangerLe(etat({ streak: { actuel: 5, dernierJourValide: "2026-09-27" } }), "2026-09-30"), false);
  // Avant-veille + joker disponible cette semaine -> encore sauvable.
  const avantVeille = { actuel: 5, dernierJourValide: "2026-09-28" };
  assert.equal(serieEnDangerLe(etat({ streak: avantVeille }), "2026-09-30"), true);
  // Avant-veille, joker déjà utilisé cette semaine -> série perdue.
  assert.equal(
    serieEnDangerLe(etat({ streak: avantVeille, joker: { disponible: 0, semaine: semaineISO("2026-09-30") } }), "2026-09-30"),
    false
  );
  // Joker épuisé une semaine précédente : rechargé -> encore sauvable.
  assert.equal(
    serieEnDangerLe(etat({ streak: avantVeille, joker: { disponible: 0, semaine: "2026-W30" } }), "2026-09-30"),
    true
  );

  // Contenu : durée de la série, geste du jour, chiffre, « estimation ».
  const contenu = genererContenuSerieEnDanger(gesteTest, 5, alea);
  assert.match(contenu.title, /5 jours/);
  assert.match(contenu.body, /Éteindre la lumière/);
  assert.match(contenu.body, /10 g de CO2/);
  assert.match(contenu.body, /estimation/);
  assert.match(genererContenuSerieEnDanger(gesteTest, 1, alea).title, /1 jour(?!s)/);
  for (let i = 0; i < 3; i++) {
    const c = genererContenuSerieEnDanger(gesteTest, 3, () => i / 3);
    assert.ok(c.title && c.body.includes(gesteTest.libelle));
  }

  // Rappel désactivé ou catalogue vide : rien de programmé.
  assert.deepEqual(planifierRappels(etat({ notifications: { actif: false } }), gestes, a(30, 10), alea), []);
  assert.deepEqual(planifierRappels(etat(), [], a(30, 10), alea), []);

  // 10 h, rien validé, série en danger, rappel à 19 h : aujourd'hui une seule
  // notification, l'alerte de 20 h, qui remplace le rappel de 19 h.
  {
    const plan = planifierRappels(etat(), gestes, a(30, 10), alea);
    unParJourAuPlus(plan);
    assert.equal(plan.length, JOURS_PROGRAMMES);
    assert.equal(plan[0].type, "serie-en-danger");
    assert.equal(plan[0].at.getTime(), a(30, 20).getTime());
    assert.match(plan[0].title, /5 jours/);
    // Même geste que celui de l'écran Aujourd'hui.
    assert.ok(plan[0].body.includes(selectionDuJour(gestes, "2026-09-30")[0].libelle));
    // Jours suivants : rappel quotidien à 19 h (il sonne avant 20 h, il reste seul).
    assert.ok(plan.slice(1).every((n) => n.type === "quotidien" && n.at.getHours() === 19));
    // Chaque rappel cite le geste de son propre jour.
    assert.ok(plan[1].body.includes(selectionDuJour(gestes, "2026-10-01")[0].libelle));
  }

  // Même situation mais un geste déjà validé : pas d'alerte, rappel normal.
  {
    const plan = planifierRappels(
      etat({ gestesCochesParDate: { "2026-09-30": ["g1"] }, streak: { actuel: 6, dernierJourValide: "2026-09-30" } }),
      gestes,
      a(30, 10),
      alea
    );
    unParJourAuPlus(plan);
    assert.ok(plan.every((n) => n.type === "quotidien"));
    assert.equal(plan[0].at.getTime(), a(30, 19).getTime());
  }

  // 19 h 30 : le rappel de 19 h est déjà parti -> plus rien aujourd'hui,
  // même si la série est en danger (jamais deux notifications le même jour).
  {
    const plan = planifierRappels(etat(), gestes, a(30, 19, 30), alea);
    unParJourAuPlus(plan);
    assert.ok(plan.every((n) => cle(n.at) !== cle(a(30, 12))));
    assert.equal(plan.length, JOURS_PROGRAMMES - 1);
  }

  // 20 h 30, rappel à 21 h : alerte passée, le rappel de 21 h reste le seul.
  {
    const plan = planifierRappels(etat({ onboarding: { heureRappel: "21:00" } }), gestes, a(30, 20, 30), alea);
    assert.equal(plan[0].type, "quotidien");
    assert.equal(plan[0].at.getTime(), a(30, 21).getTime());
  }

  // Rappel à 21 h, geste validé aujourd'hui : demain la série sera en danger
  // à 20 h, avant le rappel -> l'alerte le remplace, même sans ouvrir l'app.
  // Après-demain aussi (joker disponible). Le jour suivant, série perdue :
  // rappel normal.
  {
    const plan = planifierRappels(
      etat({
        onboarding: { heureRappel: "21:00" },
        gestesCochesParDate: { "2026-09-30": ["g1"] },
        streak: { actuel: 6, dernierJourValide: "2026-09-30" },
      }),
      gestes,
      a(30, 10),
      alea
    );
    unParJourAuPlus(plan);
    assert.deepEqual(
      plan.slice(0, 4).map((n) => [n.type, n.at.getDate(), n.at.getHours()]),
      [
        ["quotidien", 30, 21],
        ["serie-en-danger", 1, 20],
        ["serie-en-danger", 2, 20],
        ["quotidien", 3, 21],
      ]
    );
  }

  // Changement de mois : dates de la fenêtre correctes.
  {
    const plan = planifierRappels(etat({ streak: { actuel: 0, dernierJourValide: null } }), gestes, a(30, 8), alea);
    assert.equal(plan[1].at.getMonth(), 9);
    assert.equal(plan[1].at.getDate(), 1);
  }
}
