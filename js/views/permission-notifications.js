// Écran de demande d'autorisation des notifications (session 30). Affiché une
// seule fois par utilisateur, jamais au premier lancement : voir
// doitProposerPermission dans js/notifications.js, qui ne le déclenche
// qu'après la toute première validation de geste. Qu'il accepte ou refuse,
// state.notifications.permissionDemandee passe à true dans les deux cas —
// jamais reproposé ensuite (voir CLAUDE.md, un seul essai par utilisateur).
import { demanderPermissionNotifications } from "../notifications.js";

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

  // Empêche une double réponse si "Non merci" est tapé pendant que
  // "Activer les rappels" attend encore le réseau (voir plus bas) : sans ce
  // garde-fou, la réponse tardive de la seconde écraserait l'état déjà
  // persisté par la première avec un instantané périmé.
  let dejaRepondu = false;

  function terminer(permissionAccordee) {
    if (dejaRepondu) return;
    dejaRepondu = true;
    onTermine({
      ...state,
      notifications: { permissionDemandee: true, permissionAccordee },
    });
  }

  // "Non merci" reste toujours cliquable, y compris pendant l'attente de
  // "Activer les rappels" : sans échappatoire, une réponse réseau qui tarde
  // (voir avecDelaiMaximum dans js/notifications.js) laisserait l'utilisateur
  // bloqué sur cet écran sans aucun bouton disponible.
  refuserBtn.addEventListener("click", () => terminer(false));
  accepterBtn.addEventListener("click", async () => {
    accepterBtn.disabled = true;
    accepterBtn.textContent = "Un instant…";
    const permissionAccordee = await demanderPermissionNotifications();
    terminer(permissionAccordee);
  });

  boutons.append(refuserBtn, accepterBtn);
  section.append(titre, consigne, boutons);
  container.append(section);
}
