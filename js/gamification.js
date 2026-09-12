export const POINTS_PAR_DIFFICULTE = { 1: 10, 2: 20, 3: 30 };

export function pointsPourDifficulte(difficulte) {
  return POINTS_PAR_DIFFICULTE[difficulte];
}

export function cocherGeste(state, geste) {
  if (state.completedToday.includes(geste.id)) {
    return state;
  }
  return {
    ...state,
    points: state.points + geste.points,
    completedToday: [...state.completedToday, geste.id],
  };
}

export function decocherGeste(state, geste) {
  if (!state.completedToday.includes(geste.id)) {
    return state;
  }
  return {
    ...state,
    points: state.points - geste.points,
    completedToday: state.completedToday.filter((id) => id !== geste.id),
  };
}
