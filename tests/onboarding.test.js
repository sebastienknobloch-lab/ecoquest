import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { deriverCategories } from "../js/views/onboarding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gestes = JSON.parse(
  readFileSync(path.join(__dirname, "../data/gestes.json"), "utf-8")
);

// deriverCategories : renvoie les catégories dans l'ordre de leur première
// apparition dans les gestes, sans doublon — même logique que
// afficherCatalogueComplet dans js/views/aujourdhui.js, seule source de
// vérité pour la liste des catégories (le catalogue, jamais une constante
// figée côté vue).
{
  const categories = deriverCategories(gestes);
  assert.deepEqual(categories, [...new Set(gestes.map((g) => g.categorie))]);
  assert.equal(new Set(categories).size, categories.length, "pas de doublon");
}

// deriverCategories : suit le catalogue réel, pas une liste figée — une
// catégorie ajoutée ou retirée des données doit se répercuter directement
{
  const gestesFictifs = [
    { id: "a", categorie: "energie" },
    { id: "b", categorie: "mobilite-douce" },
    { id: "c", categorie: "energie" },
  ];
  assert.deepEqual(deriverCategories(gestesFictifs), ["energie", "mobilite-douce"]);
}

// deriverCategories : catalogue vide → liste vide (jamais d'erreur)
{
  assert.deepEqual(deriverCategories([]), []);
}

console.log("✅ tests onboarding (dérivation des catégories depuis le catalogue) : OK");
