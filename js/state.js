const STORAGE_KEY = "ecoquest-v1";

// Toute nouvelle propriété doit avoir une valeur par défaut ici
// (migration douce : les données existantes ne sont jamais perdues).
const DEFAULT_STATE = {
  points: 0,
  completedToday: [],
};

export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ...DEFAULT_STATE };
  }

  if (!raw) return { ...DEFAULT_STATE };

  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible (navigation privée, quota dépassé…) : on continue sans persister
  }
}
