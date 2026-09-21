// Rappel quotidien local (session 29 — voir CLAUDE.md : « le rappel quotidien
// est le cœur du produit, pas un accessoire »).
//
// La demande de permission et le contenu variable du rappel arrivent en
// sessions 30 et 31 : ce module ne fait que programmer/annuler un rappel
// générique à l'heure choisie (`state.onboarding.heureRappel`), et exposer
// le calcul de sa prochaine échéance.
//
// `@capacitor/local-notifications` est chargé en module ES depuis un CDN
// (deux essais, comme `js/debug.js` pour Eruda) : indisponible dans un
// navigateur de développement classique, il fonctionne une fois l'app
// empaquetée par Capacitor (voir CLAUDE.md, coquille Android). Toute
// fonction de programmation devient alors un no-op silencieux plutôt
// qu'une erreur.
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
