import assert from "node:assert/strict";
import { doitMettreEnCache } from "../js/cache-policy.js";

const ORIGIN = "https://ecoquest.example";

function reponse(status) {
  return new Response(null, { status });
}

// Même origine, réponse ok (2xx) : mise en cache
{
  assert.equal(doitMettreEnCache(`${ORIGIN}/js/app.js`, reponse(200), ORIGIN), true);
}

// Même origine, 404 : jamais mis en cache (sinon resterait indéfiniment)
{
  assert.equal(doitMettreEnCache(`${ORIGIN}/js/app.js`, reponse(404), ORIGIN), false);
}

// Même origine, 500 transitoire : jamais mis en cache
{
  assert.equal(doitMettreEnCache(`${ORIGIN}/data/gestes.json`, reponse(500), ORIGIN), false);
}

// Origine croisée (Eruda depuis esm.sh / jsDelivr), même avec une réponse ok : jamais mis en cache
{
  assert.equal(doitMettreEnCache("https://esm.sh/eruda@3", reponse(200), ORIGIN), false);
  assert.equal(
    doitMettreEnCache("https://cdn.jsdelivr.net/npm/eruda@3/+esm", reponse(200), ORIGIN),
    false
  );
}

// Réponse absente ou URL invalide : jamais mis en cache
{
  assert.equal(doitMettreEnCache(`${ORIGIN}/js/app.js`, null, ORIGIN), false);
  assert.equal(doitMettreEnCache(`${ORIGIN}/js/app.js`, undefined, ORIGIN), false);
  assert.equal(doitMettreEnCache("pas-une-url", reponse(200), ORIGIN), false);
}
