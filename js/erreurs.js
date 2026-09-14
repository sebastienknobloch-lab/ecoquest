// Gestionnaire global d'erreurs JS : capture les erreurs non interceptées
// (window.onerror) et les rejets de promesse non gérés (unhandledrejection),
// pour les garder consultables et exportables sur l'écran de debug — seul
// moyen de voir une erreur survenue sur un téléphone sans Mac ni câble relié
// à un ordinateur (même besoin que la console embarquée de la session 12).

export const MAX_ERREURS_STOCKEES = 50;

// N'ajoute jamais plus de MAX_ERREURS_STOCKEES erreurs à l'état : au-delà,
// les plus anciennes sont retirées en premier (file FIFO), pour ne jamais
// faire grossir l'état indéfiniment même en cas d'avalanche d'erreurs.
export function ajouterErreur(state, erreur) {
  const erreurs = [...(state.erreurs || []), erreur].slice(-MAX_ERREURS_STOCKEES);
  return { ...state, erreurs };
}

export function formaterErreurWindow(message, source, ligne, colonne, erreurObjet) {
  return {
    type: "erreur",
    message: String(message),
    source: source || null,
    ligne: ligne ?? null,
    colonne: colonne ?? null,
    pile: erreurObjet && erreurObjet.stack ? String(erreurObjet.stack) : null,
    horodatage: new Date().toISOString(),
  };
}

export function formaterRejetNonGere(raison) {
  const estErreur = raison instanceof Error;
  return {
    type: "promesse-rejetee",
    message: estErreur ? raison.message : String(raison),
    source: null,
    ligne: null,
    colonne: null,
    pile: estErreur && raison.stack ? String(raison.stack) : null,
    horodatage: new Date().toISOString(),
  };
}

// Installe les deux gestionnaires globaux. `getState`/`persist` évitent une
// dépendance circulaire avec app.js, seul détenteur de l'état. Un gestionnaire
// `window.onerror` déjà posé (ex. par un outil tiers) n'est jamais
// court-circuité : il est toujours rappelé après l'enregistrement.
export function installerGestionnaireErreurs(getState, persist) {
  if (typeof window === "undefined") return;

  const onErrorPrecedent = window.onerror;
  window.onerror = function (message, source, ligne, colonne, erreurObjet) {
    persist(ajouterErreur(getState(), formaterErreurWindow(message, source, ligne, colonne, erreurObjet)));
    if (typeof onErrorPrecedent === "function") {
      return onErrorPrecedent.call(this, message, source, ligne, colonne, erreurObjet);
    }
    return false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    persist(ajouterErreur(getState(), formaterRejetNonGere(event.reason)));
  });
}
