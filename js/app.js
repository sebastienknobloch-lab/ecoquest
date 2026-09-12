const statusEl = document.querySelector("[data-status]");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => setStatus(isInstalled() ? "Application installée ✅" : "Prête, installe-moi sur ton téléphone 📲"))
      .catch(() => setStatus("Prête (hors-ligne indisponible)"));
  });
} else {
  setStatus(isInstalled() ? "Application installée ✅" : "Prête");
}
