import assert from "node:assert/strict";
import { cocherGeste, decocherGeste, POINTS_PAR_GESTE } from "../js/gamification.js";

function etatVide() {
  return { points: 0, completedToday: [] };
}

// Cocher un geste attribue les points et enregistre le geste comme fait
{
  const etat = cocherGeste(etatVide(), "eteindre-lumiere");
  assert.equal(etat.points, POINTS_PAR_GESTE);
  assert.deepEqual(etat.completedToday, ["eteindre-lumiere"]);
}

// Cocher plusieurs gestes différents cumule les points
{
  let etat = etatVide();
  etat = cocherGeste(etat, "eteindre-lumiere");
  etat = cocherGeste(etat, "douche-courte");
  assert.equal(etat.points, POINTS_PAR_GESTE * 2);
  assert.deepEqual(etat.completedToday, ["eteindre-lumiere", "douche-courte"]);
}

// Cocher deux fois le même geste ne double pas les points
{
  let etat = etatVide();
  etat = cocherGeste(etat, "eteindre-lumiere");
  etat = cocherGeste(etat, "eteindre-lumiere");
  assert.equal(etat.points, POINTS_PAR_GESTE);
  assert.equal(etat.completedToday.length, 1);
}

// Décocher un geste retire les points attribués
{
  let etat = etatVide();
  etat = cocherGeste(etat, "eteindre-lumiere");
  etat = decocherGeste(etat, "eteindre-lumiere");
  assert.equal(etat.points, 0);
  assert.deepEqual(etat.completedToday, []);
}

// Décocher un geste non coché ne fait rien (pas de points négatifs)
{
  const etat = decocherGeste(etatVide(), "eteindre-lumiere");
  assert.equal(etat.points, 0);
}

console.log("✅ tests points/gamification : OK");
