import assert from "node:assert/strict";
import { STREAK_PAR_DEFAUT, JOKER_PAR_DEFAUT, JOKERS_PAR_SEMAINE } from "../js/gamification.js";

const STORAGE_KEY = "ecoquest-v1";

function creerLocalStorageFactice(valeursInitiales = {}) {
  const store = new Map(Object.entries(valeursInitiales));
  return {
    getItem(cle) {
      return store.has(cle) ? store.get(cle) : null;
    },
    setItem(cle, valeur) {
      store.set(cle, String(valeur));
    },
    removeItem(cle) {
      store.delete(cle);
    },
    clear() {
      store.clear();
    },
  };
}

function creerLocalStorageQuiLeveALaLecture() {
  return {
    getItem() {
      throw new Error("lecture impossible (ex. navigation privée)");
    },
    setItem() {},
    removeItem() {},
    clear() {},
  };
}

function etatParDefautAttendu() {
  return {
    points: 0,
    gestesCochesParDate: {},
    activeTab: "aujourdhui",
    streak: STREAK_PAR_DEFAUT,
    joker: JOKER_PAR_DEFAUT,
  };
}

// Faux localStorage installé sur globalThis avant d'importer js/state.js.
globalThis.localStorage = creerLocalStorageFactice();

const { loadState, saveState, dateDuJour } = await import("../js/state.js");

// Stockage vide → état par défaut complet
{
  globalThis.localStorage = creerLocalStorageFactice();
  const etat = loadState();
  assert.deepEqual(etat, etatParDefautAttendu());
}

// JSON corrompu → état par défaut, sans exception
{
  globalThis.localStorage = creerLocalStorageFactice({ [STORAGE_KEY]: "{ceci n'est pas du json" });
  let etat;
  assert.doesNotThrow(() => {
    etat = loadState();
  });
  assert.deepEqual(etat, etatParDefautAttendu());
}

// localStorage qui lève à la lecture → état par défaut, sans exception
{
  globalThis.localStorage = creerLocalStorageQuiLeveALaLecture();
  let etat;
  assert.doesNotThrow(() => {
    etat = loadState();
  });
  assert.deepEqual(etat, etatParDefautAttendu());
}

// État ancien avec completedToday et sans gestesCochesParDate : les gestes sont
// rattachés à la date du jour et les points sont conservés
{
  globalThis.localStorage = creerLocalStorageFactice({
    [STORAGE_KEY]: JSON.stringify({ points: 50, completedToday: ["geste-a", "geste-b"] }),
  });
  const etat = loadState();
  assert.equal(etat.points, 50);
  assert.deepEqual(etat.gestesCochesParDate, { [dateDuJour()]: ["geste-a", "geste-b"] });
  assert.equal(etat.completedToday, undefined);
}

// État ancien sans streak ni joker : valeurs par défaut ajoutées, points et gestes intacts
{
  const gestesCochesParDate = { "2026-01-01": ["geste-a"] };
  globalThis.localStorage = creerLocalStorageFactice({
    [STORAGE_KEY]: JSON.stringify({ points: 30, gestesCochesParDate }),
  });
  const etat = loadState();
  assert.equal(etat.points, 30);
  assert.deepEqual(etat.gestesCochesParDate, gestesCochesParDate);
  assert.deepEqual(etat.streak, STREAK_PAR_DEFAUT);
  assert.deepEqual(etat.joker, JOKER_PAR_DEFAUT);
}

// État avec streak partiel : les champs manquants sont complétés, les champs
// présents ne sont pas écrasés
{
  globalThis.localStorage = creerLocalStorageFactice({
    [STORAGE_KEY]: JSON.stringify({
      points: 0,
      gestesCochesParDate: {},
      streak: { actuel: 5, dernierJourValide: "2026-01-01" },
    }),
  });
  const etat = loadState();
  assert.equal(etat.streak.actuel, 5);
  assert.equal(etat.streak.dernierJourValide, "2026-01-01");
  assert.equal(etat.streak.dernierJourViaJoker, false);
  assert.equal(etat.streak.jokerUtiliseDansStreak, false);
}

// joker.disponible à 0 sans dejaUtilise : dejaUtilise passe à true
{
  globalThis.localStorage = creerLocalStorageFactice({
    [STORAGE_KEY]: JSON.stringify({
      points: 0,
      gestesCochesParDate: {},
      joker: { disponible: 0, semaine: "2026-W10" },
    }),
  });
  const etat = loadState();
  assert.equal(etat.joker.disponible, 0);
  assert.equal(etat.joker.semaine, "2026-W10");
  assert.equal(etat.joker.dejaUtilise, true);
}

// saveState puis loadState : aller-retour fidèle
{
  globalThis.localStorage = creerLocalStorageFactice();
  const etatOriginal = {
    points: 120,
    gestesCochesParDate: { "2026-05-01": ["geste-a", "geste-b"] },
    activeTab: "profil",
    streak: {
      actuel: 7,
      dernierJourValide: "2026-05-01",
      dernierJourViaJoker: true,
      jokerUtiliseDansStreak: true,
    },
    joker: { disponible: JOKERS_PAR_SEMAINE, semaine: "2026-W18", dejaUtilise: true },
  };
  saveState(etatOriginal);
  const etatRelu = loadState();
  assert.deepEqual(etatRelu, etatOriginal);
}

console.log("✅ tests state (localStorage/migrations) : OK");
