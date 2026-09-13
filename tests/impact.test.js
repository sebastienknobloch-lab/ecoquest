import assert from "node:assert/strict";
import {
  EQUIVALENCES_IMPACT,
  calculerEquivalences,
  impactCumuleGrammes,
} from "../js/gamification.js";

const GESTES = [
  { id: "g10", co2_evite_g: 10 },
  { id: "g300", co2_evite_g: 300 },
];

function etatVide() {
  return { points: 0, gestesCochesParDate: {} };
}

// Sans geste validé, l'impact cumulé est nul
{
  assert.equal(impactCumuleGrammes(etatVide(), GESTES), 0);
}

// La somme porte sur tous les gestes validés, toutes dates confondues
{
  const etat = etatVide();
  etat.gestesCochesParDate = {
    "2026-09-10": ["g10", "g300"],
    "2026-09-11": ["g10"],
  };
  assert.equal(impactCumuleGrammes(etat, GESTES), 10 + 300 + 10);
}

// Un même geste coché à des dates différentes compte à chaque fois (pas de déduplication)
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-10": ["g10"], "2026-09-11": ["g10"] };
  assert.equal(impactCumuleGrammes(etat, GESTES), 20);
}

// Un id coché absent du catalogue fourni est ignoré (pas de plantage, total partiel)
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-10": ["g10", "id-inconnu"] };
  assert.equal(impactCumuleGrammes(etat, GESTES), 10);
  assert.doesNotThrow(() => impactCumuleGrammes(etat, undefined));
  assert.equal(impactCumuleGrammes(etat, undefined), 0);
}

// calculerEquivalences renvoie une valeur par équivalence définie, cohérente avec son facteur de conversion
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-10": ["g10", "g300"] };
  const total = impactCumuleGrammes(etat, GESTES);
  const equivalences = calculerEquivalences(etat, GESTES);

  assert.equal(equivalences.length, EQUIVALENCES_IMPACT.length);
  equivalences.forEach((equivalence) => {
    assert.equal(equivalence.valeur, Math.round(total / equivalence.grammesParUnite));
    assert.ok(equivalence.source.length > 0, `${equivalence.id} : source manquante`);
  });
}

// Le total cumulé n'est jamais stocké dans l'état : deux appels successifs sur le même
// état renvoient toujours le même résultat, recalculé à chaque fois (pas de propriété ajoutée)
{
  const etat = etatVide();
  etat.gestesCochesParDate = { "2026-09-10": ["g10"] };
  impactCumuleGrammes(etat, GESTES);
  assert.equal(Object.keys(etat).length, 2, "aucune propriété d'impact ne doit être ajoutée à l'état");
  assert.equal(impactCumuleGrammes(etat, GESTES), 10);
}

console.log("✅ tests impact cumulé : OK");
