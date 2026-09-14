// Écran de debug : liste les dernières erreurs JS capturées par
// js/erreurs.js et permet de les exporter en JSON. Volontairement un overlay
// plein écran plutôt qu'un 5e onglet, pour ne jamais apparaître en usage
// normal : accessible uniquement via les mêmes déclencheurs que la console
// embarquée (`?debug=1`, ou 5 taps sur le numéro de version en Profil).
import { loadState } from "../state.js";
import { MAX_ERREURS_STOCKEES } from "../erreurs.js";

function formaterHorodatage(horodatageISO) {
  try {
    return new Date(horodatageISO).toLocaleString("fr-FR");
  } catch {
    return horodatageISO;
  }
}

// Isolé de tout accès DOM pour rester testable avec `node --test`.
export function nomFichierExport(maintenant = new Date()) {
  const iso = maintenant.toISOString().replace(/[:.]/g, "-");
  return `ecoquest-erreurs-${iso}.json`;
}

let overlayActif = null;

export function fermerEcranDebug() {
  if (overlayActif) {
    overlayActif.remove();
    overlayActif = null;
  }
}

function exporterErreurs(erreurs) {
  const blob = new Blob([JSON.stringify(erreurs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichierExport();
  document.body.append(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

function creerLigneErreur(erreur) {
  const li = document.createElement("li");
  li.className = "debug-erreur";

  const meta = document.createElement("p");
  meta.className = "debug-erreur-meta";
  meta.textContent = `${formaterHorodatage(erreur.horodatage)} — ${erreur.type}`;

  const message = document.createElement("p");
  message.className = "debug-erreur-message";
  message.textContent = erreur.message;

  li.append(meta, message);

  if (erreur.source) {
    const source = document.createElement("p");
    source.className = "debug-erreur-source";
    const position = [erreur.ligne, erreur.colonne].filter((v) => v != null).join(":");
    source.textContent = position ? `${erreur.source}:${position}` : erreur.source;
    li.append(source);
  }

  if (erreur.pile) {
    const pile = document.createElement("pre");
    pile.className = "debug-erreur-pile";
    pile.textContent = erreur.pile;
    li.append(pile);
  }

  return li;
}

// Lit toujours l'état le plus récent depuis le stockage (plutôt qu'un état
// passé en paramètre) : l'écran peut être ouvert longtemps après le dernier
// rendu d'une vue, et ne doit jamais afficher des erreurs périmées.
export function afficherEcranDebug() {
  fermerEcranDebug();

  const state = loadState();
  const erreurs = [...(state.erreurs || [])].reverse();

  const overlay = document.createElement("div");
  overlay.className = "debug-overlay";

  const entete = document.createElement("div");
  entete.className = "debug-entete";

  const titre = document.createElement("h2");
  titre.textContent = `🐞 Erreurs JS (${erreurs.length}/${MAX_ERREURS_STOCKEES})`;

  const boutons = document.createElement("div");
  boutons.className = "debug-boutons";

  const exporterBtn = document.createElement("button");
  exporterBtn.type = "button";
  exporterBtn.textContent = "Exporter";
  exporterBtn.disabled = erreurs.length === 0;
  exporterBtn.addEventListener("click", () => exporterErreurs(state.erreurs || []));

  const fermerBtn = document.createElement("button");
  fermerBtn.type = "button";
  fermerBtn.textContent = "Fermer";
  fermerBtn.addEventListener("click", fermerEcranDebug);

  boutons.append(exporterBtn, fermerBtn);
  entete.append(titre, boutons);
  overlay.append(entete);

  if (erreurs.length === 0) {
    const vide = document.createElement("p");
    vide.className = "debug-vide";
    vide.textContent = "Aucune erreur enregistrée depuis l'installation de l'app.";
    overlay.append(vide);
  } else {
    const liste = document.createElement("ul");
    liste.className = "debug-liste";
    erreurs.forEach((erreur) => liste.append(creerLigneErreur(erreur)));
    overlay.append(liste);
  }

  document.body.append(overlay);
  overlayActif = overlay;
}
