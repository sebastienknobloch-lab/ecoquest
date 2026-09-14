import {
  calculerBadges,
  calculerEquivalences,
  impactCumuleGrammes,
  nombreGestesAVerifier,
} from "../gamification.js";
import { exporterEtatJSON, importerEtatJSON } from "../state.js";
import { APP_VERSION } from "../version.js";
import { activerConsoleDebug, surveillerTapsVersion } from "../debug.js";
import { afficherEcranDebug } from "./debug.js";

// Isolé de tout accès DOM pour rester testable avec `node --test`.
export function nomFichierExportEtat(maintenant = new Date()) {
  const iso = maintenant.toISOString().replace(/[:.]/g, "-");
  return `ecoquest-sauvegarde-${iso}.json`;
}

function exporterEtat(state) {
  const blob = new Blob([exporterEtatJSON(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichierExportEtat();
  document.body.append(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

export function renderProfil(container, state, persist) {
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

  // Sauvegarde manuelle : seul filet de sécurité tant que la synchronisation
  // Supabase (phase 4) n'existe pas (un vidage du stockage détruit tout
  // l'historique sinon). Voir js/state.js pour l'export/import et la
  // validation.
  const sauvegardeTitre = document.createElement("h2");
  sauvegardeTitre.className = "section-titre";
  sauvegardeTitre.textContent = "💾 Sauvegarde de tes données";

  const sauvegardeBloc = document.createElement("div");
  sauvegardeBloc.className = "sauvegarde-bloc";

  const exporterBtn = document.createElement("button");
  exporterBtn.type = "button";
  exporterBtn.textContent = "Exporter mes données";
  exporterBtn.addEventListener("click", () => exporterEtat(state));

  const importerBtn = document.createElement("button");
  importerBtn.type = "button";
  importerBtn.className = "bouton-secondaire";
  importerBtn.textContent = "Importer une sauvegarde";

  const fichierInput = document.createElement("input");
  fichierInput.type = "file";
  fichierInput.accept = "application/json,.json";
  fichierInput.hidden = true;

  const sauvegardeMessage = document.createElement("p");
  sauvegardeMessage.className = "sauvegarde-message";
  sauvegardeMessage.hidden = true;

  function afficherMessageSauvegarde(texte, estErreur) {
    sauvegardeMessage.hidden = false;
    sauvegardeMessage.textContent = texte;
    sauvegardeMessage.classList.toggle("sauvegarde-message--erreur", estErreur);
  }

  importerBtn.addEventListener("click", () => fichierInput.click());
  fichierInput.addEventListener("change", () => {
    const fichier = fichierInput.files && fichierInput.files[0];
    fichierInput.value = "";
    if (!fichier) return;

    fichier
      .text()
      .then((texte) => {
        const resultat = importerEtatJSON(texte);
        if (!resultat.valide) {
          afficherMessageSauvegarde(resultat.erreur, true);
          return;
        }
        // L'état existant n'est jamais écrasé avant validation complète (voir
        // importerEtatJSON) : ici l'import est déjà confirmé valide.
        persist(resultat.etat);
        state = resultat.etat;
        afficherImpact(catalogueGestes);
        afficherBadges(catalogueGestes);
        afficherMessageSauvegarde("Import réussi : tes données ont été restaurées.", false);
      })
      .catch(() => afficherMessageSauvegarde("Impossible de lire ce fichier.", true));
  });

  sauvegardeBloc.append(exporterBtn, importerBtn, fichierInput, sauvegardeMessage);

  // 5 taps rapides ici activent la console de debug embarquée (Eruda) et
  // l'écran de debug (erreurs JS capturées, voir js/erreurs.js) : ni l'une ni
  // l'autre jamais visibles autrement, jamais chargées en usage normal.
  const versionEl = document.createElement("p");
  versionEl.className = "profil-version";
  versionEl.textContent = `EcoQuest v${APP_VERSION}`;
  surveillerTapsVersion(versionEl, () => {
    activerConsoleDebug();
    afficherEcranDebug();
  });

  section.append(impactTitre, impactBloc, titre, grille, statusEl, sauvegardeTitre, sauvegardeBloc, versionEl);
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

  // Conservé pour pouvoir rafraîchir l'impact et les badges après un import,
  // sans refaire une requête réseau.
  let catalogueGestes = [];

  fetch("data/gestes.json")
    .then((reponse) => {
      if (!reponse.ok) throw new Error("gestes.json indisponible");
      return reponse.json();
    })
    .then((gestes) => {
      catalogueGestes = gestes;
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
