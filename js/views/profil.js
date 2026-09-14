import {
  calculerBadges,
  calculerEquivalences,
  impactCumuleGrammes,
  nombreGestesAVerifier,
} from "../gamification.js";
import { APP_VERSION } from "../version.js";
import { surveillerTapsVersion } from "../debug.js";

export function renderProfil(container, state) {
  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "profil";

  const impactTitre = document.createElement("h2");
  impactTitre.className = "section-titre";
  impactTitre.textContent = "🌍 Ton impact cumulé";

  const impactBloc = document.createElement("div");
  impactBloc.className = "impact-bloc";

  const impactTotal = document.createElement("p");
  impactTotal.className = "impact-total";

  const impactAVerifier = document.createElement("p");
  impactAVerifier.className = "impact-a-verifier";

  const impactListe = document.createElement("ul");
  impactListe.className = "impact-liste";

  impactBloc.append(impactTotal, impactAVerifier, impactListe);

  const titre = document.createElement("h2");
  titre.className = "section-titre";
  titre.textContent = "🙂 Tes badges";

  const grille = document.createElement("div");
  grille.className = "badges-grille";

  const statusEl = document.createElement("p");
  statusEl.className = "status";
  statusEl.textContent = "Chargement…";

  // 5 taps rapides ici activent la console de debug embarquée (voir js/debug.js) :
  // jamais visible autrement, jamais chargée en usage normal.
  const versionEl = document.createElement("p");
  versionEl.className = "profil-version";
  versionEl.textContent = `EcoQuest v${APP_VERSION}`;
  surveillerTapsVersion(versionEl);

  section.append(impactTitre, impactBloc, titre, grille, statusEl, versionEl);
  container.append(section);

  function afficherImpact(gestes) {
    const totalGrammes = impactCumuleGrammes(state, gestes);
    const totalKg = totalGrammes / 1000;
    impactTotal.textContent =
      totalGrammes > 0
        ? `≈ ${totalKg.toFixed(1)} kg de CO2 évités au total (estimation)`
        : "Valide tes premiers gestes pour voir ton impact cumulé.";

    const nbAVerifier = nombreGestesAVerifier(state, gestes);
    impactAVerifier.hidden = nbAVerifier === 0;
    impactAVerifier.textContent =
      nbAVerifier > 0
        ? `Dont ${nbAVerifier} geste${nbAVerifier > 1 ? "s" : ""} validé${nbAVerifier > 1 ? "s" : ""} basé${nbAVerifier > 1 ? "s" : ""} sur un ordre de grandeur encore à confirmer.`
        : "";

    impactListe.innerHTML = "";
    if (totalGrammes === 0) return;

    calculerEquivalences(state, gestes).forEach((equivalence) => {
      if (equivalence.valeur <= 0) return;
      const li = document.createElement("li");
      li.className = "impact-item";

      const icone = document.createElement("span");
      icone.className = "impact-icone";
      icone.setAttribute("aria-hidden", "true");
      icone.textContent = equivalence.icone;

      const texte = document.createElement("span");
      texte.className = "impact-texte";

      const valeur = document.createElement("strong");
      valeur.textContent = `≈ ${equivalence.valeur} ${equivalence.unite}`;

      const source = document.createElement("small");
      source.className = "impact-source";
      source.textContent = `estimation — ${equivalence.source}`;

      texte.append(valeur, source);
      li.append(icone, texte);
      impactListe.append(li);
    });
  }

  function afficherBadges(gestes) {
    grille.innerHTML = "";
    calculerBadges(state, gestes).forEach((badge) => {
      const carte = document.createElement("div");
      carte.className = `badge-carte ${badge.obtenu ? "badge-carte--obtenu" : "badge-carte--verrouille"}`;
      carte.setAttribute(
        "aria-label",
        `${badge.libelle} : ${badge.obtenu ? "obtenu" : "à débloquer"} — ${badge.description}`
      );

      const icone = document.createElement("span");
      icone.className = "badge-icone";
      icone.setAttribute("aria-hidden", "true");
      icone.textContent = badge.obtenu ? badge.icone : "🔒";

      const libelle = document.createElement("strong");
      libelle.className = "badge-libelle";
      libelle.textContent = badge.libelle;

      const description = document.createElement("small");
      description.className = "badge-description";
      description.textContent = badge.description;

      carte.append(icone, libelle, description);
      grille.append(carte);
    });
  }

  fetch("data/gestes.json")
    .then((reponse) => {
      if (!reponse.ok) throw new Error("gestes.json indisponible");
      return reponse.json();
    })
    .then((gestes) => {
      afficherImpact(gestes);
      afficherBadges(gestes);
      statusEl.remove();
    })
    .catch(() => {
      // Le catalogue sert à la fois à l'impact cumulé et au badge "Toutes les
      // couleurs" : sans lui, ni l'un ni l'autre ne peuvent être calculés,
      // mais les 7 autres badges restent corrects.
      afficherImpact([]);
      afficherBadges([]);
      statusEl.textContent = "Catalogue indisponible : impact cumulé et « Toutes les couleurs » non calculables.";
    });
}
