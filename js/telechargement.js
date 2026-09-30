// Export d'un fichier texte depuis l'app, partagé par Profil (sauvegarde) et
// l'écran de debug (erreurs).
//
// Sur Android, en PWA installée (mode standalone), le WebView n'ouvre pas
// toujours le gestionnaire de téléchargements pour un lien <a download> vers
// une blob: URL — le clic ne fait alors rien de visible. Le partage natif
// (feuille de partage du système) fonctionne dans ce contexte-là, donc on le
// tente en priorité ; le téléchargement classique reste utilisé quand le
// partage de fichier n'est pas supporté (desktop, anciens navigateurs).
//
// Renvoie "partage", "annule", "telecharge" ou "echec" : l'appelant affiche
// lui-même le message d'erreur, chaque écran ayant sa propre zone de message.
// `nav` et `doc` sont injectables pour rester testable avec `node --test`.
export async function partagerOuTelecharger(
  texte,
  nomFichier,
  { type = "application/json", nav = globalThis.navigator, doc = globalThis.document } = {}
) {
  if (nav && nav.share && nav.canShare) {
    try {
      const fichier = new File([texte], nomFichier, { type });
      if (nav.canShare({ files: [fichier] })) {
        await nav.share({ files: [fichier], title: nomFichier });
        return "partage";
      }
    } catch (erreur) {
      // Partage annulé par l'utilisateur : on n'enchaîne pas sur un
      // téléchargement, ce serait surprenant après une annulation explicite.
      if (erreur && erreur.name === "AbortError") return "annule";
    }
  }

  try {
    const blob = new Blob([texte], { type });
    const url = URL.createObjectURL(blob);
    const lien = doc.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    doc.body.append(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
    return "telecharge";
  } catch {
    return "echec";
  }
}
