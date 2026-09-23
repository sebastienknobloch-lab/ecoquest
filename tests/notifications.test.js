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
  CONTENU_RAPPEL_PAR_DEFAUT,
} from "../js/notifications.js";
import { selectionDuJour } from "../js/gamification.js";
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
// concret (co2_evite_g), jamais le texte générique par défaut
{
  for (let i = 0; i < 10; i++) {
    const contenu = genererContenuRappel(gesteTest, () => i / 10);
    assert.ok(contenu.body.includes(gesteTest.libelle), `variante ${i} : geste cité`);
    assert.ok(contenu.body.includes(String(gesteTest.co2_evite_g)), `variante ${i} : chiffre cité`);
    assert.ok(contenu.body.includes("estimation"), `variante ${i} : présenté comme une estimation`);
    assert.notEqual(contenu.body, CONTENU_RAPPEL_PAR_DEFAUT.body, `variante ${i} : jamais le texte générique`);
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

// contenuRappelPourAujourdhui : sans catégories prioritaires ni catalogue
// disponible, replie sur le contenu générique plutôt que de planter
{
  assert.deepEqual(contenuRappelPourAujourdhui([], {}), CONTENU_RAPPEL_PAR_DEFAUT);
  assert.deepEqual(contenuRappelPourAujourdhui(null, {}), CONTENU_RAPPEL_PAR_DEFAUT);
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
