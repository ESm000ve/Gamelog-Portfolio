"use strict";
const boards = [
  ["00-cover", "Start here", "Overview", "Scope, Light and Dark appearance, and where to find the rest of the macOS system.", "2-2"],
  ["01-foundations", "Foundations", "Foundations", "Semantic Light/Dark color roles, SF Pro type styles, spacing, radii and elevation.", "2-23"],
  ["02-actions", "Actions & button states", "Components", "Primary, Secondary, Outline, Ghost and Danger buttons across sizes and interaction states.", "2-87"],
  ["03-inputs", "Inputs & selection", "Components", "Search states and the persistent grid/table selection control.", "2-448"],
  ["04-navigation", "Navigation", "Components", "Sidebar destinations and their current, hover and focus states.", "2-511"],
  ["05-content", "Content & status", "Components", "Collection status, play outcomes and cover-card metadata.", "2-548"],
  ["06-overlays", "Overlays & feedback", "Components", "The draft editor and progress, success and failure messages.", "2-608"],
  ["07-patterns", "UX patterns", "Product patterns", "Browse, review, save or dismiss, and return keyboard focus.", "2-649"],
  ["08-accessibility", "Accessibility & governance", "Quality & governance", "Keyboard behavior, semantics and the review checklist for changes.", "2-668"],
  ["09-portfolio", "Portfolio", "Portfolio", "The three core product flows: Library, What to Play and Activity.", "2-687"],
].map(([id, title, group, description, node]) => ({ id, title, group, description, node }));
const byId = (id) => document.getElementById(id);
let current = "00-cover";
function navigate(id) {
  if (location.hash === "#" + id) render();
  else location.hash = id;
}
function paintNavigation() {
  const query = byId("filter").value.trim().toLowerCase();
  const nav = byId("board-nav");
  nav.replaceChildren();
  let group = "";
  let count = 0;
  for (const board of boards) {
    if (
      query &&
      !`${board.title} ${board.group} ${board.description}`.toLowerCase().includes(query)
    )
      continue;
    if (group !== board.group) {
      group = board.group;
      const heading = document.createElement("h2");
      heading.textContent = group;
      nav.append(heading);
    }
    const link = document.createElement("a");
    link.href = "#" + board.id;
    link.textContent = board.title;
    if (current === board.id) link.setAttribute("aria-current", "page");
    nav.append(link);
    count++;
  }
  byId("no-results").hidden = count !== 0;
}
function render() {
  const board = boards.find((b) => b.id === location.hash.slice(1)) || boards[0];
  current = board.id;
  byId("category").textContent = board.group;
  byId("board-title").textContent = board.title;
  byId("board-description").textContent = board.description;
  document.title = `${board.title} · Gamelog macOS design system`;
  const image = byId("board-image");
  image.src = `boards/${current}.png`;
  image.alt = `Figma design-system board: ${board.title}`;
  byId("png-link").href = image.src;
  byId("png-link").setAttribute("download", current + ".png");
  const index = boards.indexOf(board);
  byId("page-count").textContent = `${index + 1} of ${boards.length} boards`;
  byId("previous").disabled = index === 0;
  byId("next").disabled = index === boards.length - 1;
  paintNavigation();
  byId("announcement").textContent = `Showing ${board.title}`;
  byId("canvas").scrollTo(0, 0);
}
byId("filter").addEventListener("input", paintNavigation);
byId("previous").addEventListener("click", () =>
  navigate(boards[Math.max(0, boards.findIndex((b) => b.id === current) - 1)].id)
);
byId("next").addEventListener("click", () =>
  navigate(boards[Math.min(boards.length - 1, boards.findIndex((b) => b.id === current) + 1)].id)
);
function setSize(actual) {
  byId("canvas").classList.toggle("actual", actual);
  byId("fit").setAttribute("aria-pressed", String(!actual));
  byId("actual").setAttribute("aria-pressed", String(actual));
}
byId("fit").addEventListener("click", () => setSize(false));
byId("actual").addEventListener("click", () => setSize(true));
byId("board-image").addEventListener("error", () => {
  byId("announcement").textContent =
    "This board could not be loaded. Keep the boards folder next to index.html.";
});
window.addEventListener("hashchange", () => {
  render();
  byId("main").focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
if (location.protocol === "file:") byId("offline-note").hidden = false;
const compact = window.matchMedia("(max-width:760px)");
function compactNav() {
  byId("navigation").open = !compact.matches;
}
compactNav();
compact.addEventListener("change", compactNav);
render();
