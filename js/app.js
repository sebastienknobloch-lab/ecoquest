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

function initServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setStatus(isInstalled() ? "Application installée ✅" : "Prête");
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() =>
        setStatus(
          isInstalled()
            ? "Application installée ✅"
            : "Prête, installe-moi sur ton téléphone 📲"
        )
      )
      .catch(() => setStatus("Prête (hors-ligne indisponible)"));
  });
}

afficherVueActive();
initServiceWorker();

if (debugDemandeParUrl()) {
  activerConsoleDebug();
}
