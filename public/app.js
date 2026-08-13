(() => {
  const panels = Array.isArray(window.YAAVS_DIRECTORY) ? window.YAAVS_DIRECTORY : [];
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const qEl = document.getElementById("q");
  const filtersEl = document.getElementById("filters");
  const countEl = document.getElementById("panelCount");

  let activeTag = "Todos";

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tags() {
    const set = new Set(panels.map((p) => p.tag).filter(Boolean));
    return ["Todos", ...[...set].sort((a, b) => a.localeCompare(b, "es"))];
  }

  function renderFilters() {
    filtersEl.innerHTML = tags()
      .map(
        (tag) => `
      <button type="button" class="chip${tag === activeTag ? " on" : ""}" data-tag="${escapeHtml(
        tag,
      )}">${escapeHtml(tag)}</button>`,
      )
      .join("");
  }

  function filtered() {
    const q = qEl.value.trim().toLowerCase();
    return panels.filter((p) => {
      if (activeTag !== "Todos" && p.tag !== activeTag) return false;
      if (!q) return true;
      const hay = [p.title, p.blurb, p.tag, p.id].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function cardHtml(p, i) {
    const hasResults = Boolean(p.resultsUrl);
    const actionsClass = hasResults ? "actions" : "actions one";
    return `
      <article class="panel" style="animation-delay:${Math.min(i * 0.05, 0.35)}s">
        <div class="panel-top">
          <span class="tag">${escapeHtml(p.tag || "Panel")}</span>
        </div>
        <div>
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.blurb || "")}</p>
        </div>
        <div class="${actionsClass}">
          <a class="btn-form${p.formUrl ? "" : " is-disabled"}" href="${escapeHtml(
            p.formUrl || "#",
          )}" target="_blank" rel="noopener">Abrir formulario</a>
          ${
            hasResults
              ? `<a class="btn-results" href="${escapeHtml(
                  p.resultsUrl,
                )}" target="_blank" rel="noopener">Ver resultados</a>`
              : ""
          }
        </div>
      </article>`;
  }

  function render() {
    const list = filtered();
    countEl.textContent = `${panels.length} panel${panels.length === 1 ? "" : "es"}`;
    empty.hidden = list.length > 0;
    grid.innerHTML = list.map((p, i) => cardHtml(p, i)).join("");
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    activeTag = btn.getAttribute("data-tag") || "Todos";
    renderFilters();
    render();
  });

  qEl.addEventListener("input", render);

  renderFilters();
  render();
})();
