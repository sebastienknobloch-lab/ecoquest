const STORAGE_KEY = "ecoquest-v1";

// Toute nouvelle propriété doit avoir une valeur par défaut ici
// (migration douce : les données existantes ne sont jamais perdues).
const DEFAULT_STATE = {
  points: 0,
  gestesCochesParDate: {},
  activeTab: "aujourdhui",
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
