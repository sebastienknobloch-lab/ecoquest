// Console de debug embarquée (Eruda), pour inspecter l'app dans une WebView
// sans Mac ni câble. Jamais chargée en usage normal : uniquement si l'URL
// contient ?debug=1, ou après 5 taps sur le numéro de version (écran Profil).

const ERUDA_MODULE_URL = "https://esm.sh/eruda@3";
const NB_TAPS_REQUIS = 5;
const DELAI_MAX_ENTRE_TAPS_MS = 2000;

export function debugActiveDepuisRecherche(search) {
  try {
    return new URLSearchParams(search).get("debug") === "1";
  } catch {
    return false;
  }
}

export function debugDemandeParUrl() {
  if (typeof window === "undefined") return false;
  return debugActiveDepuisRecherche(window.location.search);
}

// Compteur de taps rapprochés : renvoie une fonction à appeler à chaque tap,
// qui répond `true` quand le seuil est atteint (et se réarme aussitôt).
// Isolé de tout accès DOM pour rester testable avec `node --test`.
export function creerCompteurTaps(nbRequis = NB_TAPS_REQUIS, delaiMaxMs = DELAI_MAX_ENTRE_TAPS_MS) {
  let taps = 0;
  let dernierTap = 0;

  return function enregistrerTap(maintenant = Date.now()) {
    if (maintenant - dernierTap > delaiMaxMs) taps = 0;
    dernierTap = maintenant;
    taps += 1;
    if (taps >= nbRequis) {
      taps = 0;
      return true;
    }
    return false;
  };
}

let erudaChargee = false;

export async function activerConsoleDebug() {
  if (erudaChargee) return;
  erudaChargee = true;
  try {
    const module = await import(/* webpackIgnore: true */ ERUDA_MODULE_URL);
    const eruda = module.default || module;
    eruda.init();
  } catch {
    // CDN indisponible (hors-ligne, par exemple) : pas de console, pas de crash.
    erudaChargee = false;
  }
}

export function surveillerTapsVersion(element, onActivation = activerConsoleDebug) {
  if (!element) return;
  const enregistrerTap = creerCompteurTaps();
  element.addEventListener("click", () => {
    if (enregistrerTap()) onActivation();
  });
}
