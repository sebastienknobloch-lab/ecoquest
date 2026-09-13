import { calculerNiveau, cocherGeste, decocherGeste, selectionDuJour } from "../gamification.js";
import { dateDuJour } from "../state.js";

const CATEGORIES = [
  { id: "energie", label: "⚡ Énergie" },
  { id: "alimentation", label: "🍎 Alimentation" },
  { id: "deplacements", label: "🚲 Déplacements" },
  { id: "dechets", label: "♻️ Déchets" },
  { id: "numerique", label: "💻 Numérique" },
];

export function renderAujourdhui(container, initialState, persist) {
  let state = initialState;
  let gestes = null;
  // Id du geste qui vient d'être coché, pour ne jouer la micro-animation
  // qu'à cet endroit précis lors du prochain rendu.
  let idAAnimer = null;

  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "gestes";

  const niveauBloc = document.createElement("div");
  niveauBloc.className = "niveau-bloc";

  const niveauEntete = document.createElement("div");
  niveauEntete.className = "niveau-entete";

  const niveauBadge = document.createElement("span");
  niveauBadge.className = "niveau-badge";

  const niveauDetail = document.createElement("span");
  niveauDetail.className = "niveau-detail";

  niveauEntete.append(niveauBadge, niveauDetail);

  const niveauBarre = document.createElement("div");
  niveauBarre.className = "niveau-barre";
  niveauBarre.setAttribute("role", "progressbar");
  niveauBarre.setAttribute("aria-valuemin", "0");
  niveauBarre.setAttribute("aria-valuemax", "100");

  const niveauRemplissage = document.createElement("div");
  niveauRemplissage.className = "niveau-barre-remplissage";
  niveauBarre.append(niveauRemplissage);

  niveauBloc.append(niveauEntete, niveauBarre);

  const pointsEl = document.createElement("p");
  pointsEl.className = "points-total";

  const streakEl = document.createElement("p");
  streakEl.className = "streak-bloc";

  const tagline = document.createElement("p");
  tagline.className = "tagline";
  tagline.textContent = "Tes gestes du jour, sélectionnés pour toi.";

  const duJourTitre = document.createElement("h2");
  duJourTitre.className = "section-titre";
  duJourTitre.textContent = "Tes 3 gestes du jour";

  const duJourListe = document.createElement("ul");
  duJourListe.className = "geste-list geste-list--du-jour";

  const catalogueDetails = document.createElement("details");
  catalogueDetails.className = "catalogue-complet";

  const catalogueSummary = document.createElement("summary");
  catalogueSummary.className = "catalogue-complet-titre";

  const categoriesEl = document.createElement("div");
  categoriesEl.className = "categories";

  catalogueDetails.append(catalogueSummary, categoriesEl);

  const statusEl = document.createElement("p");
  statusEl.className = "status";
  statusEl.textContent = "Chargement…";

  section.append(niveauBloc, pointsEl, streakEl, tagline, duJourTitre, duJourListe, catalogueDetails, statusEl);
  container.append(section);

  function renderPoints() {
    pointsEl.textContent = `${state.points} point${state.points > 1 ? "s" : ""}`;
  }

  function renderStreak() {
    const jours = state.streak.actuel;
    const texteJoker =
      state.joker.disponible > 0
        ? "joker dispo cette semaine"
        : "joker déjà utilisé cette semaine";
    streakEl.textContent =
      jours > 0
        ? `🔥 ${jours} jour${jours > 1 ? "s" : ""} de suite — ${texteJoker}`
        : `Valide un geste aujourd'hui pour démarrer ta série — ${texteJoker}`;
  }

  function renderNiveau() {
    const { niveau, pointsRestants, pourcentage, estNiveauMax } = calculerNiveau(state.points);
    niveauBadge.textContent = `Niveau ${niveau}`;
    niveauDetail.textContent = estNiveauMax
      ? "Niveau maximum atteint !"
      : `${pointsRestants} point${pointsRestants > 1 ? "s" : ""} avant le niveau ${niveau + 1}`;
    niveauRemplissage.style.width = `${pourcentage}%`;
    niveauBarre.setAttribute("aria-valuenow", String(pourcentage));
    niveauBarre.setAttribute("aria-label", `Progression niveau ${niveau}`);
  }

  renderPoints();
  renderNiveau();
  renderStreak();

  function estCoche(geste, dateISO) {
    return (state.gestesCochesParDate[dateISO] || []).includes(geste.id);
  }

  function basculerGeste(geste, dateISO, coche) {
    state = coche ? cocherGeste(state, geste, dateISO) : decocherGeste(state, geste, dateISO);
    persist(state);
    renderPoints();
    renderNiveau();
    renderStreak();
    idAAnimer = coche ? geste.id : null;
    afficherTout();
  }

  function creerLigneGeste(geste, dateISO, { microAnimation } = {}) {
    const li = document.createElement("li");
    li.className = "geste";
    if (microAnimation && geste.id === idAAnimer) {
      li.classList.add("geste--du-jour", "geste--validee");
    }

    const label = document.createElement("label");
    label.className = "geste-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "geste-checkbox";
    checkbox.checked = estCoche(geste, dateISO);
    checkbox.addEventListener("change", () => {
      basculerGeste(geste, dateISO, checkbox.checked);
    });

    const texte = document.createElement("span");
    texte.className = "geste-texte";

    const titre = document.createElement("strong");
    titre.textContent = geste.libelle;

    const detail = document.createElement("small");
    detail.textContent = geste.a_verifier
      ? `ordre de grandeur à confirmer — ${geste.source}`
      : `≈ ${geste.co2_evite_g} g CO2 évités (estimation) — ${geste.source}`;

    texte.append(titre, detail);
    label.append(checkbox, texte);
    li.append(label);
    return li;
  }

  function creerSectionCategorie(categorie, gestesCategorie, dateISO) {
    const details = document.createElement("details");
    details.className = "categorie";
    details.dataset.categorieId = categorie.id;

    const summary = document.createElement("summary");
    summary.className = "categorie-titre";
    summary.textContent = `${categorie.label} (${gestesCategorie.length})`;

    const ul = document.createElement("ul");
    ul.className = "geste-list";
    gestesCategorie.forEach((geste) => ul.append(creerLigneGeste(geste, dateISO)));

    details.append(summary, ul);
    return details;
  }

  async function chargerGestes() {
    const reponse = await fetch("data/gestes.json");
    if (!reponse.ok) throw new Error("gestes.json indisponible");
    return reponse.json();
  }

  function afficherGestesDuJour(dateISO) {
    duJourListe.innerHTML = "";
    selectionDuJour(gestes, dateISO).forEach((geste) => {
      duJourListe.append(creerLigneGeste(geste, dateISO, { microAnimation: true }));
    });
  }

  function afficherCatalogueComplet(dateISO) {
    // Reconstruire les <details> de catégorie perd leur attribut `open` : on
    // relève celles qui étaient dépliées pour les redéplier après coup. Au
    // tout premier affichage, aucune catégorie n'existe encore : on ouvre
    // Énergie par défaut, comme annoncé en session 5.
    const premierAffichage = categoriesEl.childElementCount === 0;
    const categoriesOuvertes = new Set(
      Array.from(categoriesEl.querySelectorAll(".categorie[open]")).map(
        (details) => details.dataset.categorieId,
      ),
    );

    categoriesEl.innerHTML = "";
    catalogueSummary.textContent = `Catalogue complet (${gestes.length} gestes)`;
    CATEGORIES.forEach((categorie) => {
      const gestesCategorie = gestes.filter((g) => g.categorie === categorie.id);
      if (gestesCategorie.length === 0) return;
      const details = creerSectionCategorie(categorie, gestesCategorie, dateISO);
      details.open = premierAffichage
        ? categorie.id === "energie"
        : categoriesOuvertes.has(categorie.id);
      categoriesEl.append(details);
    });
  }

  function afficherTout() {
    const dateISO = dateDuJour();
    afficherGestesDuJour(dateISO);
    afficherCatalogueComplet(dateISO);
  }

  chargerGestes()
    .then((gestesRecus) => {
      gestes = gestesRecus;
      afficherTout();
      statusEl.remove();
    })
    .catch(() => {
      statusEl.textContent = "Impossible de charger les gestes du jour.";
    });
}
