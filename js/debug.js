// Console de debug embarquée (Eruda), pour inspecter l'app dans une WebView
// sans Mac ni câble. Jamais chargée en usage normal : uniquement si l'URL
// contient ?debug=1, ou après 5 taps sur le numéro de version (écran Profil).

// Deux CDN essayés dans l'ordre : si l'un est bloqué ou indisponible sur le
// réseau de l'utilisateur, l'autre prend le relais (conforme à CLAUDE.md :
// esm.sh / jsDelivr).
const ERUDA_MODULE_URLS = [
  "https://esm.sh/eruda@3",
  "https://cdn.jsdelivr.net/npm/eruda@3/+esm",
];
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

// Sans navigateur relié à un ordinateur, un échec de chargement silencieux
// serait invisible pour l'utilisateur — ici justement l'outil censé lui
// montrer les erreurs. En cas d'échec des deux CDN, on le prévient donc
// explicitement plutôt que de ne rien faire.
export async function activerConsoleDebug() {
  if (erudaChargee) return;
  erudaChargee = true;

  for (const url of ERUDA_MODULE_URLS) {
    try {
      const module = await import(/* webpackIgnore: true */ url);
      const eruda = module.default || module;
      eruda.init();
      return;
    } catch {
      // CDN suivant.
    }
  }

  erudaChargee = false;
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(
      "Console de debug : échec du chargement depuis les deux CDN (esm.sh, jsDelivr). Vérifie la connexion réseau."
    );
  }
}

export function surveillerTapsVersion(element, onActivation = activerConsoleDebug) {
  if (!element) return;
  const enregistrerTap = creerCompteurTaps();
  element.addEventListener("click", () => {
    if (enregistrerTap()) onActivation();
  });
}
