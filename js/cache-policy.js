// Décide si la réponse à une requête réseau doit rejoindre le cache du
// service worker. Fonction pure, sans dépendance au scope Service Worker :
// testable avec `node --test`, importée aussi par sw.js.
//
// Deux garde-fous, tous deux nécessaires :
// - `response.ok` uniquement (jamais un 404 ou un 500 transitoire, qui
//   resterait sinon en cache jusqu'au prochain renommage de CACHE_NAME) ;
// - même origine que l'app (une ressource tierce comme Eruda, chargée depuis
//   esm.sh ou jsDelivr, n'entre jamais dans le cache de l'app shell).
export function doitMettreEnCache(requestUrl, response, origin) {
  if (!response || !response.ok) return false;
  try {
    return new URL(requestUrl).origin === origin;
  } catch {
    return false;
  }
}
