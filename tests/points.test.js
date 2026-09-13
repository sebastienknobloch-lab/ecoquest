import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cocherGeste, decocherGeste, pointsPourDifficulte } from "../js/gamification.js";
import { LIBELLES_CATEGORIES } from "../js/views/aujourdhui.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gestes = JSON.parse(
  readFileSync(path.join(__dirname, "../data/gestes.json"), "utf-8")
);
const CATEGORIES_VALIDES = ["energie", "alimentation", "deplacements", "dechets", "numerique"];
const AUJOURDHUI = "2026-09-12";

function etatVide() {
  return { points: 0, gestesCochesParDate: {} };
}

function gesteParId(id) {
  const geste = gestes.find((g) => g.id === id);
  assert.ok(geste, `geste ${id} introuvable dans le catalogue`);
  return geste;
}

// Cocher un geste attribue les points du geste (selon sa difficulté) et l'enregistre à sa date
{
  const geste = gesteParId("eteindre-lumiere");
  const etat = cocherGeste(etatVide(), geste, AUJOURDHUI);
  assert.equal(etat.points, geste.points);
  assert.deepEqual(etat.gestesCochesParDate[AUJOURDHUI], [geste.id]);
}

// Cocher plusieurs gestes différents cumule leurs points respectifs
{
  const g1 = gesteParId("eteindre-lumiere");
  const g2 = gesteParId("baisser-chauffage");
  let etat = etatVide();
  etat = cocherGeste(etat, g1, AUJOURDHUI);
  etat = cocherGeste(etat, g2, AUJOURDHUI);
  assert.equal(etat.points, g1.points + g2.points);
  assert.deepEqual(etat.gestesCochesParDate[AUJOURDHUI], [g1.id, g2.id]);
}

// Cocher deux fois le même geste ne double pas les points
{
  const geste = gesteParId("eteindre-lumiere");
  let etat = etatVide();
  etat = cocherGeste(etat, geste, AUJOURDHUI);
  etat = cocherGeste(etat, geste, AUJOURDHUI);
  assert.equal(etat.points, geste.points);
  assert.equal(etat.gestesCochesParDate[AUJOURDHUI].length, 1);
}

// Décocher un geste retire les points attribués
{
  const geste = gesteParId("eteindre-lumiere");
  let etat = etatVide();
  etat = cocherGeste(etat, geste, AUJOURDHUI);
  etat = decocherGeste(etat, geste, AUJOURDHUI);
  assert.equal(etat.points, 0);
  assert.deepEqual(etat.gestesCochesParDate[AUJOURDHUI], []);
}

// Décocher un geste non coché ne fait rien (pas de points négatifs)
{
  const geste = gesteParId("eteindre-lumiere");
  const etat = decocherGeste(etatVide(), geste, AUJOURDHUI);
  assert.equal(etat.points, 0);
}

// Les gestes cochés à une date différente sont indépendants (pas de fuite entre jours)
{
  const geste = gesteParId("eteindre-lumiere");
  let etat = etatVide();
  etat = cocherGeste(etat, geste, "2026-09-11");
  assert.equal(etat.gestesCochesParDate["2026-09-12"], undefined);
  etat = cocherGeste(etat, geste, "2026-09-12");
  assert.equal(etat.points, geste.points * 2);
  assert.deepEqual(etat.gestesCochesParDate["2026-09-11"], [geste.id]);
  assert.deepEqual(etat.gestesCochesParDate["2026-09-12"], [geste.id]);
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

// Un geste sans a_verifier (donc considéré sourcé définitivement) doit avoir une source non vide
{
  gestes
    .filter((g) => !g.a_verifier)
    .forEach((geste) => {
      assert.ok(
        typeof geste.source === "string" && geste.source.trim().length > 0,
        `${geste.id} : sourcé sans a_verifier mais source vide`
      );
    });
}

// Chaque catégorie contient exactement 6 gestes (5 catégories x 6 = 30)
{
  CATEGORIES_VALIDES.forEach((categorie) => {
    const count = gestes.filter((g) => g.categorie === categorie).length;
    assert.equal(count, 6, `catégorie ${categorie} : ${count} gestes au lieu de 6`);
  });
}

// Chaque catégorie présente dans le catalogue a une étiquette lisible définie
// dans la vue aujourd'hui — sinon elle s'afficherait avec son id brut
{
  const categoriesPresentes = [...new Set(gestes.map((g) => g.categorie))];
  categoriesPresentes.forEach((categorieId) => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(LIBELLES_CATEGORIES, categorieId),
      `catégorie "${categorieId}" présente dans le catalogue mais sans étiquette définie dans js/views/aujourdhui.js`
    );
  });
}

console.log("✅ tests points/gamification/catalogue : OK");
