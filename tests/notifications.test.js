import assert from "node:assert/strict";
import { parserHeure, calculerProchaineEcheance } from "../js/notifications.js";

// parserHeure : découpe "HH:MM" en heure/minute numériques
{
  assert.deepEqual(parserHeure("19:00"), { heure: 19, minute: 0 });
  assert.deepEqual(parserHeure("07:05"), { heure: 7, minute: 5 });
}

// calculerProchaineEcheance : heure du jour pas encore passée -> aujourd'hui
{
  const maintenant = new Date(2026, 8, 20, 10, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getFullYear(), 2026);
  assert.equal(echeance.getMonth(), 8);
  assert.equal(echeance.getDate(), 20);
  assert.equal(echeance.getHours(), 19);
  assert.equal(echeance.getMinutes(), 0);
}

// calculerProchaineEcheance : heure du jour déjà passée -> demain
{
  const maintenant = new Date(2026, 8, 20, 20, 30, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getDate(), 21);
  assert.equal(echeance.getHours(), 19);
  assert.equal(echeance.getMinutes(), 0);
}

// calculerProchaineEcheance : pile à l'heure -> considérée comme passée, reportée à demain
{
  const maintenant = new Date(2026, 8, 20, 19, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getDate(), 21);
}

// calculerProchaineEcheance : gère le changement de mois
{
  const maintenant = new Date(2026, 8, 30, 20, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getMonth(), 9);
  assert.equal(echeance.getDate(), 1);
}

// calculerProchaineEcheance : gère le changement d'année
{
  const maintenant = new Date(2026, 11, 31, 20, 0, 0);
  const echeance = calculerProchaineEcheance("19:00", maintenant);
  assert.equal(echeance.getFullYear(), 2027);
  assert.equal(echeance.getMonth(), 0);
  assert.equal(echeance.getDate(), 1);
}

// calculerProchaineEcheance : une reprogrammation à une heure plus tôt dans la
// journée (changement d'heure côté utilisateur) recalcule bien depuis l'heure
// actuelle, pas depuis une échéance précédemment programmée
{
  const maintenant = new Date(2026, 8, 20, 18, 0, 0);
  const echeanceAvant = calculerProchaineEcheance("19:00", maintenant);
  const echeanceApres = calculerProchaineEcheance("08:00", maintenant);
  assert.equal(echeanceAvant.getDate(), 20);
  assert.equal(echeanceApres.getDate(), 21);
  assert.equal(echeanceApres.getHours(), 8);
}

console.log("✅ tests notifications : OK");
