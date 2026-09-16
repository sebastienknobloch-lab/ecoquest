import assert from "node:assert/strict";
import { calendrierMois, moisAdjacent } from "../js/gamification.js";

function etatVide() {
  return { points: 0, gestesCochesParDate: {} };
}

// Un mois de 30 jours (septembre) sans aucun geste : 30 jours, tous inactifs
{
  const calendrier = calendrierMois(etatVide(), "2026-09-15");
  assert.equal(calendrier.annee, 2026);
  assert.equal(calendrier.mois, 9);
  assert.equal(calendrier.jours.length, 30);
  assert.ok(calendrier.jours.every((j) => !j.actif && j.nbGestes === 0));
}

// Le 1er septembre 2026 est un mardi : 1 case vide avant (lundi)
{
  const calendrier = calendrierMois(etatVide(), "2026-09-15");
  assert.equal(calendrier.decalageDebut, 1);
}

// Un jour avec au moins un geste coché est marqué actif, avec le bon compte
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-05": ["g1", "g2"], "2026-09-10": ["g1"] };
  const calendrier = calendrierMois(etat, "2026-09-15");

  const jour5 = calendrier.jours.find((j) => j.jour === 5);
  const jour10 = calendrier.jours.find((j) => j.jour === 10);
  const jour6 = calendrier.jours.find((j) => j.jour === 6);

  assert.equal(jour5.actif, true);
  assert.equal(jour5.nbGestes, 2);
  assert.equal(jour10.actif, true);
  assert.equal(jour10.nbGestes, 1);
  assert.equal(jour6.actif, false);
  assert.equal(jour6.nbGestes, 0);
}

// Les gestes cochés en dehors du mois affiché n'y apparaissent pas
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-10-01": ["g1"] };
  const calendrier = calendrierMois(etat, "2026-09-15");
  assert.ok(calendrier.jours.every((j) => !j.actif));
}

// Chaque jour porte sa date AAAA-MM-JJ complète
{
  const calendrier = calendrierMois(etatVide(), "2026-01-15");
  assert.equal(calendrier.jours[0].date, "2026-01-01");
  assert.equal(calendrier.jours[30].date, "2026-01-31");
}

// Février d'une année bissextile compte bien 29 jours
{
  const calendrier = calendrierMois(etatVide(), "2028-02-10");
  assert.equal(calendrier.jours.length, 29);
}

// L'état n'est jamais modifié par le calcul (dérivé, jamais stocké)
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-05": ["g1"] };
  calendrierMois(etat, "2026-09-15");
  assert.equal(Object.keys(etat).length, 2);
}

// moisAdjacent avance/recule d'un mois, en revenant toujours au 1er du mois
{
  assert.equal(moisAdjacent("2026-09-15", 1), "2026-10-01");
  assert.equal(moisAdjacent("2026-09-15", -1), "2026-08-01");
}

// moisAdjacent change bien d'année en franchissant janvier/décembre
{
  assert.equal(moisAdjacent("2026-01-15", -1), "2025-12-01");
  assert.equal(moisAdjacent("2026-12-15", 1), "2027-01-01");
}

console.log("✅ tests historique (calendrier du mois) : OK");
