import assert from "node:assert/strict";
import { partagerOuTelecharger } from "../js/telechargement.js";

// Faux document minimal : compte les clics sur le lien <a download>.
function fauxDocument({ clicEchoue = false } = {}) {
  const doc = { clics: [] };
  doc.body = { append() {} };
  doc.createElement = () => ({
    remove() {},
    click() {
      if (clicEchoue) throw new Error("clic impossible");
      doc.clics.push(this.download);
    },
  });
  return doc;
}

function fauxNavigateur({ peutPartager = true, erreurPartage = null } = {}) {
  const nav = { partages: [] };
  nav.canShare = () => peutPartager;
  nav.share = async (donnees) => {
    if (erreurPartage) throw erreurPartage;
    nav.partages.push(donnees);
  };
  return nav;
}

// Partage de fichier supporté : partage natif, aucun téléchargement.
{
  const nav = fauxNavigateur();
  const doc = fauxDocument();
  const resultat = await partagerOuTelecharger("{}", "a.json", { nav, doc });
  assert.equal(resultat, "partage");
  assert.equal(nav.partages.length, 1);
  assert.equal(nav.partages[0].files[0].name, "a.json");
  assert.deepEqual(doc.clics, []);
}

// Annulation explicite (AbortError) : pas de repli sur le téléchargement.
{
  const erreur = new Error("annulé");
  erreur.name = "AbortError";
  const doc = fauxDocument();
  const resultat = await partagerOuTelecharger("{}", "a.json", { nav: fauxNavigateur({ erreurPartage: erreur }), doc });
  assert.equal(resultat, "annule");
  assert.deepEqual(doc.clics, []);
}

// Autre échec du partage : repli sur <a download>.
{
  const doc = fauxDocument();
  const resultat = await partagerOuTelecharger("{}", "a.json", {
    nav: fauxNavigateur({ erreurPartage: new Error("NotAllowedError") }),
    doc,
  });
  assert.equal(resultat, "telecharge");
  assert.deepEqual(doc.clics, ["a.json"]);
}

// Partage de fichier non supporté (canShare faux, ou pas d'API) : téléchargement.
{
  const doc = fauxDocument();
  assert.equal(await partagerOuTelecharger("{}", "a.json", { nav: fauxNavigateur({ peutPartager: false }), doc }), "telecharge");
  assert.equal(await partagerOuTelecharger("{}", "b.json", { nav: {}, doc }), "telecharge");
  assert.deepEqual(doc.clics, ["a.json", "b.json"]);
}

// Tout échoue : "echec", pour que l'écran affiche un message visible.
{
  const resultat = await partagerOuTelecharger("{}", "a.json", { nav: {}, doc: fauxDocument({ clicEchoue: true }) });
  assert.equal(resultat, "echec");
}

console.log("✅ tests telechargement (partage puis repli téléchargement) : OK");
