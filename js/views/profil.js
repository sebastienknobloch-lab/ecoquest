export function renderProfil(container) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "view-placeholder";
  section.innerHTML = `
    <h2>🙂 Profil</h2>
    <p>Bientôt : tes badges et ta progression !</p>
  `;
  container.append(section);
}
