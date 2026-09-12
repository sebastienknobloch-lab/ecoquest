import assert from "node:assert/strict";
import {
  BADGES,
  calculerBadges,
  STREAK_PAR_DEFAUT,
  JOKER_PAR_DEFAUT,
  SEUILS_NIVEAUX,
} from "../js/gamification.js";

const GESTES = [
  { id: "e1", categorie: "energie" },
  { id: "a1", categorie: "alimentation" },
  { id: "d1", categorie: "deplacements" },
  { id: "de1", categorie: "dechets" },
  { id: "n1", categorie: "numerique" },
];

function etatVide() {
  return {
    points: 0,
    gestesCochesParDate: {},
    streak: { ...STREAK_PAR_DEFAUT },
    joker: { ...JOKER_PAR_DEFAUT },
  };
}

function estObtenu(state, id, gestes = GESTES) {
  const badges = calculerBadges(state, gestes);
  const badge = badges.find((b) => b.id === id);
  assert.ok(badge, `badge inconnu : ${id}`);
  return badge.obtenu;
}

// calculerBadges renvoie toujours exactement les 8 badges attendus
{
  const badges = calculerBadges(etatVide(), GESTES);
  assert.equal(badges.length, 8);
  assert.equal(BADGES.length, 8);
  const idsAttendus = [
    "premier-pas",
    "une-semaine",
    "toutes-les-couleurs",
    "niveau-3",
    "niveau-5",
    "cinquante-gestes",
    "joker-utilise",
    "semaine-sans-faute",
  ];
  assert.deepEqual(badges.map((b) => b.id), idsAttendus);
}

// 1. Premier pas
{
  assert.equal(estObtenu(etatVide(), "premier-pas"), false);
  const etat = etatVide();
  etat.gestesCochesParDate["2026-09-10"] = ["e1"];
  assert.equal(estObtenu(etat, "premier-pas"), true);
}

// 2. Une semaine (streak >= 7 jours)
{
  const etat = etatVide();
  etat.streak.actuel = 6;
  assert.equal(estObtenu(etat, "une-semaine"), false);
  etat.streak.actuel = 7;
  assert.equal(estObtenu(etat, "une-semaine"), true);
}

// 3. Toutes les couleurs (5 catégories différentes touchées)
{
  const etat = etatVide();
  etat.gestesCochesParDate = {
    "2026-09-10": ["e1", "a1", "d1", "de1"],
  };
  assert.equal(estObtenu(etat, "toutes-les-couleurs"), false, "4 catégories sur 5 ne suffit pas");
  etat.gestesCochesParDate["2026-09-11"] = ["n1"];
  assert.equal(estObtenu(etat, "toutes-les-couleurs"), true);
  // Sans catalogue fourni (ex : gestes.json indisponible), le badge reste
  // verrouillé plutôt que de planter.
  assert.equal(estObtenu(etat, "toutes-les-couleurs", []), false);
  assert.doesNotThrow(() => calculerBadges(etat, undefined));
}

// 4. Niveau 3 atteint
{
  const etat = etatVide();
  etat.points = SEUILS_NIVEAUX[2] - 1;
  assert.equal(estObtenu(etat, "niveau-3"), false);
  etat.points = SEUILS_NIVEAUX[2];
  assert.equal(estObtenu(etat, "niveau-3"), true);
}

// 5. Niveau 5 atteint (niveau max)
{
  const etat = etatVide();
  etat.points = SEUILS_NIVEAUX[4] - 1;
  assert.equal(estObtenu(etat, "niveau-5"), false);
  etat.points = SEUILS_NIVEAUX[4];
  assert.equal(estObtenu(etat, "niveau-5"), true);
}

// 6. 50 gestes validés au total, toutes dates confondues
{
  const etat = etatVide();
  etat.gestesCochesParDate = {
    "2026-09-01": new Array(25).fill("e1"),
    "2026-09-02": new Array(24).fill("e1"),
  };
  assert.equal(estObtenu(etat, "cinquante-gestes"), false, "49 gestes ne suffisent pas");
  etat.gestesCochesParDate["2026-09-03"] = ["e1"];
  assert.equal(estObtenu(etat, "cinquante-gestes"), true);
}

// 7. Joker utilisé au moins une fois
{
  const etat = etatVide();
  assert.equal(estObtenu(etat, "joker-utilise"), false);
  etat.joker.dejaUtilise = true;
  assert.equal(estObtenu(etat, "joker-utilise"), true);
  // Le joker peut s'être rechargé (disponible redevenu > 0) sans effacer le badge.
  etat.joker.disponible = JOKER_PAR_DEFAUT.disponible;
  assert.equal(estObtenu(etat, "joker-utilise"), true);
}

// 8. Semaine sans faute : streak >= 7 jours sans avoir utilisé le joker
{
  const etat = etatVide();
  etat.streak.actuel = 7;
  etat.streak.jokerUtiliseDansStreak = false;
  assert.equal(estObtenu(etat, "semaine-sans-faute"), true);

  const etatAvecJoker = etatVide();
  etatAvecJoker.streak.actuel = 7;
  etatAvecJoker.streak.jokerUtiliseDansStreak = true;
  assert.equal(estObtenu(etatAvecJoker, "semaine-sans-faute"), false, "le joker a servi pendant la série");

  const etatCourt = etatVide();
  etatCourt.streak.actuel = 3;
  etatCourt.streak.jokerUtiliseDansStreak = false;
  assert.equal(estObtenu(etatCourt, "semaine-sans-faute"), false, "série trop courte");
}

// Un état ancien, sans streak/joker (avant la migration correspondante), ne fait
// pas planter le calcul et n'accorde aucun badge lié au streak/joker par défaut.
{
  const etatAncien = { points: 20, gestesCochesParDate: { "2026-09-10": ["e1"] } };
  const badges = calculerBadges(etatAncien, GESTES);
  assert.equal(badges.length, 8);
  assert.equal(badges.find((b) => b.id === "premier-pas").obtenu, true);
  assert.equal(badges.find((b) => b.id === "une-semaine").obtenu, false);
  assert.equal(badges.find((b) => b.id === "joker-utilise").obtenu, false);
  assert.equal(badges.find((b) => b.id === "semaine-sans-faute").obtenu, false);
}

console.log("✅ tests badges : OK");
