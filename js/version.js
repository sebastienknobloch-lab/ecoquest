// Numéro de version affiché sur l'écran Profil (footer) et servant de point
// d'entrée pour l'activation de la console de debug (5 taps dessus).
//
// Doit être mis à jour dans le même commit que le tag Git qui déclenche
// android.yml (tag "v" + cette valeur, ex. tag v0.1.7 → APP_VERSION "0.1.7").
// .github/workflows/android.yml fait échouer le build si les deux divergent :
// voir l'étape "Vérifier que APP_VERSION correspond au tag".
export const APP_VERSION = "0.1.8";
