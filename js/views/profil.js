import { calculerBadges } from "../gamification.js";

export function renderProfil(container, state) {
  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "profil";

  const titre = document.createElement("h2");
  titre.className = "section-titre";
  titre.textContent = "🙂 Tes badges";

  const grille = document.createElement("div");
  grille.className = "badges-grille";

  const statusEl = document.createElement("p");
  statusEl.className = "status";
  statusEl.textContent = "Chargement…";

  section.append(titre, grille, statusEl);
  container.append(section);

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
      afficherBadges(gestes);
      statusEl.remove();
    })
    .catch(() => {
      // Le catalogue ne sert qu'au badge "Toutes les couleurs" : sans lui, les
      // 7 autres badges restent corrects, seul celui-là reste verrouillé.
      afficherBadges([]);
      statusEl.textContent = "Catalogue indisponible : « Toutes les couleurs » ne peut pas être calculé.";
    });
}
