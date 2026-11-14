(() => {
  const loginCard = document.getElementById("loginCard");
  const adminShell = document.getElementById("adminShell");
  const adminJump = document.getElementById("adminJump");
  const loginForm = document.getElementById("loginForm");
  const loginMsg = document.getElementById("loginMsg");
  const adminMsg = document.getElementById("adminMsg");
  const adminListForms = document.getElementById("adminListForms");
  const adminListDash = document.getElementById("adminListDash");
  const emptyAdminForms = document.getElementById("emptyAdminForms");
  const emptyAdminDash = document.getElementById("emptyAdminDash");
  const logoutBtn = document.getElementById("logoutBtn");
  const newBtn = document.getElementById("newBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importFile = document.getElementById("importFile");

  let panels = [];

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

  function showMsg(el, text, kind = "error") {
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      el.className = "admin-msg";
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.className = `admin-msg ${kind}`;
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      const err = new Error(data?.error || `Error ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const heroLedeLocked = document.getElementById("heroLedeLocked");
  const heroLedeOpen = document.getElementById("heroLedeOpen");

  function setAuthed(ok) {
    document.body.classList.toggle("admin-locked", !ok);
    document.body.classList.toggle("admin-open", ok);
    document.title = ok
      ? "Centro de control · YAAVS"
      : "Acceso · Centro de control · YAAVS";
    if (loginCard) loginCard.hidden = ok;
    if (adminShell) adminShell.hidden = !ok;
    if (adminJump) adminJump.hidden = !ok;
    if (logoutBtn) logoutBtn.hidden = !ok;
    if (heroLedeLocked) heroLedeLocked.hidden = ok;
    if (heroLedeOpen) heroLedeOpen.hidden = !ok;
  }

  function cfg(p) {
    return p.formConfig && typeof p.formConfig === "object" ? p.formConfig : {};
  }

  function formatWhen(iso) {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch (_) {
      return String(iso || "");
    }
  }

  function historyHtml(p, kind) {
    const rows = (Array.isArray(p.history) ? p.history : [])
      .filter((h) => !kind || h.kind === kind || !h.kind)
      .slice(0, 12);
    if (!rows.length) {
      return `<div class="change-history"><p class="admin-config-note">Sin cambios aún. Al aplicar, aparecen aquí.</p></div>`;
    }
    return `
      <div class="change-history">
        <h3>Historial de cambios</h3>
        <ul>
          ${rows
            .map(
              (h) => `
            <li>
              <div class="chg-top">
                <time datetime="${escapeHtml(h.at)}">${escapeHtml(formatWhen(h.at))}</time>
                <span class="kind-pill kind-${escapeHtml(h.kind || "form")}">${
                  h.kind === "dash" ? "Dashboard" : "Formulario"
                }</span>
              </div>
              <p class="chg-note">${escapeHtml(h.note || "Actualización")}</p>
              ${h.summary ? `<p class="chg-summary">${escapeHtml(h.summary)}</p>` : ""}
            </li>`,
            )
            .join("")}
        </ul>
      </div>`;
  }

  function livePreview(p, kind) {
    const src = kind === "dash" ? String(p.resultsUrl || "").trim() : String(p.formUrl || "").trim();
    if (!src) {
      return `<div class="live-preview empty">Agrega la URL para ver la vista en vivo</div>`;
    }
    const bust = `${src}${src.includes("?") ? "&" : "?"}live=${Date.now()}`;
    return `
      <div class="live-preview">
        <div class="live-preview-head">
          <span>Vista en vivo</span>
          <button type="button" class="btn-secondary" data-refresh-live data-live-src="${escapeHtml(
            src,
          )}">Actualizar vista</button>
        </div>
        <iframe data-live-frame src="${escapeHtml(bust)}" title="Vista en vivo" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
      </div>`;
  }

  function formCard(p, index, list) {
    const c = cfg(p);
    const hintsJson = JSON.stringify(c.materialHints || {}, null, 2);
    return `
      <article class="admin-panel admin-panel-form${p.active ? "" : " is-hidden"}" data-id="${escapeHtml(
        p.id,
      )}" data-kind="form">
        <div class="admin-panel-head">
          <div>
            <strong>${escapeHtml(p.title)}</strong>
            <span class="tag">${escapeHtml(p.tag || "Panel")}</span>
            <span class="kind-pill kind-form">Formulario</span>
            ${p.active ? "" : '<span class="badge-off">Oculto</span>'}
            <code class="panel-id">${escapeHtml(p.id)}</code>
          </div>
          <div class="admin-order">
            <button type="button" class="icon-btn" data-move="up" data-scope="form" title="Subir" ${
              index === 0 ? "disabled" : ""
            }>↑</button>
            <button type="button" class="icon-btn" data-move="down" data-scope="form" title="Bajar" ${
              index === list.length - 1 ? "disabled" : ""
            }>↓</button>
          </div>
        </div>
        <div class="admin-studio">
          <form class="admin-form" data-form="${escapeHtml(p.id)}" data-kind="form">
            <fieldset class="full admin-config admin-change-box">
              <legend>Escribe el cambio</legend>
              <p class="admin-config-note">Describe qué quieres cambiar. Al guardar, el formulario en vivo lo toma en segundos y queda en el historial.</p>
              <label class="full">
                <span>¿Qué cambio quieres hacer?</span>
                <textarea name="changeNote" rows="3" required placeholder="Ej. Cambiar el título a Solicitud urgente de lonas y el botón a Enviar ahora"></textarea>
              </label>
            </fieldset>
            <label>
              <span>Título en directorio</span>
              <input name="title" value="${escapeHtml(p.title)}" required />
            </label>
            <label>
              <span>Tipo / tag</span>
              <input name="tag" value="${escapeHtml(p.tag)}" required />
            </label>
            <label class="full">
              <span>Descripción en directorio</span>
              <textarea name="blurb" rows="2">${escapeHtml(p.blurb)}</textarea>
            </label>
            <label class="full">
              <span>URL formulario</span>
              <input name="formUrl" type="url" value="${escapeHtml(p.formUrl)}" placeholder="https://…" required />
            </label>
            <label class="full">
              <span>URL captura / preview (opcional, imagen)</span>
              <input name="previewUrl" type="url" value="${escapeHtml(p.previewUrl || "")}" placeholder="https://…/captura.jpg" />
            </label>
            <fieldset class="full admin-config">
              <legend>Textos del formulario (en vivo)</legend>
              <label>
                <span>Título hero</span>
                <input name="cfgHeroTitle" value="${escapeHtml(c.heroTitle || "")}" />
              </label>
              <label class="full">
                <span>Descripción hero</span>
                <textarea name="cfgHeroLede" rows="3">${escapeHtml(c.heroLede || "")}</textarea>
              </label>
              <label>
                <span>Texto botón enviar</span>
                <input name="cfgSubmitLabel" value="${escapeHtml(c.submitLabel || "")}" />
              </label>
              <label>
                <span>Label tablero resultados</span>
                <input name="cfgResultsBoardLabel" value="${escapeHtml(c.resultsBoardLabel || "")}" />
              </label>
              <label class="full">
                <span>Hints por material (JSON)</span>
                <textarea name="cfgMaterialHints" rows="3" spellcheck="false">${escapeHtml(hintsJson)}</textarea>
              </label>
            </fieldset>
            <label class="full">
              <span>Notas internas</span>
              <textarea name="notes" rows="2">${escapeHtml(p.notes || "")}</textarea>
            </label>
            <label class="check">
              <input type="checkbox" name="active" ${p.active ? "checked" : ""} />
              <span>Visible en el tablero público</span>
            </label>
            <div class="admin-form-actions">
              <button type="submit" class="btn-primary">Aplicar en vivo</button>
              <a class="btn-secondary" href="${escapeHtml(p.formUrl)}" target="_blank" rel="noopener">Abrir form</a>
              <button type="button" class="btn-danger" data-delete>Eliminar</button>
            </div>
          </form>
          <div class="admin-side">
            ${livePreview(p, "form")}
            ${historyHtml(p, "form")}
          </div>
        </div>
      </article>`;
  }

  function dashCard(p, index, list) {
    return `
      <article class="admin-panel admin-panel-dash${p.active ? "" : " is-hidden"}" data-id="${escapeHtml(
        p.id,
      )}" data-kind="dash">
        <div class="admin-panel-head">
          <div>
            <strong>${escapeHtml(p.title)}</strong>
            <span class="tag">${escapeHtml(p.tag || "Panel")}</span>
            <span class="kind-pill kind-dash">Dashboard</span>
            ${p.active ? "" : '<span class="badge-off">Oculto</span>'}
            <code class="panel-id">${escapeHtml(p.id)}</code>
          </div>
          <div class="admin-order">
            <button type="button" class="icon-btn" data-move="up" data-scope="dash" title="Subir" ${
              index === 0 ? "disabled" : ""
            }>↑</button>
            <button type="button" class="icon-btn" data-move="down" data-scope="dash" title="Bajar" ${
              index === list.length - 1 ? "disabled" : ""
            }>↓</button>
          </div>
        </div>
        <div class="admin-studio">
          <form class="admin-form" data-form="${escapeHtml(p.id)}" data-kind="dash">
            <fieldset class="full admin-config admin-change-box">
              <legend>Escribe el cambio</legend>
              <p class="admin-config-note">Describe el ajuste del dashboard. Queda registrado en el historial.</p>
              <label class="full">
                <span>¿Qué cambio quieres hacer?</span>
                <textarea name="changeNote" rows="3" required placeholder="Ej. Actualizar link del tablero de resultados NPS"></textarea>
              </label>
            </fieldset>
            <label>
              <span>Título</span>
              <input name="title" value="${escapeHtml(p.title)}" required />
            </label>
            <label>
              <span>Tipo / tag</span>
              <input name="tag" value="${escapeHtml(p.tag)}" required />
            </label>
            <label class="full">
              <span>URL dashboard / resultados</span>
              <input name="resultsUrl" type="url" value="${escapeHtml(p.resultsUrl)}" placeholder="https://…" required />
            </label>
            <label class="full">
              <span>URL captura / preview (opcional, imagen)</span>
              <input name="previewUrl" type="url" value="${escapeHtml(p.previewUrl || "")}" placeholder="https://…/captura.jpg" />
            </label>
            <label class="full">
              <span>Notas (solo admin)</span>
              <textarea name="notes" rows="2">${escapeHtml(p.notes || "")}</textarea>
            </label>
            <label class="check">
              <input type="checkbox" name="active" ${p.active ? "checked" : ""} />
              <span>Visible en el tablero público</span>
            </label>
            <div class="admin-form-actions">
              <button type="submit" class="btn-primary">Aplicar cambio</button>
              <a class="btn-secondary" href="${escapeHtml(p.resultsUrl)}" target="_blank" rel="noopener">Abrir dashboard</a>
              <button type="button" class="btn-danger" data-delete>Eliminar</button>
            </div>
          </form>
          <div class="admin-side">
            ${livePreview(p, "dash")}
            ${historyHtml(p, "dash")}
          </div>
        </div>
      </article>`;
  }

  function formPanels() {
    return panels.filter((p) => String(p.formUrl || "").trim());
  }

  function dashPanels() {
    return panels.filter((p) => String(p.resultsUrl || "").trim());
  }

  function renderList() {
    const forms = formPanels();
    const dashes = dashPanels();
    emptyAdminForms.hidden = forms.length > 0;
    emptyAdminDash.hidden = dashes.length > 0;
    adminListForms.innerHTML = forms.map((p, i) => formCard(p, i, forms)).join("");
    adminListDash.innerHTML = dashes.map((p, i) => dashCard(p, i, dashes)).join("");
  }

  async function loadPanels() {
    const data = await api("/api/admin/panels");
    panels = Array.isArray(data.items) ? data.items : [];
    renderList();
  }

  async function checkSession() {
    try {
      await api("/api/session");
      setAuthed(true);
      await loadPanels();
    } catch (_) {
      setAuthed(false);
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMsg(loginMsg, "");
    const password = document.getElementById("password").value;
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      document.getElementById("password").value = "";
      setAuthed(true);
      await loadPanels();
    } catch (err) {
      showMsg(loginMsg, err.message || "No se pudo iniciar sesión");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST", body: "{}" });
    } catch (_) {}
    setAuthed(false);
    panels = [];
    adminListForms.innerHTML = "";
    adminListDash.innerHTML = "";
  });

  newBtn.addEventListener("click", async () => {
    showMsg(adminMsg, "");
    try {
      const data = await api("/api/admin/panels", {
        method: "POST",
        body: JSON.stringify({
          title: "Nuevo panel",
          tag: "Panel",
          blurb: "",
          formUrl: "https://",
          resultsUrl: "",
          previewUrl: "",
          notes: "",
          active: true,
          formConfig: {
            heroTitle: "",
            heroLede: "",
            submitLabel: "",
            resultsBoardLabel: "",
            materialHints: {},
          },
        }),
      });
      panels = data.items || [];
      renderList();
      showMsg(adminMsg, "Panel creado en Formularios. Completa la URL y guarda.", "ok");
      document.getElementById("adminForms")?.scrollIntoView({ behavior: "smooth", block: "start" });
      adminListForms.querySelector(".admin-panel:last-child")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } catch (err) {
      showMsg(adminMsg, err.message || "No se pudo crear");
    }
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(panels, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paneles-yaavs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg(adminMsg, "JSON exportado.", "ok");
  });

  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    importFile.value = "";
    if (!file) return;
    showMsg(adminMsg, "");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = await api("/api/admin/panels/import", {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      panels = data.items || [];
      renderList();
      showMsg(adminMsg, `Importados ${panels.length} paneles.`, "ok");
    } catch (err) {
      showMsg(adminMsg, err.message || "No se pudo importar el JSON");
    }
  });

  async function saveFormKind(form) {
    const id = form.getAttribute("data-form");
    const kind = form.getAttribute("data-kind");
    const existing = panels.find((p) => p.id === id) || {};
    const fd = new FormData(form);
    const changeNote = String(fd.get("changeNote") || "").trim();
    if (!changeNote) {
      showMsg(adminMsg, "Escribe qué cambio quieres hacer (queda en el historial).");
      return;
    }

    if (kind === "dash") {
      const payload = {
        ...existing,
        title: String(fd.get("title") || "").trim(),
        tag: String(fd.get("tag") || "").trim(),
        resultsUrl: String(fd.get("resultsUrl") || "").trim(),
        previewUrl: String(fd.get("previewUrl") || "").trim(),
        notes: String(fd.get("notes") || "").trim(),
        active: fd.get("active") === "on",
        formConfig: existing.formConfig || {},
        formUrl: existing.formUrl || "",
        blurb: existing.blurb || "",
        changeNote,
        changeKind: "dash",
      };
      const data = await api(`/api/admin/panels/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      panels = data.items || [];
      renderList();
      showMsg(adminMsg, "Cambio aplicado al dashboard y guardado en historial.", "ok");
      return;
    }

    let materialHints = {};
    try {
      materialHints = JSON.parse(String(fd.get("cfgMaterialHints") || "{}"));
      if (!materialHints || typeof materialHints !== "object" || Array.isArray(materialHints)) {
        throw new Error("materialHints debe ser un objeto JSON");
      }
    } catch (err) {
      showMsg(adminMsg, err.message || "JSON de hints inválido");
      return;
    }

    const payload = {
      ...existing,
      title: String(fd.get("title") || "").trim(),
      tag: String(fd.get("tag") || "").trim(),
      blurb: String(fd.get("blurb") || "").trim(),
      formUrl: String(fd.get("formUrl") || "").trim(),
      previewUrl: String(fd.get("previewUrl") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
      active: fd.get("active") === "on",
      resultsUrl: existing.resultsUrl || "",
      formConfig: {
        heroTitle: String(fd.get("cfgHeroTitle") || "").trim(),
        heroLede: String(fd.get("cfgHeroLede") || "").trim(),
        submitLabel: String(fd.get("cfgSubmitLabel") || "").trim(),
        resultsBoardLabel: String(fd.get("cfgResultsBoardLabel") || "").trim(),
        materialHints,
      },
      changeNote,
      changeKind: "form",
    };

    const data = await api(`/api/admin/panels/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    panels = data.items || [];
    renderList();
    showMsg(
      adminMsg,
      "Cambio aplicado. El formulario en vivo se actualiza solo en unos segundos.",
      "ok",
    );
  }

  async function moveInScope(id, dir, scope) {
    const scoped = scope === "dash" ? dashPanels() : formPanels();
    const idx = scoped.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= scoped.length) return;

    const a = scoped[idx].id;
    const b = scoped[swap].id;
    const ia = panels.findIndex((p) => p.id === a);
    const ib = panels.findIndex((p) => p.id === b);
    if (ia < 0 || ib < 0) return;
    const next = panels.slice();
    const tmp = next[ia];
    next[ia] = next[ib];
    next[ib] = tmp;

    const data = await api("/api/admin/panels/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
    panels = data.items || [];
    renderList();
  }

  function onListEvent(e) {
    const form = e.target.closest("form[data-form]");
    if (e.type === "submit" && form) {
      e.preventDefault();
      showMsg(adminMsg, "");
      saveFormKind(form).catch((err) => showMsg(adminMsg, err.message || "No se pudo guardar"));
      return;
    }

    if (e.type !== "click") return;
    const del = e.target.closest("[data-delete]");
    const move = e.target.closest("[data-move]");
    const card = e.target.closest(".admin-panel");
    if (!card) return;
    const id = card.getAttribute("data-id");

    const refresh = e.target.closest("[data-refresh-live]");
    if (refresh) {
      const src = refresh.getAttribute("data-live-src") || "";
      const frame = refresh.closest(".live-preview")?.querySelector("[data-live-frame]");
      if (frame && src) {
        frame.src = `${src}${src.includes("?") ? "&" : "?"}live=${Date.now()}`;
      }
      return;
    }

    if (del) {
      if (!confirm("¿Eliminar este panel completo (formulario y dashboard)?")) return;
      showMsg(adminMsg, "");
      api(`/api/admin/panels/${encodeURIComponent(id)}`, { method: "DELETE" })
        .then((data) => {
          panels = data.items || [];
          renderList();
          showMsg(adminMsg, "Panel eliminado.", "ok");
        })
        .catch((err) => showMsg(adminMsg, err.message || "No se pudo eliminar"));
      return;
    }

    if (move) {
      const dir = move.getAttribute("data-move");
      const scope = move.getAttribute("data-scope") || "form";
      showMsg(adminMsg, "");
      moveInScope(id, dir, scope).catch((err) =>
        showMsg(adminMsg, err.message || "No se pudo reordenar"),
      );
    }
  }

  adminListForms.addEventListener("submit", onListEvent);
  adminListForms.addEventListener("click", onListEvent);
  adminListDash.addEventListener("submit", onListEvent);
  adminListDash.addEventListener("click", onListEvent);

  checkSession();
})();
