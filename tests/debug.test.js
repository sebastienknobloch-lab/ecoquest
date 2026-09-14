import assert from "node:assert/strict";
import { debugActiveDepuisRecherche, creerCompteurTaps } from "../js/debug.js";

// debugActiveDepuisRecherche : seul ?debug=1 active la console
{
  assert.equal(debugActiveDepuisRecherche("?debug=1"), true);
  assert.equal(debugActiveDepuisRecherche("?debug=0"), false);
  assert.equal(debugActiveDepuisRecherche(""), false);
  assert.equal(debugActiveDepuisRecherche("?autre=1"), false);
  assert.equal(debugActiveDepuisRecherche("?autre=1&debug=1"), true);
}

// creerCompteurTaps : 5 taps rapprochés déclenchent l'activation, pas moins
{
  const enregistrerTap = creerCompteurTaps();
  assert.equal(enregistrerTap(0), false);
  assert.equal(enregistrerTap(100), false);
  assert.equal(enregistrerTap(200), false);
  assert.equal(enregistrerTap(300), false);
  assert.equal(enregistrerTap(400), true);
}

// creerCompteurTaps : le compteur se réarme après une pause trop longue
// (les 2 taps précédant la pause ne comptent plus : il faut 5 nouveaux taps)
{
  const enregistrerTap = creerCompteurTaps();
  assert.equal(enregistrerTap(0), false);
  assert.equal(enregistrerTap(100), false);
  // pause de 3s > délai max (2s)
  assert.equal(enregistrerTap(3100), false);
  assert.equal(enregistrerTap(3200), false);
  assert.equal(enregistrerTap(3300), false);
  assert.equal(enregistrerTap(3400), false);
  assert.equal(enregistrerTap(3500), true);
}

// creerCompteurTaps : une fois déclenché, il faut 5 nouveaux taps pour redéclencher
{
  const enregistrerTap = creerCompteurTaps();
  for (let i = 0; i < 4; i++) enregistrerTap(i * 100);
  assert.equal(enregistrerTap(400), true);
  assert.equal(enregistrerTap(500), false);
  assert.equal(enregistrerTap(600), false);
  assert.equal(enregistrerTap(700), false);
  assert.equal(enregistrerTap(800), false);
  assert.equal(enregistrerTap(900), true);
}

// creerCompteurTaps : respecte un seuil et un délai personnalisés
{
  const enregistrerTap = creerCompteurTaps(2, 500);
  assert.equal(enregistrerTap(0), false);
  assert.equal(enregistrerTap(600), false); // trop tard : compteur réarmé
  assert.equal(enregistrerTap(700), true);
}
