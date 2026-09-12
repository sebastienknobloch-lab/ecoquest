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

export function cocherGeste(state, geste, dateISO) {
  const cochesDuJour = state.gestesCochesParDate[dateISO] || [];
  if (cochesDuJour.includes(geste.id)) {
    return state;
  }
  return {
    ...state,
    points: state.points + geste.points,
    gestesCochesParDate: {
      ...state.gestesCochesParDate,
      [dateISO]: [...cochesDuJour, geste.id],
    },
  };
}

export function decocherGeste(state, geste, dateISO) {
  const cochesDuJour = state.gestesCochesParDate[dateISO] || [];
  if (!cochesDuJour.includes(geste.id)) {
    return state;
  }
  return {
    ...state,
    points: state.points - geste.points,
    gestesCochesParDate: {
      ...state.gestesCochesParDate,
      [dateISO]: cochesDuJour.filter((id) => id !== geste.id),
    },
  };
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
