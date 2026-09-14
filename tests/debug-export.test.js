import assert from "node:assert/strict";
import { nomFichierExport } from "../js/views/debug.js";

// nomFichierExport : nom de fichier stable, dérivé de la date fournie, sans
// caractères invalides pour un nom de fichier (les ":" et "." de l'ISO sont
// remplacés par "-")
{
  const date = new Date("2026-09-14T08:30:00.123Z");
  const nom = nomFichierExport(date);
  assert.equal(nom, "ecoquest-erreurs-2026-09-14T08-30-00-123Z.json");
  // Aucun ":" ni "." avant l'extension (seuls caractères interdits sur certains OS)
  assert.doesNotMatch(nom.replace(/\.json$/, ""), /[:.]/);
}

console.log("✅ tests debug-export (nom de fichier d'export des erreurs) : OK");
