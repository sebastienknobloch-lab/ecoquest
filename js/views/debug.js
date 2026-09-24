// Écran de debug : liste les dernières erreurs JS capturées par
// js/erreurs.js et permet de les exporter en JSON. Volontairement un overlay
// plein écran plutôt qu'un 5e onglet, pour ne jamais apparaître en usage
// normal : accessible uniquement via les mêmes déclencheurs que la console
// embarquée (`?debug=1`, ou 5 taps sur le numéro de version en Profil).
import { loadState } from "../state.js";
import { MAX_ERREURS_STOCKEES } from "../erreurs.js";
import { statistiquesNotifications } from "../notifications.js";

// Seuil du jalon S38 (ROADMAP.md) : sous 20 % de taux d'action, le problème
// est le contenu du rappel, pas la technique.
const SEUIL_TAUX_ACTION = 0.2;

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

// Isolé de tout accès DOM pour rester testable avec `node --test`.
export function formaterTaux(taux) {
  return taux === null ? "—" : `${Math.round(taux * 100)} %`;
}

// Tableau de bord du propriétaire, pas de l'utilisateur : visible uniquement
// sur cet écran de debug, jamais ailleurs dans l'app.
function creerSectionNotifications(state) {
  const section = document.createElement("section");
  section.className = "debug-section";

  const titre = document.createElement("h3");
  titre.textContent = "🔔 Notifications";
  section.append(titre);

  const periodes = [7, 30].map((jours) => ({ jours, stats: statistiquesNotifications(state, jours) }));

  const table = document.createElement("table");
  table.className = "debug-stats";
  const entete = document.createElement("tr");
  ["", "7 j", "30 j"].forEach((texte) => {
    const th = document.createElement("th");
    th.textContent = texte;
    entete.append(th);
  });
  table.append(entete);

  const lignes = [
    ["Envoyées (estim.)", (s) => String(s.envoyees)],
    ["Ouvertes depuis notif", (s) => String(s.ouvertes)],
    ["Taux d'action", (s) => formaterTaux(s.tauxAction)],
  ];
  lignes.forEach(([libelle, valeur]) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = libelle;
    tr.append(th);
    periodes.forEach(({ stats }) => {
      const td = document.createElement("td");
      td.textContent = valeur(stats);
      if (libelle === "Taux d'action" && stats.tauxAction !== null && stats.tauxAction < SEUIL_TAUX_ACTION) {
        td.className = "debug-stats--sous-seuil";
      }
      tr.append(td);
    });
    table.append(tr);
  });
  section.append(table);

  const journal = state.notifications?.journalRappel || [];
  const note = document.createElement("p");
  note.className = "debug-note";
  const suivi = journal.length
    ? `Suivi des envois depuis le ${formaterHorodatage(journal[0].le)}.`
    : "Rappel jamais activé : aucun envoi à compter.";
  note.textContent = `${suivi} Rappel actuel : ${state.notifications?.actif ? `actif à ${state.onboarding?.heureRappel}` : "désactivé"}. Seuil S38 : ${formaterTaux(SEUIL_TAUX_ACTION)}.`;
  section.append(note);

  return section;
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
  titre.textContent = "🐞 Debug";

  const boutons = document.createElement("div");
  boutons.className = "debug-boutons";

  const exporterBtn = document.createElement("button");
  exporterBtn.type = "button";
  exporterBtn.textContent = "Exporter";
  exporterBtn.disabled = erreurs.length === 0;
  exporterBtn.addEventListener("click", () => exporterErreurs(state.erreurs || []));

  // Sans Mac ni câble, il n'y a pas de console de développeur fiable pour
  // provoquer une erreur JS à la main sur un téléphone (les erreurs tapées
  // dans la console Eruda restent internes à Eruda, elles ne remontent pas à
  // window.onerror). Ce bouton lève une vraie erreur non interceptée, dans
  // un setTimeout pour qu'elle échappe au gestionnaire de clic et soit
  // capturée comme n'importe quelle erreur réelle par js/erreurs.js.
  const provoquerBtn = document.createElement("button");
  provoquerBtn.type = "button";
  provoquerBtn.textContent = "Provoquer une erreur de test";
  provoquerBtn.addEventListener("click", () => {
    setTimeout(() => {
      throw new Error("Erreur de test provoquée depuis l'écran de debug");
    }, 0);
    // L'erreur est enregistrée de façon synchrone par window.onerror dès
    // qu'elle survient : un léger délai suffit à la voir apparaître ici sans
    // devoir fermer puis rouvrir l'écran à la main.
    setTimeout(afficherEcranDebug, 50);
  });

  const fermerBtn = document.createElement("button");
  fermerBtn.type = "button";
  fermerBtn.textContent = "Fermer";
  fermerBtn.addEventListener("click", fermerEcranDebug);

  boutons.append(exporterBtn, provoquerBtn, fermerBtn);
  entete.append(titre, boutons);
  overlay.append(entete, creerSectionNotifications(state));

  const titreErreurs = document.createElement("h3");
  titreErreurs.className = "debug-titre-section";
  titreErreurs.textContent = `Erreurs JS (${erreurs.length}/${MAX_ERREURS_STOCKEES})`;
  overlay.append(titreErreurs);

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
