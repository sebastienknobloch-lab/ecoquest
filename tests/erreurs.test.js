import assert from "node:assert/strict";
import {
  MAX_ERREURS_STOCKEES,
  ajouterErreur,
  formaterErreurWindow,
  formaterRejetNonGere,
  fusionnerErreursRecentes,
  installerGestionnaireErreurs,
} from "../js/erreurs.js";
import { STREAK_PAR_DEFAUT, JOKER_PAR_DEFAUT, cocherGeste } from "../js/gamification.js";

function etatVide() {
  return { erreurs: [] };
}

// ajouterErreur : ajoute en fin de liste
{
  const etat = ajouterErreur(etatVide(), { message: "a" });
  assert.deepEqual(etat.erreurs, [{ message: "a" }]);
}

// ajouterErreur : plafonne à MAX_ERREURS_STOCKEES en retirant les plus anciennes (FIFO)
{
  let etat = etatVide();
  for (let i = 0; i < MAX_ERREURS_STOCKEES + 10; i++) {
    etat = ajouterErreur(etat, { message: `erreur-${i}` });
  }
  assert.equal(etat.erreurs.length, MAX_ERREURS_STOCKEES);
  // Les 10 premières (0 à 9) ont été évincées : la plus ancienne restante est erreur-10
  assert.equal(etat.erreurs[0].message, "erreur-10");
  assert.equal(etat.erreurs[etat.erreurs.length - 1].message, `erreur-${MAX_ERREURS_STOCKEES + 9}`);
}

// ajouterErreur : robuste si state.erreurs est absent (état ancien pas encore migré)
{
  const etat = ajouterErreur({}, { message: "a" });
  assert.deepEqual(etat.erreurs, [{ message: "a" }]);
}

// formaterErreurWindow : renvoie la forme attendue, avec la pile si fournie
{
  const erreurObjet = new Error("boum");
  const erreur = formaterErreurWindow("boum", "app.js", 10, 5, erreurObjet);
  assert.equal(erreur.type, "erreur");
  assert.equal(erreur.message, "boum");
  assert.equal(erreur.source, "app.js");
  assert.equal(erreur.ligne, 10);
  assert.equal(erreur.colonne, 5);
  assert.equal(erreur.pile, erreurObjet.stack);
  assert.equal(typeof erreur.horodatage, "string");
  assert.doesNotThrow(() => new Date(erreur.horodatage).toISOString());
}

// formaterErreurWindow : robuste sans objet Error (source/ligne/colonne absents)
{
  const erreur = formaterErreurWindow("boum", undefined, undefined, undefined, undefined);
  assert.equal(erreur.source, null);
  assert.equal(erreur.ligne, null);
  assert.equal(erreur.colonne, null);
  assert.equal(erreur.pile, null);
}

// formaterRejetNonGere : à partir d'une Error, message et pile repris
{
  const raison = new Error("promesse cassée");
  const erreur = formaterRejetNonGere(raison);
  assert.equal(erreur.type, "promesse-rejetee");
  assert.equal(erreur.message, "promesse cassée");
  assert.equal(erreur.pile, raison.stack);
}

// formaterRejetNonGere : robuste si la raison n'est pas une Error (ex. reject("texte"))
{
  const erreur = formaterRejetNonGere("texte de rejet");
  assert.equal(erreur.message, "texte de rejet");
  assert.equal(erreur.pile, null);
}

// installerGestionnaireErreurs : window.onerror enregistre l'erreur dans l'état persisté,
// sans court-circuiter un gestionnaire déjà présent
{
  let precedentAppele = false;
  const listenersEnregistres = {};
  globalThis.window = {
    onerror(message) {
      precedentAppele = message === "boum";
      return true;
    },
    addEventListener(type, callback) {
      listenersEnregistres[type] = callback;
    },
  };
  let state = etatVide();
  const getState = () => state;
  const persist = (nouvelEtat) => {
    state = nouvelEtat;
  };

  installerGestionnaireErreurs(getState, persist);
  const resultat = window.onerror("boum", "app.js", 1, 1, new Error("boum"));

  assert.equal(state.erreurs.length, 1);
  assert.equal(state.erreurs[0].message, "boum");
  assert.equal(precedentAppele, true);
  assert.equal(resultat, true);

  // unhandledrejection : bien écouté, et enregistré dans le même état
  listenersEnregistres.unhandledrejection({ reason: new Error("promesse cassée") });
  assert.equal(state.erreurs.length, 2);
  assert.equal(state.erreurs[1].type, "promesse-rejetee");
  assert.equal(state.erreurs[1].message, "promesse cassée");

  delete globalThis.window;
}

// fusionnerErreursRecentes : conserve la liste la plus longue, qu'elle
// vienne de l'état actuel ou de l'état reçu (erreurs ne fait jamais que
// grandir : ajout en fin de liste, éviction FIFO en tête)
{
  assert.deepEqual(fusionnerErreursRecentes(["a"], ["a", "b"]), ["a", "b"]);
  assert.deepEqual(fusionnerErreursRecentes(["a", "b"], ["a"]), ["a", "b"]);
  assert.deepEqual(fusionnerErreursRecentes(["a"], ["a"]), ["a"]);
  assert.deepEqual(fusionnerErreursRecentes(undefined, ["a"]), ["a"]);
  assert.deepEqual(fusionnerErreursRecentes(["a"], undefined), ["a"]);
  assert.deepEqual(fusionnerErreursRecentes(undefined, undefined), []);
}

// Scénario de régression : une erreur ajoutée à l'état pendant qu'une vue
// (js/views/aujourdhui.js, js/views/onboarding.js) détient encore une copie
// antérieure ne doit pas être effacée quand cette vue persiste ensuite un
// état calculé à partir de cette copie (ex. un geste coché). Reproduit ici
// la logique de persist() dans js/app.js, qui fusionne `erreurs` avant
// d'écraser l'état détenu par l'application.
{
  const etatInitial = {
    points: 0,
    gestesCochesParDate: {},
    streak: STREAK_PAR_DEFAUT,
    joker: JOKER_PAR_DEFAUT,
    erreurs: [],
  };

  let state = etatInitial;
  function persist(nextState) {
    state = { ...nextState, erreurs: fusionnerErreursRecentes(state.erreurs, nextState.erreurs) };
  }

  // La vue capture une copie de l'état à son montage, avant toute erreur.
  const copieVue = state;

  // Une erreur JS survient pendant que la vue est affichée : le gestionnaire
  // global (js/erreurs.js) l'ajoute à l'état courant détenu par app.js.
  persist(ajouterErreur(state, { message: "boum" }));
  assert.equal(state.erreurs.length, 1);

  // L'utilisateur coche un geste : la vue calcule le nouvel état à partir de
  // sa copie *antérieure* à l'erreur, puis le persiste.
  const geste = { id: "g1", points: 10 };
  const etatDepuisCopieAnterieure = cocherGeste(copieVue, geste, "2026-09-20");
  persist(etatDepuisCopieAnterieure);

  // L'erreur capturée entre-temps est toujours présente dans l'état
  // enregistré, malgré la copie antérieure de la vue.
  assert.equal(state.erreurs.length, 1);
  assert.equal(state.erreurs[0].message, "boum");
  // La fusion ne doit affecter que le champ erreurs : le geste coché reste pris en compte.
  assert.equal(state.points, 10);
}

console.log("✅ tests erreurs (gestionnaire global d'erreurs JS) : OK");
