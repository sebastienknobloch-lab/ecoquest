import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cocherGeste, decocherGeste, pointsPourDifficulte } from "../js/gamification.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gestes = JSON.parse(
  readFileSync(path.join(__dirname, "../data/gestes.json"), "utf-8")
);
const CATEGORIES_VALIDES = ["energie", "alimentation", "deplacements", "dechets", "numerique"];

function etatVide() {
  return { points: 0, completedToday: [] };
}

function gesteParId(id) {
  const geste = gestes.find((g) => g.id === id);
  assert.ok(geste, `geste ${id} introuvable dans le catalogue`);
  return geste;
}

// Cocher un geste attribue les points du geste (selon sa difficulté) et l'enregistre comme fait
{
  const geste = gesteParId("eteindre-lumiere");
  const etat = cocherGeste(etatVide(), geste);
  assert.equal(etat.points, geste.points);
  assert.deepEqual(etat.completedToday, [geste.id]);
}

// Cocher plusieurs gestes différents cumule leurs points respectifs
{
  const g1 = gesteParId("eteindre-lumiere");
  const g2 = gesteParId("baisser-chauffage");
  let etat = etatVide();
  etat = cocherGeste(etat, g1);
  etat = cocherGeste(etat, g2);
  assert.equal(etat.points, g1.points + g2.points);
  assert.deepEqual(etat.completedToday, [g1.id, g2.id]);
}

// Cocher deux fois le même geste ne double pas les points
{
  const geste = gesteParId("eteindre-lumiere");
  let etat = etatVide();
  etat = cocherGeste(etat, geste);
  etat = cocherGeste(etat, geste);
  assert.equal(etat.points, geste.points);
  assert.equal(etat.completedToday.length, 1);
}

// Décocher un geste retire les points attribués
{
  const geste = gesteParId("eteindre-lumiere");
  let etat = etatVide();
  etat = cocherGeste(etat, geste);
  etat = decocherGeste(etat, geste);
  assert.equal(etat.points, 0);
  assert.deepEqual(etat.completedToday, []);
}

// Décocher un geste non coché ne fait rien (pas de points négatifs)
{
  const geste = gesteParId("eteindre-lumiere");
  const etat = decocherGeste(etatVide(), geste);
  assert.equal(etat.points, 0);
}

// Les points d'un geste suivent le barème lié à sa difficulté (1=10, 2=20, 3=30)
{
  gestes.forEach((geste) => {
    assert.equal(
      geste.points,
      pointsPourDifficulte(geste.difficulte),
      `${geste.id} : points incohérents avec sa difficulté ${geste.difficulte}`
    );
  });
}

// Le catalogue contient exactement 30 gestes
{
  assert.equal(gestes.length, 30);
}

// Les ids du catalogue sont uniques
{
  const ids = gestes.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, "des ids sont dupliqués dans le catalogue");
}

// Chaque geste a tous les champs requis, avec une catégorie, une difficulté et un CO2 valides
{
  const CHAMPS_REQUIS = ["id", "libelle", "categorie", "difficulte", "points", "co2_evite_g", "source"];
  gestes.forEach((geste) => {
    CHAMPS_REQUIS.forEach((champ) => {
      assert.ok(
        geste[champ] !== undefined && geste[champ] !== "",
        `${geste.id ?? "(id manquant)"} : champ "${champ}" manquant`
      );
    });
    assert.ok(
      CATEGORIES_VALIDES.includes(geste.categorie),
      `${geste.id} : catégorie invalide "${geste.categorie}"`
    );
    assert.ok([1, 2, 3].includes(geste.difficulte), `${geste.id} : difficulté invalide`);
    assert.ok(Number.isInteger(geste.co2_evite_g), `${geste.id} : co2_evite_g doit être un entier`);
  });
}

// Chaque catégorie contient exactement 6 gestes (5 catégories x 6 = 30)
{
  CATEGORIES_VALIDES.forEach((categorie) => {
    const count = gestes.filter((g) => g.categorie === categorie).length;
    assert.equal(count, 6, `catégorie ${categorie} : ${count} gestes au lieu de 6`);
  });
}

console.log("✅ tests points/gamification/catalogue : OK");
