export function renderFoyer(container) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "view-placeholder";
  section.innerHTML = `
    <h2>🏠 Foyer</h2>
    <p>Bientôt : l'impact de toute la famille réuni ici !</p>
  `;
  container.append(section);
}
