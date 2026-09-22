// Rappel quotidien local (session 29 — voir CLAUDE.md : « le rappel quotidien
// est le cœur du produit, pas un accessoire »).
//
// Le contenu variable du rappel arrive en session 31 : ce module programme/
// annule un rappel générique à l'heure choisie (`state.onboarding.heureRappel`),
// expose le calcul de sa prochaine échéance, et gère la demande d'autorisation
// (session 30 — voir CLAUDE.md : jamais au premier lancement, seulement après
// la première validation de geste, un seul essai par utilisateur).
//
// `@capacitor/local-notifications` est chargé en module ES depuis un CDN
// (deux essais, comme `js/debug.js` pour Eruda) : indisponible dans un
// navigateur de développement classique, il fonctionne une fois l'app
// empaquetée par Capacitor (voir CLAUDE.md, coquille Android). Toute
// fonction de programmation devient alors un no-op silencieux plutôt
// qu'une erreur.
import { totalGestesValides, selectionDuJour } from "./gamification.js";
import { dateDuJour } from "./state.js";
const LOCAL_NOTIFICATIONS_MODULE_URLS = [
  "https://esm.sh/@capacitor/local-notifications@8",
  "https://cdn.jsdelivr.net/npm/@capacitor/local-notifications@8/+esm",
];

// Identifiant fixe : reprogrammer le rappel (changement d'heure) écrase
// toujours la même notification plutôt que d'en empiler une nouvelle.
const ID_RAPPEL_QUOTIDIEN = 1;

export const CONTENU_RAPPEL_PAR_DEFAUT = {
  title: "EcoQuest",
  body: "Ton geste du jour t'attend 🌱",
};

// "HH:MM" -> { heure, minute }. Ne valide pas le format : la seule source de
// heureRappel est un <input type="time">, garanti bien formé (js/state.js).
export function parserHeure(heureRappel) {
  const [heure, minute] = heureRappel.split(":").map(Number);
  return { heure, minute };
}

// Calcule le prochain instant où le rappel doit sonner, à partir d'une heure
// "HH:MM" et de l'instant présent : aujourd'hui si l'heure n'est pas encore
// passée, demain sinon. Fonction pure (aucun accès à Capacitor ni au DOM),
// utilisée aussi bien pour la programmation réelle que pour l'affichage
// (« prochain rappel : … ») et les tests.
export function calculerProchaineEcheance(heureRappel, maintenant = new Date()) {
  const { heure, minute } = parserHeure(heureRappel);
  const echeance = new Date(maintenant);
  echeance.setHours(heure, minute, 0, 0);
  if (echeance.getTime() <= maintenant.getTime()) {
    echeance.setDate(echeance.getDate() + 1);
  }
  return echeance;
}

let pluginCharge = null;

async function chargerPlugin() {
  if (pluginCharge) return pluginCharge;

  for (const url of LOCAL_NOTIFICATIONS_MODULE_URLS) {
    try {
      const module = await import(/* webpackIgnore: true */ url);
      pluginCharge = module.LocalNotifications;
      if (pluginCharge) return pluginCharge;
    } catch {
      // CDN suivant.
    }
  }
  return null;
}

// Annule le rappel quotidien s'il existe. Ne lève jamais d'erreur : rien à
// annuler (première utilisation) ou plugin indisponible (navigateur de
// développement) sont deux issues normales, sans conséquence pour l'appelant.
export async function annulerRappelQuotidien() {
  const LocalNotifications = await chargerPlugin();
  if (!LocalNotifications) return false;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_RAPPEL_QUOTIDIEN }] });
    return true;
  } catch {
    return false;
  }
}

// Programme (ou reprogramme) le rappel quotidien à l'heure choisie. Toujours
// précédée d'une annulation explicite plutôt que d'un simple écrasement par id
// : à la reprogrammation (changement d'heure en Profil, session 32), c'est ce
// qui garantit qu'il ne reste jamais qu'un seul rappel programmé, même si
// l'identifiant venait à varier plus tard (contenu par geste, session 31).
//
// `schedule.on` + `repeats: true` délègue la récurrence quotidienne au
// système (Android reprogramme lui-même l'occurrence suivante après chaque
// déclenchement) plutôt que de reprogrammer un `at` unique à chaque ouverture
// de l'app — plus robuste si l'app reste fermée plusieurs jours.
export async function programmerRappelQuotidien(heureRappel, contenu = CONTENU_RAPPEL_PAR_DEFAUT) {
  const LocalNotifications = await chargerPlugin();
  if (!LocalNotifications) return false;

  await annulerRappelQuotidien();

  const { heure, minute } = parserHeure(heureRappel);
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_RAPPEL_QUOTIDIEN,
          title: contenu.title || CONTENU_RAPPEL_PAR_DEFAUT.title,
          body: contenu.body || CONTENU_RAPPEL_PAR_DEFAUT.body,
          schedule: { on: { hour: heure, minute }, repeats: true },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

// --- Demande d'autorisation (session 30) ---
//
// Fonction pure (aucun accès à Capacitor ni au DOM) qui décide si l'écran de
// demande doit apparaître : jamais au premier lancement (il faut au moins un
// geste validé, toutes dates confondues), et jamais une deuxième fois — que
// l'utilisateur ait accepté ou refusé la première fois.
export function doitProposerPermission(state) {
  if (state.notifications?.permissionDemandee) return false;
  return totalGestesValides(state) >= 1;
}

// Demande l'autorisation au système d'exploitation. Plugin indisponible
// (navigateur de développement) : traité comme un refus plutôt qu'une
// erreur, cohérent avec le reste du module.
export async function demanderPermissionNotifications() {
  const LocalNotifications = await chargerPlugin();
  if (!LocalNotifications) return false;

  try {
    const resultat = await LocalNotifications.requestPermissions();
    return resultat?.display === "granted";
  } catch {
    return false;
  }
}

// --- Contenu variable du rappel (session 31) ---
//
// CONTENU_RAPPEL_PAR_DEFAUT ci-dessus ne sert plus que de repli technique
// (plugin indisponible avant tout chargement des gestes). Le rappel
// réellement programmé (branchement en session 32) doit toujours citer le
// geste du jour et son bénéfice concret — jamais un texte générique (voir
// CLAUDE.md, économie de la permission notification). Les 10 variantes
// ci-dessous ne changent que la formulation : le fond (quel geste, quel
// chiffre) reste le même pour un jour donné, `geste.co2_evite_g` étant la
// même donnée déjà affichée sur l'écran Aujourd'hui.
const VARIANTES_CONTENU_RAPPEL = [
  (g) => ({
    title: "Ton geste du jour",
    body: `${g.libelle} : environ ${g.co2_evite_g} g de CO2 évités (estimation).`,
  }),
  (g) => ({
    title: "🌱 3 minutes pour la planète",
    body: `${g.libelle}. Ça évite environ ${g.co2_evite_g} g de CO2 (estimation).`,
  }),
  (g) => ({
    title: "Petit geste, vrai effet",
    body: `${g.libelle} → ≈ ${g.co2_evite_g} g de CO2 en moins (estimation).`,
  }),
  (g) => ({
    title: "EcoQuest",
    body: `Un geste simple t'attend : ${g.libelle}. Environ ${g.co2_evite_g} g de CO2 évités (estimation).`,
  }),
  (g) => ({
    title: "Ça compte aujourd'hui",
    body: `${g.libelle}, et ${g.co2_evite_g} g de CO2 évités en prime (estimation).`,
  }),
  (g) => ({
    title: "Prêt pour ton geste ?",
    body: `${g.libelle} — ≈ ${g.co2_evite_g} g de CO2 évités si tu t'y mets (estimation).`,
  }),
  (g) => ({
    title: "Un vrai chiffre",
    body: `${g.libelle} : ça évite environ ${g.co2_evite_g} g de CO2 (estimation), pas juste une bonne intention.`,
  }),
  (g) => ({
    title: "Effet immédiat",
    body: `À la clé aujourd'hui : ${g.libelle}, ≈ ${g.co2_evite_g} g de CO2 évités (estimation).`,
  }),
  (g) => ({
    title: "🌍 Ça t'attend",
    body: `${g.libelle}. Un chiffre concret : environ ${g.co2_evite_g} g de CO2 évités (estimation).`,
  }),
  (g) => ({
    title: "On y va ?",
    body: `${g.libelle} — environ ${g.co2_evite_g} g de CO2 en moins rien qu'avec ce geste (estimation).`,
  }),
];

// Tire une des 10 variantes au sort pour le geste donné. `alea` injectable
// (comme `maintenant` pour calculerProchaineEcheance ci-dessus) : Math.random
// par défaut, une fonction déterministe dans les tests.
export function genererContenuRappel(geste, alea = Math.random) {
  const index = Math.floor(alea() * VARIANTES_CONTENU_RAPPEL.length);
  return VARIANTES_CONTENU_RAPPEL[index](geste);
}

// Le geste à citer dans le rappel du jour : le premier des 3 gestes du jour
// (même sélection déterministe que l'écran Aujourd'hui, `selectionDuJour`),
// pour ne jamais citer un geste différent de ceux que l'utilisateur voit en
// ouvrant l'app.
export function gesteDuRappel(gestes, dateISO, categoriesPrioritaires = []) {
  const [geste] = selectionDuJour(gestes, dateISO, categoriesPrioritaires);
  return geste;
}

// --- Réglages du rappel depuis l'écran Profil (session 32) ---
//
// Le réglage ne peut être activé que si l'autorisation système a déjà été
// accordée une fois : l'écran de demande (session 30) ne redemande jamais —
// un seul essai par utilisateur (voir CLAUDE.md). Fonction pure, testable
// sans DOM ni Capacitor.
export function peutActiverRappel(state) {
  return state.notifications?.permissionAccordee === true;
}

// Compose le contenu du rappel pour aujourd'hui à partir d'un catalogue déjà
// chargé par la vue appelante (écran de permission, Profil) : même geste que
// celui affiché sur l'écran Aujourd'hui pour les mêmes catégories
// prioritaires (voir gesteDuRappel ci-dessus). Repli sur
// CONTENU_RAPPEL_PAR_DEFAUT si le catalogue n'est pas (encore) disponible,
// plutôt que d'empêcher la programmation du rappel.
export function contenuRappelPourAujourdhui(gestes, state, alea = Math.random) {
  if (!gestes || gestes.length === 0) return CONTENU_RAPPEL_PAR_DEFAUT;
  const geste = gesteDuRappel(gestes, dateDuJour(), state.onboarding?.categoriesPrioritaires || []);
  return geste ? genererContenuRappel(geste, alea) : CONTENU_RAPPEL_PAR_DEFAUT;
}
