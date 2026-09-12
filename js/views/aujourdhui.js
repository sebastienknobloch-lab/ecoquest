import { cocherGeste, decocherGeste } from "../gamification.js";

const CATEGORIES = [
  { id: "energie", label: "⚡ Énergie" },
  { id: "alimentation", label: "🍎 Alimentation" },
  { id: "deplacements", label: "🚲 Déplacements" },
  { id: "dechets", label: "♻️ Déchets" },
  { id: "numerique", label: "💻 Numérique" },
];

export function renderAujourdhui(container, initialState, persist) {
  let state = initialState;
  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "gestes";

  const pointsEl = document.createElement("p");
  pointsEl.className = "points-total";

  const tagline = document.createElement("p");
  tagline.className = "tagline";
  tagline.textContent = "Coche les éco-gestes réalisés aujourd'hui.";

  const categoriesEl = document.createElement("div");
  categoriesEl.className = "categories";

  const statusEl = document.createElement("p");
  statusEl.className = "status";
  statusEl.textContent = "Chargement…";

  section.append(pointsEl, tagline, categoriesEl, statusEl);
  container.append(section);

  function renderPoints() {
    pointsEl.textContent = `${state.points} point${state.points > 1 ? "s" : ""}`;
  }
  renderPoints();

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
        ? cocherGeste(state, geste)
        : decocherGeste(state, geste);
      persist(state);
      renderPoints();
    });

    const texte = document.createElement("span");
    texte.className = "geste-texte";

    const titre = document.createElement("strong");
    titre.textContent = geste.libelle;

    const detail = document.createElement("small");
    detail.textContent = `≈ ${geste.co2_evite_g} g CO2 évités (estimation) — ${geste.source}`;

    texte.append(titre, detail);
    label.append(checkbox, texte);
    li.append(label);
    return li;
  }

  function creerSectionCategorie(categorie, gestes, ouverte) {
    const details = document.createElement("details");
    details.className = "categorie";
    details.open = ouverte;

    const summary = document.createElement("summary");
    summary.className = "categorie-titre";
    summary.textContent = `${categorie.label} (${gestes.length})`;

    const ul = document.createElement("ul");
    ul.className = "geste-list";
    gestes.forEach((geste) => ul.append(creerLigneGeste(geste)));

    details.append(summary, ul);
    return details;
  }

  async function chargerGestes() {
    const reponse = await fetch("data/gestes.json");
    if (!reponse.ok) throw new Error("gestes.json indisponible");
    return reponse.json();
  }

  chargerGestes()
    .then((gestes) => {
      CATEGORIES.forEach((categorie, index) => {
        const gestesCategorie = gestes.filter((g) => g.categorie === categorie.id);
        if (gestesCategorie.length === 0) return;
        categoriesEl.append(creerSectionCategorie(categorie, gestesCategorie, index === 0));
      });
      statusEl.remove();
    })
    .catch(() => {
      statusEl.textContent = "Impossible de charger les gestes du jour.";
    });
}
