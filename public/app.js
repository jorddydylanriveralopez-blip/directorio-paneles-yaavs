(() => {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const qEl = document.getElementById("q");
  const filtersEl = document.getElementById("filters");
  const countEl = document.getElementById("panelCount");

  let panels = Array.isArray(window.YAAVS_DIRECTORY) ? window.YAAVS_DIRECTORY : [];
  let activeTag = "Todos";

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(String(url || ""));
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

  function previewHtml(p) {
    const previewUrl = String(p.previewUrl || "").trim();
    const formUrl = String(p.formUrl || "").trim();
    const src = previewUrl || formUrl;
    if (!src) {
      return `<div class="preview preview-empty"><span>Sin vista previa</span></div>`;
    }
    if (previewUrl && isImageUrl(previewUrl)) {
      return `
        <button type="button" class="preview preview-img" data-preview="${escapeHtml(src)}" data-preview-kind="img" aria-label="Ver vista previa de ${escapeHtml(p.title)}">
          <img src="${escapeHtml(previewUrl)}" alt="Vista previa: ${escapeHtml(p.title)}" loading="lazy" />
        </button>`;
    }
    return `
      <button type="button" class="preview preview-frame" data-preview="${escapeHtml(src)}" data-preview-kind="frame" aria-label="Ver vista previa de ${escapeHtml(p.title)}">
        <div class="preview-scale" aria-hidden="true">
          <iframe src="${escapeHtml(src)}" loading="lazy" tabindex="-1" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        </div>
        <span class="preview-veil">Ver preview</span>
      </button>`;
  }

  function cardHtml(p, i) {
    const hasResults = Boolean(p.resultsUrl);
    const actionsClass = hasResults ? "actions" : "actions one";
    const index = String(i + 1).padStart(2, "0");
    return `
      <article class="panel" data-tag="${escapeHtml(p.tag || "Panel")}" style="animation-delay:${Math.min(
        i * 0.06,
        0.36,
      )}s">
        ${previewHtml(p)}
        <div class="panel-top">
          <span class="tag">${escapeHtml(p.tag || "Panel")}</span>
          <span class="panel-index">${index}</span>
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

  function ensureModal() {
    let modal = document.getElementById("previewModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "previewModal";
    modal.className = "preview-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="preview-modal-backdrop" data-close></div>
      <div class="preview-modal-dialog" role="dialog" aria-modal="true" aria-label="Vista previa">
        <button type="button" class="preview-modal-close" data-close aria-label="Cerrar">×</button>
        <div class="preview-modal-body" id="previewModalBody"></div>
        <a class="btn-form preview-modal-open" id="previewModalOpen" href="#" target="_blank" rel="noopener">Abrir en pestaña</a>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    return modal;
  }

  function closeModal() {
    const modal = document.getElementById("previewModal");
    if (!modal) return;
    modal.hidden = true;
    const body = document.getElementById("previewModalBody");
    if (body) body.innerHTML = "";
  }

  function openModal(url, kind) {
    const modal = ensureModal();
    const body = document.getElementById("previewModalBody");
    const open = document.getElementById("previewModalOpen");
    if (!body || !open) return;
    open.href = url;
    if (kind === "img" || isImageUrl(url)) {
      body.innerHTML = `<img src="${escapeHtml(url)}" alt="Vista previa ampliada" />`;
    } else {
      body.innerHTML = `<iframe src="${escapeHtml(
        url,
      )}" title="Vista previa" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>`;
    }
    modal.hidden = false;
  }

  function render() {
    const list = filtered();
    countEl.textContent = `${panels.length} acceso${panels.length === 1 ? "" : "s"}`;
    empty.hidden = list.length > 0;
    grid.innerHTML = list.map((p, i) => cardHtml(p, i)).join("");
  }

  async function loadPanels() {
    try {
      const res = await fetch(`/api/panels?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("api");
      const data = await res.json();
      if (Array.isArray(data.items)) panels = data.items;
    } catch (_) {
      if (!panels.length && Array.isArray(window.YAAVS_DIRECTORY)) {
        panels = window.YAAVS_DIRECTORY;
      }
    }
    if (activeTag !== "Todos" && !tags().includes(activeTag)) activeTag = "Todos";
    renderFilters();
    render();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    activeTag = btn.getAttribute("data-tag") || "Todos";
    renderFilters();
    render();
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview]");
    if (!btn) return;
    e.preventDefault();
    openModal(btn.getAttribute("data-preview"), btn.getAttribute("data-preview-kind"));
  });

  qEl.addEventListener("input", render);

  renderFilters();
  render();
  loadPanels();
})();
