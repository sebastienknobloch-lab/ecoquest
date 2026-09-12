import { loadState, saveState } from "./state.js";
import { cocherGeste, decocherGeste } from "./gamification.js";

const statusEl = document.querySelector("[data-status]");
const pointsEl = document.querySelector("[data-points]");
const listEl = document.querySelector("[data-geste-list]");

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

function renderPoints() {
  if (!pointsEl) return;
  pointsEl.textContent = `${state.points} point${state.points > 1 ? "s" : ""}`;
}

function creerLigneGeste(geste) {
  const li = document.createElement("li");
  li.className = "geste";

  const label = document.createElement("label");
  label.className = "geste-label";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "geste-checkbox";
  checkbox.checked = state.completedToday.includes(geste.id);
  checkbox.addEventListener("change", () => {
    state = checkbox.checked
      ? cocherGeste(state, geste.id)
      : decocherGeste(state, geste.id);
    saveState(state);
    renderPoints();
  });

  const texte = document.createElement("span");
  texte.className = "geste-texte";

  const titre = document.createElement("strong");
  titre.textContent = geste.label;

  const detail = document.createElement("small");
  detail.textContent = `≈ ${geste.co2_evite_g} g CO2 évités (estimation) — ${geste.source}`;

  texte.append(titre, detail);
  label.append(checkbox, texte);
  li.append(label);
  return li;
}

async function chargerGestes() {
  const reponse = await fetch("data/gestes.json");
  if (!reponse.ok) throw new Error("gestes.json indisponible");
  return reponse.json();
}

async function afficherGestesDuJour() {
  if (!listEl) return;
  try {
    const gestes = await chargerGestes();
    gestes.forEach((geste) => listEl.append(creerLigneGeste(geste)));
  } catch {
    setStatus("Impossible de charger les gestes du jour.");
  }
}

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

renderPoints();
afficherGestesDuJour();
initServiceWorker();
