export function renderDefis(container) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "view-placeholder";
  section.innerHTML = `
    <h2>🏆 Défis</h2>
    <p>Bientôt : des défis à relever en famille !</p>
  `;
  container.append(section);
}
