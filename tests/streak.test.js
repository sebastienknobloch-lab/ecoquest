import assert from "node:assert/strict";
import {
  cocherGeste,
  decocherGeste,
  jourPrecedent,
  semaineISO,
  STREAK_PAR_DEFAUT,
  JOKER_PAR_DEFAUT,
} from "../js/gamification.js";

const GESTE = { id: "geste-test", points: 10 };
const AUTRE_GESTE = { id: "autre-geste-test", points: 20 };

function etatVide() {
  return {
    points: 0,
    gestesCochesParDate: {},
    streak: { ...STREAK_PAR_DEFAUT },
    joker: { ...JOKER_PAR_DEFAUT },
  };
}

// jourPrecedent gère correctement les changements de mois
{
  assert.equal(jourPrecedent("2026-03-01"), "2026-02-28");
  assert.equal(jourPrecedent("2026-01-01"), "2025-12-31");
}

// Valider un geste un jour donné démarre le streak à 1
{
  const etat = cocherGeste(etatVide(), GESTE, "2026-09-10");
  assert.equal(etat.streak.actuel, 1);
  assert.equal(etat.streak.dernierJourValide, "2026-09-10");
}

// Valider un second geste le même jour ne fait pas avancer le streak une deuxième fois
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, AUTRE_GESTE, "2026-09-10");
  assert.equal(etat.streak.actuel, 1);
  assert.equal(etat.streak.dernierJourValide, "2026-09-10");
}

// Valider un geste le jour suivant un jour déjà validé incrémente le streak
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  etat = cocherGeste(etat, GESTE, "2026-09-12");
  assert.equal(etat.streak.actuel, 3);
  assert.equal(etat.streak.dernierJourValide, "2026-09-12");
}

// Sauter un jour sans geste validé casse le streak si le joker n'est pas disponible
{
  let etat = etatVide();
  etat.joker = { disponible: 0, semaine: semaineISO("2026-09-10") };
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  // 2026-09-12 : rien de validé, pas de joker disponible cette semaine
  etat = cocherGeste(etat, GESTE, "2026-09-13");
  assert.equal(etat.streak.actuel, 1, "le streak doit repartir de 1 après un jour manqué sans joker");
  assert.equal(etat.streak.dernierJourValide, "2026-09-13");
}

// Sauter plus d'un jour casse le streak même si un joker est disponible
// (le joker ne comble qu'un seul jour manqué)
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-01");
  // 2026-09-02 et 2026-09-03 : deux jours manqués d'affilée
  etat = cocherGeste(etat, GESTE, "2026-09-04");
  assert.equal(etat.streak.actuel, 1, "deux jours manqués d'affilée cassent le streak malgré le joker");
  assert.equal(etat.joker.disponible, JOKER_PAR_DEFAUT.disponible, "le joker n'est pas consommé sur un trou de plus d'un jour");
}

// Le joker hebdomadaire permet de sauter un jour manqué sans casser le streak
// (2026-09-10 au 2026-09-13 : jeudi à dimanche, même semaine ISO)
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  // 2026-09-12 : rien de validé, le joker doit combler le trou
  etat = cocherGeste(etat, GESTE, "2026-09-13");
  assert.equal(etat.streak.actuel, 3, "le joker doit préserver le streak malgré le jour manqué");
  assert.equal(etat.streak.dernierJourValide, "2026-09-13");
  assert.equal(etat.streak.dernierJourViaJoker, true);
  assert.equal(etat.joker.disponible, 0, "le joker doit être consommé");
}

// Le joker ne peut être utilisé qu'une fois par semaine : un deuxième jour manqué
// dans la même semaine casse le streak
// (2026-09-14 au 2026-09-19 : lundi à samedi, même semaine ISO)
{
  assert.equal(
    semaineISO("2026-09-16"),
    semaineISO("2026-09-18"),
    "vérification du jeu de dates : les deux jours manqués doivent être dans la même semaine ISO"
  );
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-14");
  etat = cocherGeste(etat, GESTE, "2026-09-15");
  // 2026-09-16 : manqué, comblé par le joker
  etat = cocherGeste(etat, GESTE, "2026-09-17");
  assert.equal(etat.joker.disponible, 0);
  // 2026-09-18 : manqué à nouveau, plus de joker disponible cette semaine
  etat = cocherGeste(etat, GESTE, "2026-09-19");
  assert.equal(etat.streak.actuel, 1, "sans joker restant, un second trou casse le streak");
}

// Le joker se recharge automatiquement à chaque nouvelle semaine ISO
{
  assert.notEqual(
    semaineISO("2026-09-16"),
    semaineISO("2026-09-21"),
    "vérification du jeu de dates : 2026-09-21 doit être dans la semaine ISO suivante"
  );
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-14");
  etat = cocherGeste(etat, GESTE, "2026-09-15");
  etat = cocherGeste(etat, GESTE, "2026-09-17"); // joker consommé pour combler le 16
  assert.equal(etat.joker.disponible, 0);
  // Semaine ISO suivante : le joker doit être de nouveau disponible
  etat = cocherGeste(etat, GESTE, "2026-09-21");
  assert.equal(etat.joker.disponible, 1, "le joker doit se recharger sur une nouvelle semaine ISO");
}

// Décocher le seul geste validé du jour annule la mise à jour du streak pour ce jour
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  etat = decocherGeste(etat, GESTE, "2026-09-11");
  assert.equal(etat.streak.actuel, 1, "décocher le dernier geste du jour doit annuler l'incrément du streak");
  assert.equal(etat.streak.dernierJourValide, "2026-09-10");
}

// Décocher un geste alors qu'un autre geste reste validé le même jour ne touche pas au streak
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, AUTRE_GESTE, "2026-09-10");
  etat = decocherGeste(etat, GESTE, "2026-09-10");
  assert.equal(etat.streak.actuel, 1);
  assert.equal(etat.streak.dernierJourValide, "2026-09-10");
}

// Décocher le geste qui avait comblé un jour manqué grâce au joker restitue le joker
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  etat = cocherGeste(etat, GESTE, "2026-09-13"); // joker consommé pour combler le 12
  assert.equal(etat.joker.disponible, 0);
  etat = decocherGeste(etat, GESTE, "2026-09-13");
  assert.equal(etat.streak.actuel, 2);
  assert.equal(etat.streak.dernierJourValide, "2026-09-11");
  assert.equal(etat.joker.disponible, 1, "le joker consommé doit être restitué");
}

// Décocher un geste un jour qui n'est pas le dernier jour comptabilisé ne modifie pas le streak
{
  let etat = etatVide();
  etat = cocherGeste(etat, GESTE, "2026-09-10");
  etat = cocherGeste(etat, AUTRE_GESTE, "2026-09-10");
  etat = cocherGeste(etat, GESTE, "2026-09-11");
  etat = decocherGeste(etat, GESTE, "2026-09-10");
  etat = decocherGeste(etat, AUTRE_GESTE, "2026-09-10");
  assert.equal(etat.streak.actuel, 2, "le streak déjà comptabilisé pour un jour ultérieur reste acquis");
  assert.equal(etat.streak.dernierJourValide, "2026-09-11");
}

console.log("✅ tests streak/joker : OK");
