import assert from "node:assert/strict";

// Aucun accès à localStorage dans ces fonctions : pas besoin de faux stockage,
// contrairement à tests/state.test.js.
const { exporterEtatJSON, importerEtatJSON, validerEtat } = await import("../js/state.js");

function etatValide() {
  return {
    points: 30,
    gestesCochesParDate: { "2026-01-01": ["geste-a", "geste-b"] },
    activeTab: "profil",
    streak: { actuel: 2, dernierJourValide: "2026-01-01", dernierJourViaJoker: false, jokerUtiliseDansStreak: false },
    joker: { disponible: 1, semaine: "2026-W01", dejaUtilise: false },
    erreurs: [],
    onboarding: { termine: true, prenom: "Alex", categoriesPrioritaires: ["energie", "dechets", "numerique"], heureRappel: "19:00" },
    notifications: { permissionDemandee: true, permissionAccordee: true },
  };
}

// exporterEtatJSON : produit un JSON valide contenant l'état fourni tel quel
{
  const etat = etatValide();
  const json = exporterEtatJSON(etat);
  const payload = JSON.parse(json);
  assert.equal(payload.format, "ecoquest-export");
  assert.equal(payload.version, 1);
  assert.equal(typeof payload.exporteLe, "string");
  assert.deepEqual(payload.etat, etat);
}

// validerEtat : un état complet et bien typé est valide
{
  assert.equal(validerEtat(etatValide()), true);
}

// validerEtat : rejette ce qui n'est pas un objet simple
{
  assert.equal(validerEtat(null), false);
  assert.equal(validerEtat([1, 2, 3]), false);
  assert.equal(validerEtat("pas un état"), false);
  assert.equal(validerEtat(42), false);
}

// validerEtat : rejette des points invalides (manquants, négatifs, mauvais type)
{
  const { points, ...sansPoints } = etatValide();
  assert.equal(validerEtat(sansPoints), false);
  assert.equal(validerEtat({ ...etatValide(), points: -5 }), false);
  assert.equal(validerEtat({ ...etatValide(), points: "30" }), false);
}

// validerEtat : rejette un gestesCochesParDate mal formé (clé non-date, valeur non-tableau de chaînes)
{
  assert.equal(validerEtat({ ...etatValide(), gestesCochesParDate: { "pas-une-date": ["geste-a"] } }), false);
  assert.equal(validerEtat({ ...etatValide(), gestesCochesParDate: { "2026-01-01": "geste-a" } }), false);
  assert.equal(validerEtat({ ...etatValide(), gestesCochesParDate: { "2026-01-01": [1, 2] } }), false);
}

// validerEtat : rejette un streak ou un joker incomplet
{
  assert.equal(validerEtat({ ...etatValide(), streak: { actuel: 2 } }), false);
  assert.equal(validerEtat({ ...etatValide(), joker: { disponible: 1 } }), false);
}

// validerEtat : rejette des erreurs qui ne sont pas un tableau, mais accepte leur absence
{
  assert.equal(validerEtat({ ...etatValide(), erreurs: "oups" }), false);
  const { erreurs, ...sansErreurs } = etatValide();
  assert.equal(validerEtat(sansErreurs), true);
}

// validerEtat : rejette un onboarding mal formé, mais accepte son absence
// (exports faits avant l'ajout de l'onboarding, session 18)
{
  assert.equal(validerEtat({ ...etatValide(), onboarding: { termine: true } }), false);
  assert.equal(
    validerEtat({ ...etatValide(), onboarding: { ...etatValide().onboarding, categoriesPrioritaires: "energie" } }),
    false
  );
  const { onboarding, ...sansOnboarding } = etatValide();
  assert.equal(validerEtat(sansOnboarding), true);
}

// validerEtat : rejette des notifications mal formées, mais accepte leur
// absence (exports faits avant l'ajout de l'écran de demande, session 30)
{
  assert.equal(validerEtat({ ...etatValide(), notifications: { permissionDemandee: "oui" } }), false);
  assert.equal(
    validerEtat({ ...etatValide(), notifications: { permissionDemandee: true, permissionAccordee: "oui" } }),
    false
  );
  const { notifications, ...sansNotifications } = etatValide();
  assert.equal(validerEtat(sansNotifications), true);
}

// importerEtatJSON : JSON syntaxiquement invalide → rejeté avec un message, sans exception
{
  const resultat = importerEtatJSON("{ceci n'est pas du json");
  assert.equal(resultat.valide, false);
  assert.equal(typeof resultat.erreur, "string");
  assert.equal(resultat.etat, undefined);
}

// importerEtatJSON : JSON valide mais structure inattendue (tableau, état incomplet) → rejeté
{
  assert.equal(importerEtatJSON("[1,2,3]").valide, false);
  assert.equal(importerEtatJSON(JSON.stringify({ foo: "bar" })).valide, false);
  assert.equal(importerEtatJSON(JSON.stringify({ points: -1 })).valide, false);
}

// importerEtatJSON : accepte l'enveloppe d'export produite par exporterEtatJSON (aller-retour)
{
  const etat = etatValide();
  const resultat = importerEtatJSON(exporterEtatJSON(etat));
  assert.equal(resultat.valide, true);
  assert.equal(resultat.etat.points, etat.points);
  assert.deepEqual(resultat.etat.gestesCochesParDate, etat.gestesCochesParDate);
  assert.deepEqual(resultat.etat.streak, etat.streak);
  assert.deepEqual(resultat.etat.joker, etat.joker);
  assert.deepEqual(resultat.etat.onboarding, etat.onboarding);
  assert.deepEqual(resultat.etat.notifications, etat.notifications);
}

// importerEtatJSON : accepte aussi un état brut, sans enveloppe
{
  const etat = etatValide();
  const resultat = importerEtatJSON(JSON.stringify(etat));
  assert.equal(resultat.valide, true);
  assert.equal(resultat.etat.points, etat.points);
}

// importerEtatJSON : migration douce — une sauvegarde sans `onboarding` mais
// avec des points (export fait entre les sessions 14 et 18) est reconnue
// comme un utilisateur déjà en cours d'usage : l'onboarding ne doit pas se
// ré-afficher à l'import.
{
  const { onboarding, ...sansOnboarding } = etatValide();
  const resultat = importerEtatJSON(JSON.stringify({ ...sansOnboarding, points: 30 }));
  assert.equal(resultat.valide, true);
  assert.equal(resultat.etat.onboarding.termine, true);
}

// importerEtatJSON : la même sauvegarde sans `onboarding` mais sans point
// n'a pas forcément passé l'onboarding : il doit rester à faire.
{
  const { onboarding, ...sansOnboarding } = etatValide();
  const resultat = importerEtatJSON(JSON.stringify({ ...sansOnboarding, points: 0 }));
  assert.equal(resultat.valide, true);
  assert.equal(resultat.etat.onboarding.termine, false);
}

// importerEtatJSON : migration douce — une sauvegarde sans `notifications`
// (export fait avant la session 30) reçoit les valeurs par défaut, jamais demandée
{
  const { notifications, ...sansNotifications } = etatValide();
  const resultat = importerEtatJSON(JSON.stringify(sansNotifications));
  assert.equal(resultat.valide, true);
  assert.equal(resultat.etat.notifications.permissionDemandee, false);
  assert.equal(resultat.etat.notifications.permissionAccordee, null);
}

console.log("✅ tests state export/import (sauvegarde manuelle) : OK");
