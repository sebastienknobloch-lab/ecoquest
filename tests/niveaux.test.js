import assert from "node:assert/strict";
import { calculerNiveau, SEUILS_NIVEAUX } from "../js/gamification.js";

// Il y a bien 5 niveaux, avec des seuils strictement croissants
{
  assert.equal(SEUILS_NIVEAUX.length, 5);
  for (let i = 1; i < SEUILS_NIVEAUX.length; i++) {
    assert.ok(SEUILS_NIVEAUX[i] > SEUILS_NIVEAUX[i - 1], "les seuils doivent être strictement croissants");
  }
}

// Chaque seuil fait passer exactement au niveau correspondant (seuil = niveau + 1)
{
  SEUILS_NIVEAUX.forEach((seuil, index) => {
    assert.equal(
      calculerNiveau(seuil).niveau,
      index + 1,
      `${seuil} points devrait donner le niveau ${index + 1}`
    );
  });
}

// Un point avant un seuil reste au niveau précédent (pas d'arrondi en trop)
{
  for (let i = 1; i < SEUILS_NIVEAUX.length; i++) {
    assert.equal(
      calculerNiveau(SEUILS_NIVEAUX[i] - 1).niveau,
      i,
      `${SEUILS_NIVEAUX[i] - 1} points devrait rester au niveau ${i}`
    );
  }
}

// 0 point → niveau 1
{
  assert.equal(calculerNiveau(0).niveau, 1);
}

// pointsRestants indique l'écart exact avec le prochain seuil
{
  assert.equal(calculerNiveau(0).pointsRestants, 50);
  assert.equal(calculerNiveau(20).pointsRestants, 30);
  assert.equal(calculerNiveau(150).pointsRestants, 150); // niveau 3, prochain seuil 300
}

// pourcentage de progression dans le niveau courant (entre le seuil actuel et le suivant)
{
  assert.equal(calculerNiveau(0).pourcentage, 0);
  assert.equal(calculerNiveau(25).pourcentage, 50); // 25 = milieu entre 0 et 50
  assert.equal(calculerNiveau(49).pourcentage, 98);
  assert.equal(calculerNiveau(150).pourcentage, 0); // tout juste niveau 3
  assert.equal(calculerNiveau(225).pourcentage, 50); // milieu entre 150 et 300
}

// Niveau maximum (5) : plus de points restants, barre pleine, pas d'erreur au-delà du dernier seuil
{
  const dernierNiveau = SEUILS_NIVEAUX.length;
  assert.equal(calculerNiveau(500).niveau, dernierNiveau);
  assert.equal(calculerNiveau(500).estNiveauMax, true);
  assert.equal(calculerNiveau(500).pointsRestants, 0);
  assert.equal(calculerNiveau(500).pourcentage, 100);
  assert.equal(calculerNiveau(500).seuilSuivant, null);

  assert.equal(calculerNiveau(10000).niveau, dernierNiveau);
  assert.equal(calculerNiveau(10000).pointsRestants, 0);
  assert.equal(calculerNiveau(10000).pourcentage, 100);
}

// Robustesse : un total de points négatif (ne devrait pas arriver en pratique) ne casse rien
{
  assert.equal(calculerNiveau(-10).niveau, 1);
  assert.equal(calculerNiveau(-10).pourcentage, 0);
}

console.log("✅ tests niveaux : OK");
