import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { selectionDuJour } from "../js/gamification.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gestes = JSON.parse(
  readFileSync(path.join(__dirname, "../data/gestes.json"), "utf-8")
);

// La sélection du jour contient toujours exactement 3 gestes
{
  const selection = selectionDuJour(gestes, "2026-09-12");
  assert.equal(selection.length, 3);
}

// La sélection du jour vient de 3 catégories différentes
{
  const selection = selectionDuJour(gestes, "2026-09-12");
  const categories = new Set(selection.map((g) => g.categorie));
  assert.equal(categories.size, 3, "les 3 gestes du jour doivent venir de 3 catégories différentes");
}

// La sélection est déterministe pour une date donnée : même date → mêmes gestes,
// à chaque appel (rechargement de la page dans la journée).
{
  const selectionA = selectionDuJour(gestes, "2026-09-12").map((g) => g.id);
  const selectionB = selectionDuJour(gestes, "2026-09-12").map((g) => g.id);
  assert.deepEqual(selectionA, selectionB);
}

// La sélection change avec la date (nouveau tirage à minuit)
{
  const idsJourUn = selectionDuJour(gestes, "2026-09-12").map((g) => g.id);
  const idsJourDeux = selectionDuJour(gestes, "2026-09-13").map((g) => g.id);
  assert.notDeepEqual(idsJourUn, idsJourDeux);
}

// La sélection reste cohérente sur plusieurs dates : toujours 3 gestes de 3 catégories différentes
{
  const dates = [
    "2026-01-01",
    "2026-02-14",
    "2026-06-21",
    "2026-09-12",
    "2026-12-31",
    "2027-03-08",
  ];
  dates.forEach((date) => {
    const selection = selectionDuJour(gestes, date);
    assert.equal(selection.length, 3, `${date} : 3 gestes attendus`);
    const ids = selection.map((g) => g.id);
    assert.equal(new Set(ids).size, 3, `${date} : les 3 gestes doivent être différents`);
    const categories = new Set(selection.map((g) => g.categorie));
    assert.equal(categories.size, 3, `${date} : 3 catégories différentes attendues`);
  });
}

console.log("✅ tests sélection du jour : OK");
