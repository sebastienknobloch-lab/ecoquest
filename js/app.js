import { loadState, saveState } from "./state.js";
import { renderAujourdhui } from "./views/aujourdhui.js";
import { renderDefis } from "./views/defis.js";
import { renderFoyer } from "./views/foyer.js";
import { renderProfil } from "./views/profil.js";
import { renderOnboarding } from "./views/onboarding.js";
import { renderPermissionNotifications } from "./views/permission-notifications.js";
import {
  doitProposerPermission,
  enregistrerOuvertureDepuisNotification,
  ecouterOuverturesDepuisNotification,
  suivreReglageRappel,
} from "./notifications.js";
import { debugDemandeParUrl, activerConsoleDebug } from "./debug.js";
import { afficherEcranDebug } from "./views/debug.js";
import { installerGestionnaireErreurs, fusionnerErreursRecentes } from "./erreurs.js";

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

// Les vues (js/views/aujourdhui.js, js/views/onboarding.js) reçoivent l'état
// une fois au montage et peuvent le persister bien plus tard à partir de
// cette copie : sans fusion, une erreur ajoutée entre-temps par le
// gestionnaire global (js/erreurs.js) serait écrasée dès le prochain
// persist() de la vue, précisément au moment où on a le plus besoin de la
// garder. `erreurs` est donc toujours reconstruit à partir de la version la
// plus à jour plutôt que d'être pris tel quel dans nextState.
// Tout changement de réglage du rappel, quel que soit l'écran d'origine, est
// aussi noté dans le journal de l'écran de debug (session 34).
function persist(nextState) {
  state = suivreReglageRappel({ ...nextState, erreurs: fusionnerErreursRecentes(state.erreurs, nextState.erreurs) });
  saveState(state);
}

// Si l'écran de demande d'autorisation notifications (session 30) doit
// apparaître, le montage remplace tout #view-root et masque la tab-bar,
// exactement comme l'onboarding. Renvoie vrai si l'écran a été montré, pour
// que l'appelant sache qu'il ne doit rien afficher d'autre par-dessus.
function afficherPermissionSiNecessaire() {
  if (!doitProposerPermission(state)) return false;
  if (tabBar) tabBar.hidden = true;
  renderPermissionNotifications(viewRoot, state, (nouvelEtat) => {
    persist(nouvelEtat);
    afficherApp();
  });
  return true;
}

// Callback donné aux vues à onglets (Aujourd'hui, Défis, Foyer, Profil) : en
// plus de sauvegarder, vérifie après chaque changement d'état si l'écran de
// demande doit apparaître. Si oui, il remplace le contenu de #view-root :
// les mises à jour DOM que la vue appelante ferait ensuite sur ses propres
// éléments (déjà détachés) restent sans effet visible, sans erreur.
function persisterDepuisVue(nextState) {
  persist(nextState);
  afficherPermissionSiNecessaire();
}

function mettreAJourOngletActif() {
  // Ouverture depuis une notification (session 33) : on l'enregistre (taux
// d'action, session 34) et on affiche directement l'écran Aujourd'hui, geste
// du rappel mis en avant. Pendant l'onboarding (cas théorique : aucun rappel
// n'est programmé avant), on enregistre sans interrompre l'écran en cours.
function surOuvertureDepuisNotification(notificationId) {
  persist(enregistrerOuvertureDepuisNotification(state, notificationId));
  if (!viewRoot || !state.onboarding?.termine) return;
  if (tabBar) tabBar.hidden = false;
  if (afficherPermissionSiNecessaire()) return;
  afficherVueActive({ mettreEnAvantGesteDuRappel: true });
}

tabButtons.forEach((btn) => {
    const actif = btn.dataset.tab === state.activeTab;
    btn.classList.toggle("active", actif);
    btn.setAttribute("aria-current", actif ? "page" : "false");
  });
}

function afficherVueActive(options = {}) {
  if (!viewRoot) return;
  const vue = VUES[state.activeTab] || VUES.aujourdhui;
  vue(viewRoot, state, persisterDepuisVue, options);
  mettreAJourOngletActif();
}

// L'onboarding n'apparaît qu'une fois, avant la navigation à onglets : la
// tab-bar reste masquée tant qu'il n'est pas terminé (voir state.onboarding,
// migration douce dans js/state.js pour les utilisateurs déjà en cours d'usage).
function afficherApp() {
  if (tabBar) tabBar.hidden = false;
  if (afficherPermissionSiNecessaire()) return;
  afficherVueActive();
}

function demarrer() {
  if (!viewRoot) return;
  if (!state.onboarding?.termine) {
    if (tabBar) tabBar.hidden = true;
    renderOnboarding(viewRoot, state, (nouvelEtat) => {
      persist(nouvelEtat);
      afficherApp();
    });
    return;
  }
  afficherApp();
}

// Ouverture depuis une notification (session 33) : on l'enregistre (taux
// d'action, session 34) et on affiche directement l'écran Aujourd'hui, geste
// du rappel mis en avant. Pendant l'onboarding (cas théorique : aucun rappel
// n'est programmé avant), on enregistre sans interrompre l'écran en cours.
function surOuvertureDepuisNotification(notificationId) {
  persist(enregistrerOuvertureDepuisNotification(state, notificationId));
  if (!viewRoot || !state.onboarding?.termine) return;
  if (tabBar) tabBar.hidden = false;
  if (afficherPermissionSiNecessaire()) return;
  afficherVueActive({ mettreEnAvantGesteDuRappel: true });
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
      .register("./sw.js", { type: "module" })
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

// Toujours actif (pas seulement en mode debug) : c'est ce qui alimente
// l'écran de debug, jamais l'inverse. Sans Mac ni câble, c'est le seul moyen
// de savoir qu'une erreur JS a eu lieu sur un téléphone donné.
installerGestionnaireErreurs(() => state, persist);

// Rappel déjà actif avant la session 34 : le journal démarre maintenant
// (l'écran de debug affiche la date de début du suivi).
if (suivreReglageRappel(state) !== state) persist(state);

demarrer();
ecouterOuverturesDepuisNotification(surOuvertureDepuisNotification);
initServiceWorker();

if (debugDemandeParUrl()) {
  activerConsoleDebug();
  afficherEcranDebug();
}
