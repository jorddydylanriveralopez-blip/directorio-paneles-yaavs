(() => {
  const gridForms = document.getElementById("gridForms");
  const gridDash = document.getElementById("gridDash");
  const emptyForms = document.getElementById("emptyForms");
  const emptyDash = document.getElementById("emptyDash");
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

  function matchesFilter(p) {
    if (activeTag !== "Todos" && p.tag !== activeTag) return false;
    const q = qEl.value.trim().toLowerCase();
    if (!q) return true;
    const hay = [p.title, p.blurb, p.tag, p.id].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function formPanels() {
    return panels.filter((p) => p.formUrl && matchesFilter(p));
  }

  function dashPanels() {
    return panels.filter((p) => p.resultsUrl && matchesFilter(p));
  }

  function previewHtml(p, kind) {
    const previewUrl = String(p.previewUrl || "").trim();
    const formUrl = String(p.formUrl || "").trim();
    const resultsUrl = String(p.resultsUrl || "").trim();
    const src =
      kind === "dash"
        ? previewUrl && isImageUrl(previewUrl)
          ? previewUrl
          : resultsUrl || formUrl
        : previewUrl || formUrl;
    if (!src) {
      return `<div class="preview preview-empty"><span>Sin vista previa</span></div>`;
    }
    if (previewUrl && isImageUrl(previewUrl) && (kind !== "dash" || !resultsUrl)) {
      return `
        <button type="button" class="preview preview-img" data-preview="${escapeHtml(
          previewUrl,
        )}" data-preview-kind="img" aria-label="Ver vista previa de ${escapeHtml(p.title)}">
          <img src="${escapeHtml(previewUrl)}" alt="Vista previa: ${escapeHtml(p.title)}" loading="lazy" />
        </button>`;
    }
    if (previewUrl && isImageUrl(previewUrl) && kind === "form") {
      return `
        <button type="button" class="preview preview-img" data-preview="${escapeHtml(
          previewUrl,
        )}" data-preview-kind="img" aria-label="Ver vista previa de ${escapeHtml(p.title)}">
          <img src="${escapeHtml(previewUrl)}" alt="Vista previa: ${escapeHtml(p.title)}" loading="lazy" />
        </button>`;
    }
    return `
      <button type="button" class="preview preview-frame" data-preview="${escapeHtml(
        src,
      )}" data-preview-kind="frame" aria-label="Ver vista previa de ${escapeHtml(p.title)}">
        <div class="preview-scale" aria-hidden="true">
          <iframe src="${escapeHtml(src)}" loading="lazy" tabindex="-1" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        </div>
        <span class="preview-veil">${kind === "dash" ? "Ver dashboard" : "Ver formulario"}</span>
      </button>`;
  }

  function cardHtml(p, i, kind) {
    const index = String(i + 1).padStart(2, "0");
    const kindLabel = kind === "dash" ? "Dashboard" : "Formulario";
    const primaryUrl = kind === "dash" ? p.resultsUrl : p.formUrl;
    const primaryLabel = kind === "dash" ? "Abrir dashboard" : "Abrir formulario";
    const secondaryUrl = kind === "dash" ? p.formUrl : p.resultsUrl;
    const secondaryLabel = kind === "dash" ? "Ir al formulario" : "Ver dashboard";
    const btnClass = kind === "dash" ? "btn-results" : "btn-form";
    const secClass = kind === "dash" ? "btn-form" : "btn-results";

    return `
      <article class="panel panel-${kind}" data-tag="${escapeHtml(
        p.tag || "Panel",
      )}" data-kind="${kind}" style="animation-delay:${Math.min(i * 0.06, 0.36)}s">
        ${previewHtml(p, kind)}
        <div class="panel-top">
          <span class="tag">${escapeHtml(p.tag || "Panel")}</span>
          <span class="kind-pill kind-${kind}">${kindLabel}</span>
        </div>
        <div>
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.blurb || "")}</p>
        </div>
        <div class="actions${secondaryUrl ? "" : " one"}">
          <a class="${btnClass}" href="${escapeHtml(
            primaryUrl || "#",
          )}" target="_blank" rel="noopener">${primaryLabel}</a>
          ${
            secondaryUrl
              ? `<a class="${secClass} is-ghost" href="${escapeHtml(
                  secondaryUrl,
                )}" target="_blank" rel="noopener">${secondaryLabel}</a>`
              : ""
          }
        </div>
        <span class="panel-index sr-only">${index}</span>
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
    const forms = formPanels();
    const dashes = dashPanels();
    const formN = panels.filter((p) => p.formUrl).length;
    const dashN = panels.filter((p) => p.resultsUrl).length;
    countEl.textContent = `${formN} formulario${formN === 1 ? "" : "s"} · ${dashN} dashboard${
      dashN === 1 ? "" : "s"
    }`;

    emptyForms.hidden = forms.length > 0;
    emptyDash.hidden = dashes.length > 0;
    gridForms.innerHTML = forms.map((p, i) => cardHtml(p, i, "form")).join("");
    gridDash.innerHTML = dashes.map((p, i) => cardHtml(p, i, "dash")).join("");
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

  document.querySelector(".page")?.addEventListener("click", (e) => {
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
