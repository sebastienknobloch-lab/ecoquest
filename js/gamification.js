export const POINTS_PAR_GESTE = 10;

export function cocherGeste(state, gesteId) {
  if (state.completedToday.includes(gesteId)) {
    return state;
  }
  return {
    ...state,
    points: state.points + POINTS_PAR_GESTE,
    completedToday: [...state.completedToday, gesteId],
  };
}

export function decocherGeste(state, gesteId) {
  if (!state.completedToday.includes(gesteId)) {
    return state;
  }
  return {
    ...state,
    points: state.points - POINTS_PAR_GESTE,
    completedToday: state.completedToday.filter((id) => id !== gesteId),
  };
}
