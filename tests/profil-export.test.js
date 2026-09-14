import assert from "node:assert/strict";
import { nomFichierExportEtat } from "../js/views/profil.js";

// nomFichierExportEtat : nom de fichier stable, dérivé de la date fournie, sans
// caractères invalides pour un nom de fichier (les ":" et "." de l'ISO sont
// remplacés par "-") — même logique que nomFichierExport (js/views/debug.js).
{
  const date = new Date("2026-09-14T08:30:00.123Z");
  const nom = nomFichierExportEtat(date);
  assert.equal(nom, "ecoquest-sauvegarde-2026-09-14T08-30-00-123Z.json");
  assert.doesNotMatch(nom.replace(/\.json$/, ""), /[:.]/);
}

console.log("✅ tests profil-export (nom de fichier de sauvegarde) : OK");
