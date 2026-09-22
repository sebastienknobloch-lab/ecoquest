// Écran de demande d'autorisation des notifications (session 30). Affiché une
// seule fois par utilisateur, jamais au premier lancement : voir
// doitProposerPermission dans js/notifications.js, qui ne le déclenche
// qu'après la toute première validation de geste. Qu'il accepte ou refuse,
// state.notifications.permissionDemandee passe à true dans les deux cas —
// jamais reproposé ensuite (voir CLAUDE.md, un seul essai par utilisateur).
//
// Accepter programme aussitôt le rappel quotidien (branchement session 32,
// voir changelog.md session 31) : c'est le seul moment où l'autorisation
// système vient d'être obtenue, inutile d'attendre un premier passage par
// l'écran Profil pour que « le cœur du produit » (CLAUDE.md) commence à
// sonner. Le catalogue n'est chargé qu'à l'acceptation, jamais au montage :
// inutile de le récupérer pour l'issue la plus fréquente d'un premier essai,
// le refus.
import { demanderPermissionNotifications, programmerRappelQuotidien, contenuRappelPourAujourdhui } from "../notifications.js";

async function chargerCatalogue() {
  try {
    const reponse = await fetch("data/gestes.json");
    if (!reponse.ok) throw new Error("gestes.json indisponible");
    return await reponse.json();
  } catch {
    return [];
  }
}

export function renderPermissionNotifications(container, state, onTermine) {
  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "onboarding";

  const titre = document.createElement("h2");
  titre.className = "section-titre";
  titre.textContent = "Un rappel pour ton geste du jour ?";

  const consigne = document.createElement("p");
  consigne.className = "onboarding-consigne";
  consigne.textContent =
    "Un seul rappel par jour, avec ton geste du jour dedans — jamais un message générique, et désactivable en deux taps.";

  const boutons = document.createElement("div");
  boutons.className = "onboarding-navigation";

  const refuserBtn = document.createElement("button");
  refuserBtn.type = "button";
  refuserBtn.className = "bouton-secondaire";
  refuserBtn.textContent = "Non merci";

  const accepterBtn = document.createElement("button");
  accepterBtn.type = "button";
  accepterBtn.textContent = "Activer les rappels";

  function terminer(permissionAccordee) {
    onTermine({
      ...state,
      notifications: { permissionDemandee: true, permissionAccordee, actif: permissionAccordee },
    });
  }

  refuserBtn.addEventListener("click", () => terminer(false));
  accepterBtn.addEventListener("click", async () => {
    refuserBtn.disabled = true;
    accepterBtn.disabled = true;
    const permissionAccordee = await demanderPermissionNotifications();
    if (permissionAccordee) {
      const gestes = await chargerCatalogue();
      await programmerRappelQuotidien(
        state.onboarding?.heureRappel || "19:00",
        contenuRappelPourAujourdhui(gestes, state)
      );
    }
    terminer(permissionAccordee);
  });

  boutons.append(refuserBtn, accepterBtn);
  section.append(titre, consigne, boutons);
  container.append(section);
}
