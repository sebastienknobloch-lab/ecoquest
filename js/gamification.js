export const POINTS_PAR_DIFFICULTE = { 1: 10, 2: 20, 3: 30 };

export function pointsPourDifficulte(difficulte) {
  return POINTS_PAR_DIFFICULTE[difficulte];
}

// Seuils de points pour atteindre chaque niveau (index 0 → niveau 1, etc).
// Le niveau n'est jamais stocké dans l'état : toujours recalculé à partir de
// state.points, pour éviter tout double comptage entre points et niveau.
export const SEUILS_NIVEAUX = [0, 50, 150, 300, 500];

// Calcule le niveau actuel (1 à SEUILS_NIVEAUX.length) à partir du total de points,
// ainsi que les points restants et le pourcentage de progression avant le niveau suivant.
export function calculerNiveau(points) {
  let niveau = 1;
  for (let i = SEUILS_NIVEAUX.length - 1; i >= 0; i--) {
    if (points >= SEUILS_NIVEAUX[i]) {
      niveau = i + 1;
      break;
    }
  }

  const seuilActuel = SEUILS_NIVEAUX[niveau - 1];
  const estNiveauMax = niveau >= SEUILS_NIVEAUX.length;
  const seuilSuivant = estNiveauMax ? null : SEUILS_NIVEAUX[niveau];
  const pointsRestants = estNiveauMax ? 0 : Math.max(0, seuilSuivant - points);
  const pourcentage = estNiveauMax
    ? 100
    : Math.max(0, Math.min(100, Math.round(((points - seuilActuel) / (seuilSuivant - seuilActuel)) * 100)));

  return { niveau, seuilActuel, seuilSuivant, pointsRestants, pourcentage, estNiveauMax };
}

// --- Streak (jours consécutifs) + joker hebdomadaire ---
//
// state.streak = { actuel, dernierJourValide, dernierJourViaJoker }
// state.joker  = { disponible, semaine }
// Le streak n'est jamais recalculé depuis l'historique complet : il avance ou
// se réinitialise uniquement au moment où le premier geste d'un jour est
// validé (ou annulé), comme les points. Le joker se recharge à chaque
// nouvelle semaine ISO rencontrée.

export const JOKERS_PAR_SEMAINE = 1;

export const STREAK_PAR_DEFAUT = { actuel: 0, dernierJourValide: null, dernierJourViaJoker: false };
export const JOKER_PAR_DEFAUT = { disponible: JOKERS_PAR_SEMAINE, semaine: null };

export function jourPrecedent(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${jj}`;
}

// Identifiant de semaine ISO (AAAA-Www), utilisé pour savoir quand recharger le joker.
export function semaineISO(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`);
  const jourSemaine = (d.getDay() + 6) % 7; // lundi = 0 ... dimanche = 6
  d.setDate(d.getDate() - jourSemaine + 3); // jeudi de la semaine ISO courante
  const anneeISO = d.getFullYear();
  const premierJanvier = new Date(anneeISO, 0, 1);
  const numeroSemaine = Math.ceil(((d - premierJanvier) / 86400000 + 1) / 7);
  return `${anneeISO}-W${String(numeroSemaine).padStart(2, "0")}`;
}

function rechargerJokerSiNouvelleSemaine(joker, dateISO) {
  const semaineActuelle = semaineISO(dateISO);
  if (joker.semaine === semaineActuelle) return joker;
  return { disponible: JOKERS_PAR_SEMAINE, semaine: semaineActuelle };
}

// Appelée quand le premier geste d'un jour donné vient d'être validé.
function validerJourPourStreak(streak, joker, dateISO) {
  const jokerRecharge = rechargerJokerSiNouvelleSemaine(joker, dateISO);
  const veille = jourPrecedent(dateISO);
  const avantVeille = jourPrecedent(veille);

  if (streak.dernierJourValide === veille) {
    return {
      streak: { actuel: streak.actuel + 1, dernierJourValide: dateISO, dernierJourViaJoker: false },
      joker: jokerRecharge,
    };
  }

  if (streak.dernierJourValide === avantVeille && jokerRecharge.disponible > 0) {
    return {
      streak: { actuel: streak.actuel + 1, dernierJourValide: dateISO, dernierJourViaJoker: true },
      joker: { ...jokerRecharge, disponible: jokerRecharge.disponible - 1 },
    };
  }

  return {
    streak: { actuel: 1, dernierJourValide: dateISO, dernierJourViaJoker: false },
    joker: jokerRecharge,
  };
}

// Appelée quand le dernier geste d'un jour donné vient d'être décoché (jour repassé à 0 geste).
// Annule la mise à jour faite par validerJourPourStreak pour ce même jour, pour ne pas
// laisser un streak "fantôme" si l'utilisateur décoche par erreur.
function annulerJourPourStreak(streak, joker, dateISO) {
  if (streak.dernierJourValide !== dateISO) {
    // Le jour annulé ne correspond pas au dernier jour comptabilisé : rien à défaire.
    return { streak, joker };
  }

  const jokerRestitue = streak.dernierJourViaJoker
    ? { ...joker, disponible: joker.disponible + 1 }
    : joker;

  const jourPrecedentDuStreak = streak.dernierJourViaJoker
    ? jourPrecedent(jourPrecedent(dateISO))
    : jourPrecedent(dateISO);

  return {
    streak: {
      actuel: streak.actuel - 1,
      dernierJourValide: streak.actuel > 1 ? jourPrecedentDuStreak : null,
      dernierJourViaJoker: false,
    },
    joker: jokerRestitue,
  };
}

export function cocherGeste(state, geste, dateISO) {
  const cochesDuJour = state.gestesCochesParDate[dateISO] || [];
  if (cochesDuJour.includes(geste.id)) {
    return state;
  }

  const etatDeBase = {
    ...state,
    points: state.points + geste.points,
    gestesCochesParDate: {
      ...state.gestesCochesParDate,
      [dateISO]: [...cochesDuJour, geste.id],
    },
  };

  if (cochesDuJour.length > 0) {
    // Pas le premier geste du jour : le streak a déjà été mis à jour aujourd'hui.
    return etatDeBase;
  }

  const streak = state.streak ?? STREAK_PAR_DEFAUT;
  const joker = state.joker ?? JOKER_PAR_DEFAUT;
  const { streak: nouveauStreak, joker: nouveauJoker } = validerJourPourStreak(streak, joker, dateISO);
  return { ...etatDeBase, streak: nouveauStreak, joker: nouveauJoker };
}

export function decocherGeste(state, geste, dateISO) {
  const cochesDuJour = state.gestesCochesParDate[dateISO] || [];
  if (!cochesDuJour.includes(geste.id)) {
    return state;
  }

  const nouvellesCoches = cochesDuJour.filter((id) => id !== geste.id);
  const etatDeBase = {
    ...state,
    points: state.points - geste.points,
    gestesCochesParDate: {
      ...state.gestesCochesParDate,
      [dateISO]: nouvellesCoches,
    },
  };

  if (nouvellesCoches.length > 0) {
    // Il reste au moins un geste validé ce jour-là : le streak du jour reste acquis.
    return etatDeBase;
  }

  const streak = state.streak ?? STREAK_PAR_DEFAUT;
  const joker = state.joker ?? JOKER_PAR_DEFAUT;
  const { streak: nouveauStreak, joker: nouveauJoker } = annulerJourPourStreak(streak, joker, dateISO);
  return { ...etatDeBase, streak: nouveauStreak, joker: nouveauJoker };
}

// PRNG déterministe (mulberry32) : même seed → toujours la même suite de nombres,
// nécessaire pour que la sélection du jour soit stable à chaque rechargement.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash simple d'une chaîne (la date AAAA-MM-JJ) en entier 32 bits, utilisé comme seed.
function hashChaine(chaine) {
  let h = 0;
  for (let i = 0; i < chaine.length; i++) {
    h = (h * 31 + chaine.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Sélectionne 3 gestes du jour dans 3 catégories différentes, de façon déterministe
// pour une date donnée (même date → même sélection, change à minuit).
export function selectionDuJour(gestes, dateISO) {
  const categories = [...new Set(gestes.map((g) => g.categorie))].sort();
  const rand = mulberry32(hashChaine(dateISO));

  const categoriesMelangees = [...categories];
  for (let i = categoriesMelangees.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [categoriesMelangees[i], categoriesMelangees[j]] = [
      categoriesMelangees[j],
      categoriesMelangees[i],
    ];
  }

  return categoriesMelangees.slice(0, 3).map((categorie) => {
    const gestesCategorie = gestes
      .filter((g) => g.categorie === categorie)
      .sort((a, b) => a.id.localeCompare(b.id));
    const index = Math.floor(rand() * gestesCategorie.length);
    return gestesCategorie[index];
  });
}
