import { STREAK_PAR_DEFAUT, JOKER_PAR_DEFAUT, JOKERS_PAR_SEMAINE } from "./gamification.js";

const STORAGE_KEY = "ecoquest-v1";

// heureRappel : stockée dès l'onboarding (session 18), pas encore utilisée —
// la programmation du rappel local arrive en session 29.
export const ONBOARDING_PAR_DEFAUT = {
  termine: false,
  prenom: "",
  categoriesPrioritaires: [],
  heureRappel: "19:00",
};

// Toute nouvelle propriété doit avoir une valeur par défaut ici
// (migration douce : les données existantes ne sont jamais perdues).
const DEFAULT_STATE = {
  points: 0,
  gestesCochesParDate: {},
  activeTab: "aujourdhui",
  streak: STREAK_PAR_DEFAUT,
  joker: JOKER_PAR_DEFAUT,
  erreurs: [],
  onboarding: ONBOARDING_PAR_DEFAUT,
};

// Format AAAA-MM-JJ en heure locale (pas d'UTC, pour que "minuit" corresponde
// bien à minuit chez l'utilisateur).
export function dateDuJour() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${jj}`;
}

export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ...DEFAULT_STATE, gestesCochesParDate: {} };
  }

  if (!raw) return { ...DEFAULT_STATE, gestesCochesParDate: {} };

  try {
    const parsed = JSON.parse(raw);
    const state = {
      ...DEFAULT_STATE,
      ...parsed,
      gestesCochesParDate: { ...parsed.gestesCochesParDate },
    };
    // Migration douce : avant le suivi par date, les gestes cochés étaient
    // stockés dans `completedToday` sans date. On les rattache à aujourd'hui
    // pour ne rien perdre, puis on abandonne ce champ.
    if (Array.isArray(parsed.completedToday) && !parsed.gestesCochesParDate) {
      state.gestesCochesParDate[dateDuJour()] = parsed.completedToday;
    }
    delete state.completedToday;

    // Migration douce : streak/joker n'existaient pas avant cette version.
    // On les initialise sans écraser une valeur déjà présente (fusion superficielle
    // pour rester robuste si un champ imbriqué venait à manquer).
    state.streak = { ...STREAK_PAR_DEFAUT, ...(parsed.streak || {}) };
    state.joker = { ...JOKER_PAR_DEFAUT, ...(parsed.joker || {}) };
    // Migration douce (badges) : `dejaUtilise` n'existait pas avant cette version.
    // Si le joker de la semaine en cours est déjà entamé, on peut en déduire
    // qu'il a servi au moins une fois, pour ne pas priver injustement du badge
    // "Joker utilisé" un état déjà en cours d'utilisation.
    if (!state.joker.dejaUtilise && state.joker.disponible < JOKERS_PAR_SEMAINE) {
      state.joker.dejaUtilise = true;
    }

    // Migration douce : l'onboarding n'existait pas avant cette version. Un
    // état déjà en cours d'usage (points > 0) a forcément passé un onboarding
    // qui n'existait pas encore : on le marque terminé pour ne pas le
    // ré-afficher à un utilisateur existant.
    state.onboarding = { ...ONBOARDING_PAR_DEFAUT, ...(parsed.onboarding || {}) };
    if (!parsed.onboarding && state.points > 0) {
      state.onboarding.termine = true;
    }

    return state;
  } catch {
    return { ...DEFAULT_STATE, gestesCochesParDate: {} };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible (navigation privée, quota dépassé…) : on continue sans persister
  }
}

// --- Export / import de l'état (sauvegarde manuelle) ---
//
// Un vidage du stockage du navigateur détruit tout l'historique de
// l'utilisateur (voir CLAUDE.md, dette connue) : l'export/import manuel est
// le seul filet de sécurité tant que la synchronisation Supabase (phase 4)
// n'existe pas.
//
// Format d'export : une enveloppe { format, version, exporteLe, etat } plutôt
// que l'état brut, pour distinguer un fichier EcoQuest d'un JSON quelconque à
// l'import et pouvoir faire évoluer le format plus tard sans casser les
// anciens exports.

const EXPORT_FORMAT = "ecoquest-export";
const EXPORT_VERSION = 1;

export function exporterEtatJSON(state) {
  return JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, exporteLe: new Date().toISOString(), etat: state },
    null,
    2
  );
}

function estObjetSimple(valeur) {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function estTableauDeChaines(valeur) {
  return Array.isArray(valeur) && valeur.every((v) => typeof v === "string");
}

function estGestesCochesParDateValide(valeur) {
  return (
    estObjetSimple(valeur) &&
    Object.entries(valeur).every(([cle, val]) => /^\d{4}-\d{2}-\d{2}$/.test(cle) && estTableauDeChaines(val))
  );
}

function estStreakValide(valeur) {
  return (
    estObjetSimple(valeur) &&
    typeof valeur.actuel === "number" &&
    (valeur.dernierJourValide === null || typeof valeur.dernierJourValide === "string") &&
    typeof valeur.dernierJourViaJoker === "boolean" &&
    typeof valeur.jokerUtiliseDansStreak === "boolean"
  );
}

function estJokerValide(valeur) {
  return (
    estObjetSimple(valeur) &&
    typeof valeur.disponible === "number" &&
    (valeur.semaine === null || typeof valeur.semaine === "string") &&
    typeof valeur.dejaUtilise === "boolean"
  );
}

function estOnboardingValide(valeur) {
  return (
    estObjetSimple(valeur) &&
    typeof valeur.termine === "boolean" &&
    typeof valeur.prenom === "string" &&
    estTableauDeChaines(valeur.categoriesPrioritaires) &&
    typeof valeur.heureRappel === "string"
  );
}

// Valide la structure minimale attendue d'un état EcoQuest (sans dépendre du
// catalogue de gestes, indisponible à l'import). Volontairement stricte sur
// les types pour ne jamais laisser une donnée corrompue écraser l'état actuel.
export function validerEtat(etat) {
  return (
    estObjetSimple(etat) &&
    typeof etat.points === "number" &&
    Number.isFinite(etat.points) &&
    etat.points >= 0 &&
    estGestesCochesParDateValide(etat.gestesCochesParDate) &&
    typeof etat.activeTab === "string" &&
    estStreakValide(etat.streak) &&
    estJokerValide(etat.joker) &&
    (etat.erreurs === undefined || Array.isArray(etat.erreurs)) &&
    (etat.onboarding === undefined || estOnboardingValide(etat.onboarding))
  );
}

// Parse et valide un export JSON. Ne lève jamais d'exception : renvoie
// { valide: false, erreur } pour tout fichier invalide, sans qu'aucun état ne
// doive être appliqué par l'appelant (l'état existant reste intact).
export function importerEtatJSON(texte) {
  let payload;
  try {
    payload = JSON.parse(texte);
  } catch {
    return { valide: false, erreur: "Ce fichier n'est pas un JSON valide." };
  }

  if (!estObjetSimple(payload)) {
    return { valide: false, erreur: "Format de fichier inattendu." };
  }

  const etatBrut = payload.format === EXPORT_FORMAT && estObjetSimple(payload.etat) ? payload.etat : payload;

  if (!validerEtat(etatBrut)) {
    return { valide: false, erreur: "Fichier invalide : ce n'est pas une sauvegarde EcoQuest reconnue." };
  }

  const etat = {
    ...DEFAULT_STATE,
    ...etatBrut,
    gestesCochesParDate: { ...etatBrut.gestesCochesParDate },
    streak: { ...STREAK_PAR_DEFAUT, ...etatBrut.streak },
    joker: { ...JOKER_PAR_DEFAUT, ...etatBrut.joker },
    erreurs: Array.isArray(etatBrut.erreurs) ? etatBrut.erreurs : [],
    onboarding: { ...ONBOARDING_PAR_DEFAUT, ...etatBrut.onboarding },
  };

  return { valide: true, etat };
}
