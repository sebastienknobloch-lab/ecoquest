import { loadState, saveState } from "./state.js";
import { renderAujourdhui } from "./views/aujourdhui.js";
import { renderDefis } from "./views/defis.js";
import { renderFoyer } from "./views/foyer.js";
import { renderProfil } from "./views/profil.js";
import { debugDemandeParUrl, activerConsoleDebug } from "./debug.js";

const VUES = {
  aujourdhui: renderAujourdhui,
  defis: renderDefis,
  foyer: renderFoyer,
  profil: renderProfil,
};

const viewRoot = document.querySelector("[data-view-root]");
const tabBar = document.querySelector("[data-tab-bar]");
const tabButtons = tabBar ? Array.from(tabBar.querySelectorAll("[data-tab]")) : [];
const statusEl = document.querySelector("[data-app-status]");

let state = loadState();

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function persist(nextState) {
  state = nextState;
  saveState(state);
}

function mettreAJourOngletActif() {
  tabButtons.forEach((btn) => {
    const actif = btn.dataset.tab === state.activeTab;
    btn.classList.toggle("active", actif);
    btn.setAttribute("aria-current", actif ? "page" : "false");
  });
}

function afficherVueActive() {
  if (!viewRoot) return;
  const vue = VUES[state.activeTab] || VUES.aujourdhui;
  vue(viewRoot, state, persist);
  mettreAJourOngletActif();
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab === state.activeTab) return;
    persist({ ...state, activeTab: btn.dataset.tab });
    afficherVueActive();
  });
});

// Sans ce rechargement automatique, un nouveau service worker (cache renommé)
// s'installe bien en tâche de fond mais la page déjà ouverte continue de tourner
// avec les anciens fichiers JS tant qu'elle n'est pas rechargée manuellement —
// bug déjà rencontré plusieurs fois sur ce projet (voir changelog.md).
function surveillerMiseAJourServiceWorker() {
  let dejaRecharge = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (dejaRecharge) return;
    dejaRecharge = true;
    window.location.reload();
  });
}

// Une PWA installée est le plus souvent *reprise* depuis l'arrière-plan (l'OS
// garde le processus en mémoire) plutôt que rechargée à chaque ouverture : dans
// ce cas, l'événement "load" ne se redéclenche jamais, donc le navigateur ne
// revérifie jamais spontanément si sw.js a changé. Sans ceci, une PWA installée
// peut rester bloquée indéfiniment sur une ancienne version tant qu'elle n'est
// pas explicitement fermée puis rouverte — contrairement à un onglet de
// navigateur classique, toujours rechargé au prochain accès.
function verifierMiseAJourAuRetourPremierPlan(registration) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      registration.update().catch(() => {});
    }
  });
}

function initServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setStatus(isInstalled() ? "Application installée ✅" : "Prête");
    return;
  }
  surveillerMiseAJourServiceWorker();
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        verifierMiseAJourAuRetourPremierPlan(registration);
        setStatus(
          isInstalled()
            ? "Application installée ✅"
            : "Prête, installe-moi sur ton téléphone 📲"
        );
      })
      .catch(() => setStatus("Prête (hors-ligne indisponible)"));
  });
}

afficherVueActive();
initServiceWorker();

if (debugDemandeParUrl()) {
  activerConsoleDebug();
}
