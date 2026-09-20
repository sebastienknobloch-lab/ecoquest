import {
  calculerBadges,
  calculerEquivalences,
  calendrierMois,
  impactCumuleGrammes,
  moisAdjacent,
  nombreGestesAVerifier,
} from "../gamification.js";
import { dateDuJour, exporterEtatJSON, importerEtatJSON } from "../state.js";
import { APP_VERSION } from "../version.js";
import { activerConsoleDebug, surveillerTapsVersion } from "../debug.js";
import { afficherEcranDebug } from "./debug.js";

// Isolé de tout accès DOM pour rester testable avec `node --test`.
export function nomFichierExportEtat(maintenant = new Date()) {
  const iso = maintenant.toISOString().replace(/[:.]/g, "-");
  return `ecoquest-sauvegarde-${iso}.json`;
}

// Sur Android, en PWA installée (mode standalone), le WebView n'ouvre pas
// toujours le gestionnaire de téléchargements pour un lien <a download> vers
// une blob: URL — le clic ne fait alors rien de visible. Le partage natif
// (feuille de partage du système) fonctionne dans ce contexte-là, donc on le
// tente en priorité ; le téléchargement classique reste utilisé quand le
// partage de fichier n'est pas supporté (desktop, anciens navigateurs).
async function exporterEtat(state, afficherMessage) {
  const texte = exporterEtatJSON(state);
  const nomFichier = nomFichierExportEtat();

  if (navigator.share && navigator.canShare) {
    try {
      const fichier = new File([texte], nomFichier, { type: "application/json" });
      if (navigator.canShare({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: nomFichier });
        return;
      }
    } catch (erreur) {
      // Partage annulé par l'utilisateur : on n'enchaîne pas sur un
      // téléchargement, ce serait surprenant après une annulation explicite.
      if (erreur && erreur.name === "AbortError") return;
    }
  }

  try {
    const blob = new Blob([texte], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    document.body.append(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  } catch {
    afficherMessage?.(
      "Le téléchargement n'a pas fonctionné sur cet appareil. Réessaie depuis Chrome, hors de l'application installée.",
      true
    );
  }
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

  const historiqueTitre = document.createElement("h2");
  historiqueTitre.className = "section-titre";
  historiqueTitre.textContent = "🗓️ Ton historique";

  const historiqueBloc = document.createElement("div");
  historiqueBloc.className = "historique-bloc";

  const historiqueEntete = document.createElement("div");
  historiqueEntete.className = "historique-entete";

  const moisPrecedentBtn = document.createElement("button");
  moisPrecedentBtn.type = "button";
  moisPrecedentBtn.className = "historique-nav";
  moisPrecedentBtn.setAttribute("aria-label", "Mois précédent");
  moisPrecedentBtn.textContent = "‹";

  const moisLabel = document.createElement("p");
  moisLabel.className = "historique-mois";

  const moisSuivantBtn = document.createElement("button");
  moisSuivantBtn.type = "button";
  moisSuivantBtn.className = "historique-nav";
  moisSuivantBtn.setAttribute("aria-label", "Mois suivant");
  moisSuivantBtn.textContent = "›";

  historiqueEntete.append(moisPrecedentBtn, moisLabel, moisSuivantBtn);

  const historiqueSemaine = document.createElement("div");
  historiqueSemaine.className = "historique-semaine";
  ["L", "M", "M", "J", "V", "S", "D"].forEach((label) => {
    const jourLabel = document.createElement("span");
    jourLabel.textContent = label;
    historiqueSemaine.append(jourLabel);
  });

  const historiqueGrille = document.createElement("div");
  historiqueGrille.className = "historique-grille";

  historiqueBloc.append(historiqueEntete, historiqueSemaine, historiqueGrille);

  // Mois affiché par le calendrier (AAAA-MM-JJ, seuls année/mois comptent) :
  // état purement local à l'écran, jamais persisté dans `state`.
  let moisAffiche = dateDuJour();

  function afficherHistorique() {
    const calendrier = calendrierMois(state, moisAffiche);
    moisLabel.textContent = new Date(calendrier.annee, calendrier.mois - 1, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    // Jamais de navigation vers un mois futur : rien à y afficher.
    moisSuivantBtn.disabled = moisAffiche.slice(0, 7) >= dateDuJour().slice(0, 7);

    historiqueGrille.innerHTML = "";
    for (let i = 0; i < calendrier.decalageDebut; i++) {
      const case_ = document.createElement("span");
      case_.className = "historique-jour historique-jour--vide";
      case_.setAttribute("aria-hidden", "true");
      historiqueGrille.append(case_);
    }

    const aujourdhui = dateDuJour();
    calendrier.jours.forEach((jourInfo) => {
      const case_ = document.createElement("span");
      case_.className = [
        "historique-jour",
        jourInfo.actif ? "historique-jour--actif" : "",
        jourInfo.date === aujourdhui ? "historique-jour--aujourdhui" : "",
      ]
        .filter(Boolean)
        .join(" ");
      case_.textContent = String(jourInfo.jour);
      const descriptionGestes =
        jourInfo.nbGestes > 0
          ? `${jourInfo.nbGestes} geste${jourInfo.nbGestes > 1 ? "s" : ""} validé${jourInfo.nbGestes > 1 ? "s" : ""}`
          : "aucun geste validé";
      case_.setAttribute("aria-label", `${jourInfo.jour} ${moisLabel.textContent} : ${descriptionGestes}`);
      historiqueGrille.append(case_);
    });
  }

  moisPrecedentBtn.addEventListener("click", () => {
    moisAffiche = moisAdjacent(moisAffiche, -1);
    afficherHistorique();
  });
  moisSuivantBtn.addEventListener("click", () => {
    if (moisSuivantBtn.disabled) return;
    moisAffiche = moisAdjacent(moisAffiche, 1);
    afficherHistorique();
  });

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
  exporterBtn.addEventListener("click", () => exporterEtat(state, afficherMessageSauvegarde));

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
        afficherHistorique();
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

  section.append(
    impactTitre,
    impactBloc,
    historiqueTitre,
    historiqueBloc,
    titre,
    grille,
    statusEl,
    sauvegardeTitre,
    sauvegardeBloc,
    versionEl
  );
  container.append(section);

  afficherHistorique();

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
