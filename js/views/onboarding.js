// Onboarding en 3 écrans, affiché une seule fois avant la navigation à onglets
// (voir js/app.js) : prénom, 3 catégories prioritaires, heure de rappel
// souhaitée. Les catégories choisies orientent ensuite la sélection des
// gestes du jour (voir selectionDuJour dans js/gamification.js) ; l'heure est
// stockée mais pas encore utilisée (la programmation du rappel local arrive
// en session 29).
import { LIBELLES_CATEGORIES } from "./aujourdhui.js";

const NB_CATEGORIES_A_CHOISIR = 3;

export function renderOnboarding(container, state, onTermine) {
  let etape = 1;
  let prenom = state.onboarding?.prenom || "";
  let categoriesPrioritaires = [...(state.onboarding?.categoriesPrioritaires || [])];
  let heureRappel = state.onboarding?.heureRappel || "19:00";

  function terminer() {
    onTermine({
      ...state,
      onboarding: {
        termine: true,
        prenom: prenom.trim(),
        categoriesPrioritaires,
        heureRappel,
      },
    });
  }

  function creerEnTete() {
    const entete = document.createElement("p");
    entete.className = "onboarding-etape-compteur";
    entete.textContent = `Étape ${etape} sur 3`;
    return entete;
  }

  function creerEcranPrenom() {
    const titre = document.createElement("h2");
    titre.className = "section-titre";
    titre.textContent = "Comment tu t'appelles ?";

    const label = document.createElement("label");
    label.className = "onboarding-label";
    label.textContent = "Ton prénom";
    label.htmlFor = "onboarding-prenom";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "onboarding-prenom";
    input.className = "onboarding-champ";
    input.autocomplete = "given-name";
    input.value = prenom;
    input.placeholder = "Ton prénom";

    const suivantBtn = document.createElement("button");
    suivantBtn.type = "button";
    suivantBtn.textContent = "Suivant";

    function majEtatBouton() {
      suivantBtn.disabled = input.value.trim().length === 0;
    }

    input.addEventListener("input", () => {
      prenom = input.value;
      majEtatBouton();
    });
    majEtatBouton();

    suivantBtn.addEventListener("click", () => {
      if (input.value.trim().length === 0) return;
      etape = 2;
      afficherEtape();
    });

    return [titre, label, input, suivantBtn];
  }

  function creerEcranCategories() {
    const titre = document.createElement("h2");
    titre.className = "section-titre";
    titre.textContent = `${prenom.trim()}, quelles catégories comptent le plus pour toi ?`;

    const consigne = document.createElement("p");
    consigne.className = "onboarding-consigne";
    consigne.textContent = `Choisis-en ${NB_CATEGORIES_A_CHOISIR} : tes 3 gestes du jour viendront en priorité de ces catégories.`;

    const compteur = document.createElement("p");
    compteur.className = "onboarding-compteur-selection";

    const grille = document.createElement("div");
    grille.className = "onboarding-categories";

    function majCompteur() {
      compteur.textContent = `${categoriesPrioritaires.length}/${NB_CATEGORIES_A_CHOISIR} sélectionnées`;
    }

    Object.entries(LIBELLES_CATEGORIES).forEach(([categorieId, libelle]) => {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "onboarding-categorie";
      bouton.textContent = libelle;
      bouton.setAttribute("aria-pressed", String(categoriesPrioritaires.includes(categorieId)));
      bouton.classList.toggle("onboarding-categorie--selectionnee", categoriesPrioritaires.includes(categorieId));

      bouton.addEventListener("click", () => {
        const dejaChoisie = categoriesPrioritaires.includes(categorieId);
        if (dejaChoisie) {
          categoriesPrioritaires = categoriesPrioritaires.filter((c) => c !== categorieId);
        } else if (categoriesPrioritaires.length < NB_CATEGORIES_A_CHOISIR) {
          categoriesPrioritaires = [...categoriesPrioritaires, categorieId];
        } else {
          return;
        }
        bouton.setAttribute("aria-pressed", String(!dejaChoisie));
        bouton.classList.toggle("onboarding-categorie--selectionnee", !dejaChoisie);
        majCompteur();
        majEtatBouton();
      });

      grille.append(bouton);
    });

    const boutons = document.createElement("div");
    boutons.className = "onboarding-navigation";

    const precedentBtn = document.createElement("button");
    precedentBtn.type = "button";
    precedentBtn.className = "bouton-secondaire";
    precedentBtn.textContent = "Précédent";
    precedentBtn.addEventListener("click", () => {
      etape = 1;
      afficherEtape();
    });

    const suivantBtn = document.createElement("button");
    suivantBtn.type = "button";
    suivantBtn.textContent = "Suivant";

    function majEtatBouton() {
      suivantBtn.disabled = categoriesPrioritaires.length !== NB_CATEGORIES_A_CHOISIR;
    }

    suivantBtn.addEventListener("click", () => {
      if (categoriesPrioritaires.length !== NB_CATEGORIES_A_CHOISIR) return;
      etape = 3;
      afficherEtape();
    });

    majCompteur();
    majEtatBouton();

    boutons.append(precedentBtn, suivantBtn);

    return [titre, consigne, grille, compteur, boutons];
  }

  function creerEcranHeureRappel() {
    const titre = document.createElement("h2");
    titre.className = "section-titre";
    titre.textContent = "À quelle heure veux-tu qu'on te fasse penser à tes gestes ?";

    const consigne = document.createElement("p");
    consigne.className = "onboarding-consigne";
    consigne.textContent = "Le rappel n'est pas encore actif : on te redemandera avant de l'activer.";

    const label = document.createElement("label");
    label.className = "onboarding-label";
    label.textContent = "Heure du rappel";
    label.htmlFor = "onboarding-heure";

    const input = document.createElement("input");
    input.type = "time";
    input.id = "onboarding-heure";
    input.className = "onboarding-champ";
    input.value = heureRappel;
    input.addEventListener("input", () => {
      if (input.value) heureRappel = input.value;
    });

    const boutons = document.createElement("div");
    boutons.className = "onboarding-navigation";

    const precedentBtn = document.createElement("button");
    precedentBtn.type = "button";
    precedentBtn.className = "bouton-secondaire";
    precedentBtn.textContent = "Précédent";
    precedentBtn.addEventListener("click", () => {
      etape = 2;
      afficherEtape();
    });

    const terminerBtn = document.createElement("button");
    terminerBtn.type = "button";
    terminerBtn.textContent = "Terminer";
    terminerBtn.addEventListener("click", terminer);

    boutons.append(precedentBtn, terminerBtn);

    return [titre, consigne, label, input, boutons];
  }

  function afficherEtape() {
    container.innerHTML = "";

    const section = document.createElement("section");
    section.className = "onboarding";

    const elements =
      etape === 1 ? creerEcranPrenom() : etape === 2 ? creerEcranCategories() : creerEcranHeureRappel();

    section.append(creerEnTete(), ...elements);
    container.append(section);
  }

  afficherEtape();
}
