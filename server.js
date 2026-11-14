const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

(() => {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, "utf8")
      .split(/\n/)
      .forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) return;
        const key = m[1];
        let val = m[2];
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] == null || process.env[key] === "") process.env[key] = val;
      });
  } catch (_) {}
})();

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const publicDir = path.join(__dirname, "public");
const dataDir = process.env.DATA_DIR
  ? path.resolve(String(process.env.DATA_DIR))
  : path.join(__dirname, "data");
const panelsFile = path.join(dataDir, "panels.json");

const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "YaavsDir-Local").trim();
const ADMIN_COOKIE = "yaavs_dir_admin";
const ADMIN_SESSION_DAYS = 14;
const ADMIN_SESSION_SECRET = String(
  process.env.ADMIN_SESSION_SECRET ||
    crypto.createHash("sha256").update(`dir-admin:${ADMIN_PASSWORD}`).digest("hex"),
);

const DEFAULT_PANELS = [
  {
    id: "solicitud-activacion-btl",
    tag: "Solicitud",
    title: "Solicitud Activación BTL",
    blurb: "Alta de activación BTL y seguimiento de solicitudes.",
    formUrl: "https://solicitudactivacionbtl.fillout.com/yaavs",
    resultsUrl: "https://coral-oryx-137304.hostingersite.com/",
  },
  {
    id: "solicitud-lonas-toldos",
    tag: "Solicitud",
    title: "Solicitud Lonas y Toldos",
    blurb: "Solicitud de lonas y toldos, con panel de respuestas en vivo.",
    formUrl: "https://lona-especializada-yaavs.hostingersite.com/",
    resultsUrl: "https://lona-especializada-yaavs.hostingersite.com/resultados",
    previewUrl: "",
    formConfig: {
      heroTitle: "Solicitud de material especializado",
      heroLede:
        "Indica primero si la solicitud es de Centro o Foráneo. Luego elige el material y completa el cuestionario de manera correcta.",
      submitLabel: "Enviar solicitud",
      resultsBoardLabel: "Ver resultados",
      materialHints: {},
    },
  },
  {
    id: "nps",
    tag: "NPS",
    title: "NPS",
    blurb: "Medición NPS de experiencia con el programa.",
    formUrl: "https://gray-manatee-704328.hostingersite.com/",
    resultsUrl: "https://gray-manatee-704328.hostingersite.com/resultados",
  },
  {
    id: "solicitud-proyectos-marketing",
    tag: "Solicitud",
    title: "Solicitud Proyectos Marketing",
    blurb: "Brief y solicitud de proyectos para el equipo de marketing.",
    formUrl: "https://grey-ram-535914.hostingersite.com/",
    resultsUrl: "https://grey-ram-535914.hostingersite.com/resultados",
  },
  {
    id: "nps-activacion-btl",
    tag: "NPS",
    title: "NPS Activación BTL",
    blurb: "NPS y satisfacción post-activación BTL.",
    formUrl: "https://encuesta-satisfaccion-activacion.ganayaavs.com/",
    resultsUrl: "https://encuesta-satisfaccion-activacion.ganayaavs.com/resultados",
  },
  {
    id: "reporte-diario-activacion-btl",
    tag: "Reporte",
    title: "Reporte diario Activación BTL",
    blurb: "Cierre diario: resultados, material, incidencias y evidencias.",
    formUrl: "https://lightslategrey-deer-478072.hostingersite.com/",
    resultsUrl: "https://lightslategrey-deer-478072.hostingersite.com/resultados",
  },
  {
    id: "encuesta-trade-marketing",
    tag: "NPS",
    title: "Encuesta Trade Marketing",
    blurb: "Experiencia en PDV: NPS, POP, ejecutivo de ventas y Trade Marketing.",
    formUrl: "https://lightslategrey-deer-478072.hostingersite.com/trade",
    resultsUrl: "https://lightslategrey-deer-478072.hostingersite.com/trade/resultados",
  },
];

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function defaultFormConfigFor(id) {
  if (id === "solicitud-lonas-toldos") {
    return {
      heroTitle: "Solicitud de material especializado",
      heroLede:
        "Indica primero si la solicitud es de Centro o Foráneo. Luego elige el material y completa el cuestionario de manera correcta.",
      submitLabel: "Enviar solicitud",
      resultsBoardLabel: "Ver resultados",
      materialHints: {},
    };
  }
  return {
    heroTitle: "",
    heroLede: "",
    submitLabel: "",
    resultsBoardLabel: "",
    materialHints: {},
  };
}

function normalizeFormConfig(raw, id) {
  const base = defaultFormConfigFor(id);
  const incoming = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const hints =
    incoming.materialHints && typeof incoming.materialHints === "object" && !Array.isArray(incoming.materialHints)
      ? incoming.materialHints
      : base.materialHints;
  return {
    heroTitle: String(incoming.heroTitle ?? base.heroTitle ?? "").trim(),
    heroLede: String(incoming.heroLede ?? base.heroLede ?? "").trim(),
    submitLabel: String(incoming.submitLabel ?? base.submitLabel ?? "").trim(),
    resultsBoardLabel: String(incoming.resultsBoardLabel ?? base.resultsBoardLabel ?? "").trim(),
    materialHints: hints,
  };
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 80)
    .map((h, i) => ({
      id: String(h?.id || `chg_${Date.now()}_${i}`),
      at: String(h?.at || new Date().toISOString()),
      note: String(h?.note || "").trim(),
      kind: h?.kind === "dash" ? "dash" : "form",
      summary: String(h?.summary || "").trim(),
      changes: h?.changes && typeof h.changes === "object" && !Array.isArray(h.changes) ? h.changes : {},
    }))
    .filter((h) => h.note || h.summary || Object.keys(h.changes).length);
}

function diffFields(before, after, keys) {
  const changes = {};
  for (const key of keys) {
    const from = String(before?.[key] ?? "");
    const to = String(after?.[key] ?? "");
    if (from !== to) changes[key] = { from, to };
  }
  return changes;
}

function summarizeChanges(changes) {
  const labels = {
    title: "título",
    blurb: "descripción",
    formUrl: "URL formulario",
    resultsUrl: "URL dashboard",
    previewUrl: "preview",
    heroTitle: "hero",
    heroLede: "texto hero",
    submitLabel: "botón enviar",
    resultsBoardLabel: "label resultados",
    notes: "notas",
    active: "visibilidad",
  };
  const keys = Object.keys(changes || {});
  if (!keys.length) return "Sin cambios de campos";
  return keys.map((k) => labels[k] || k).join(", ");
}

function pushHistory(panel, entry) {
  const history = normalizeHistory(panel.history);
  history.unshift({
    id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    note: String(entry.note || "").trim(),
    kind: entry.kind === "dash" ? "dash" : "form",
    summary: String(entry.summary || "").trim(),
    changes: entry.changes || {},
  });
  return history.slice(0, 80);
}

function normalizePanel(raw, index = 0) {
  const title = String(raw?.title || "").trim();
  const id =
    String(raw?.id || "").trim() ||
    slugify(title) ||
    `panel-${Date.now()}-${index}`;
  return {
    id,
    tag: String(raw?.tag || "Panel").trim() || "Panel",
    title: title || id,
    blurb: String(raw?.blurb || "").trim(),
    formUrl: String(raw?.formUrl || "").trim(),
    resultsUrl: String(raw?.resultsUrl || "").trim(),
    previewUrl: String(raw?.previewUrl || "").trim(),
    formConfig: normalizeFormConfig(raw?.formConfig, id),
    history: normalizeHistory(raw?.history),
    active: raw?.active === false ? false : true,
    notes: String(raw?.notes || "").trim(),
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : index,
    updatedAt: String(raw?.updatedAt || new Date().toISOString()),
  };
}

function seedPanels() {
  return DEFAULT_PANELS.map((p, i) => normalizePanel(p, i));
}

function migratePanels(list) {
  let changed = false;
  const out = list.map((p, i) => {
    let next = normalizePanel(p, i);
    if (next.id === "solicitud-lonas-toldos") {
      if (/solicitudes-especializadas/i.test(next.formUrl || "")) {
        next.formUrl = "https://lona-especializada-yaavs.hostingersite.com/";
        next.resultsUrl = "https://lona-especializada-yaavs.hostingersite.com/resultados";
        changed = true;
      }
      if (!String(next.formConfig?.heroTitle || "").trim()) {
        next.formConfig = normalizeFormConfig(null, next.id);
        changed = true;
      }
    }
    return next;
  });
  if (changed) return writePanels(out);
  return out.sort((a, b) => a.order - b.order);
}

function readPanels() {
  ensureStore();
  if (!fs.existsSync(panelsFile)) {
    const seeded = seedPanels();
    writePanels(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(panelsFile, "utf8"));
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.panels) ? parsed.panels : [];
    if (!list.length) {
      const seeded = seedPanels();
      writePanels(seeded);
      return seeded;
    }
    return migratePanels(list.map((p, i) => normalizePanel(p, i)));
  } catch (_) {
    const seeded = seedPanels();
    writePanels(seeded);
    return seeded;
  }
}

function writePanels(list, { touchIds = null } = {}) {
  ensureStore();
  const touch = touchIds ? new Set(touchIds) : null;
  const now = new Date().toISOString();
  const normalized = (Array.isArray(list) ? list : [])
    .map((p, i) => {
      const next = normalizePanel(p, i);
      if (!touch || touch.has(next.id)) next.updatedAt = now;
      return next;
    })
    .sort((a, b) => a.order - b.order)
    .map((p, i) => ({ ...p, order: i }));
  fs.writeFileSync(panelsFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function publicPanel(p) {
  return {
    id: p.id,
    tag: p.tag,
    title: p.title,
    blurb: p.blurb,
    formUrl: p.formUrl,
    resultsUrl: p.resultsUrl,
    previewUrl: p.previewUrl || "",
  };
}

function corsPublic(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function signSession() {
  const exp = Date.now() + ADMIN_SESSION_DAYS * 86400000;
  const payload = `admin.${exp}`;
  const sig = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return "";
}

function isAdmin(req) {
  const [role, exp, sig] = readCookie(req, ADMIN_COOKIE).split(".");
  if (role !== "admin" || !exp || !sig) return false;
  if (!(Number(exp) > Date.now())) return false;
  const expected = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(`${role}.${exp}`)
    .digest("hex");
  return safeEqual(sig, expected);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Inicia sesión de admin" });
  }
  next();
}

function setAdminCookie(res, token) {
  const maxAge = ADMIN_SESSION_DAYS * 86400;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

const loginAttempts = new Map();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "directorio-paneles-yaavs" });
});

app.get("/api/panels", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const items = readPanels()
    .filter((p) => p.active)
    .map(publicPanel);
  res.json({ ok: true, items, total: items.length });
});

app.options("/api/panels/:id/config", (_req, res) => {
  corsPublic(res);
  res.status(204).end();
});

app.get("/api/panels/:id/config", (req, res) => {
  corsPublic(res);
  res.setHeader("Cache-Control", "no-store");
  const id = String(req.params.id || "").trim();
  const panel = readPanels().find((p) => p.id === id);
  if (!panel) return res.status(404).json({ ok: false, error: "Panel no encontrado" });
  res.json({
    ok: true,
    id: panel.id,
    title: panel.title,
    formUrl: panel.formUrl,
    resultsUrl: panel.resultsUrl,
    previewUrl: panel.previewUrl || "",
    formConfig: panel.formConfig || defaultFormConfigFor(panel.id),
    updatedAt: panel.updatedAt || null,
    latestChange: Array.isArray(panel.history) && panel.history[0] ? panel.history[0] : null,
  });
});

app.post("/api/login", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local")
    .split(",")[0]
    .trim();
  const rec = loginAttempts.get(ip) || { n: 0, until: 0 };
  if (rec.until > Date.now()) {
    return res.status(429).json({ ok: false, error: "Demasiados intentos. Espera un momento." });
  }
  const password = String(req.body?.password || "");
  if (!safeEqual(password, ADMIN_PASSWORD)) {
    const next = { n: rec.n + 1, until: 0 };
    if (next.n >= 8) next.until = Date.now() + 60_000;
    loginAttempts.set(ip, next);
    return res.status(401).json({ ok: false, error: "Contraseña incorrecta" });
  }
  loginAttempts.delete(ip);
  setAdminCookie(res, signSession());
  res.json({ ok: true });
});

app.post("/api/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

app.get("/api/session", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!isAdmin(req)) return res.status(401).json({ ok: false });
  res.json({ ok: true, role: "admin" });
});

app.get("/api/admin/panels", requireAdmin, (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const items = readPanels();
  res.json({ ok: true, items, total: items.length });
});

app.post("/api/admin/panels", requireAdmin, (req, res) => {
  const panels = readPanels();
  const next = normalizePanel(
    {
      ...req.body,
      order: panels.length,
      id: req.body?.id || slugify(req.body?.title) || `panel-${Date.now()}`,
    },
    panels.length,
  );
  if (panels.some((p) => p.id === next.id)) {
    return res.status(409).json({ ok: false, error: "Ya existe un panel con ese id" });
  }
  const items = writePanels([...panels, next], { touchIds: [next.id] });
  res.json({ ok: true, item: items.find((p) => p.id === next.id), items });
});

app.put("/api/admin/panels/reorder", requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id) => String(id)) : [];
  if (!ids.length) return res.status(400).json({ ok: false, error: "Falta la lista de ids" });
  const current = readPanels();
  const map = new Map(current.map((p) => [p.id, p]));
  const ordered = [];
  for (const id of ids) {
    const item = map.get(id);
    if (item) {
      ordered.push(item);
      map.delete(id);
    }
  }
  for (const leftover of map.values()) ordered.push(leftover);
  const items = writePanels(ordered.map((p, i) => ({ ...p, order: i })));
  res.json({ ok: true, items });
});

app.put("/api/admin/panels/import", requireAdmin, (req, res) => {
  const incoming = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body?.items)
      ? req.body.items
      : Array.isArray(req.body?.panels)
        ? req.body.panels
        : null;
  if (!incoming) return res.status(400).json({ ok: false, error: "JSON inválido: se espera un arreglo de paneles" });
  const items = writePanels(incoming.map((p, i) => normalizePanel(p, i)));
  res.json({ ok: true, items, total: items.length });
});

app.put("/api/admin/panels/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id || "").trim();
  const panels = readPanels();
  const idx = panels.findIndex((p) => p.id === id);
  if (idx < 0) return res.status(404).json({ ok: false, error: "Panel no encontrado" });
  const nextId = String(req.body?.id || id).trim() || id;
  if (nextId !== id && panels.some((p) => p.id === nextId)) {
    return res.status(409).json({ ok: false, error: "Ya existe un panel con ese id" });
  }

  const before = panels[idx];
  const nextConfig = req.body?.formConfig
    ? normalizeFormConfig({ ...before.formConfig, ...req.body.formConfig }, nextId)
    : before.formConfig;
  const changeNote = String(req.body?.changeNote || "").trim();
  const changeKind = req.body?.changeKind === "dash" ? "dash" : "form";

  const draft = normalizePanel(
    {
      ...before,
      ...req.body,
      id: nextId,
      formConfig: nextConfig,
      history: before.history,
      order: before.order,
    },
    before.order,
  );

  const fieldChanges = {
    ...diffFields(before, draft, [
      "title",
      "blurb",
      "formUrl",
      "resultsUrl",
      "previewUrl",
      "notes",
      "active",
    ]),
    ...diffFields(before.formConfig || {}, draft.formConfig || {}, [
      "heroTitle",
      "heroLede",
      "submitLabel",
      "resultsBoardLabel",
    ]),
  };

  if (changeNote || Object.keys(fieldChanges).length) {
    draft.history = pushHistory(before, {
      note: changeNote || "Actualización desde centro de control",
      kind: changeKind,
      summary: summarizeChanges(fieldChanges),
      changes: fieldChanges,
    });
  }

  panels[idx] = draft;
  const items = writePanels(panels, { touchIds: [draft.id] });
  res.json({ ok: true, item: items.find((p) => p.id === draft.id), items });
});

app.delete("/api/admin/panels/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id || "").trim();
  const panels = readPanels();
  const remaining = panels.filter((p) => p.id !== id);
  if (remaining.length === panels.length) {
    return res.status(404).json({ ok: false, error: "Panel no encontrado" });
  }
  const items = writePanels(remaining);
  res.json({ ok: true, items });
});

app.get("/admin", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("html");
  res.send(fs.readFileSync(path.join(publicDir, "admin.html")));
});

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const requested = req.path === "/" ? "index.html" : safeRelative(req.path);
  const file = requested ? resolvePublic(requested) : null;
  if (file && isFile(file)) return sendPublic(res, file);

  const index = path.join(publicDir, "index.html");
  if (!isFile(index)) return next();
  return sendPublic(res, index);
});

app.use((err, _req, res, _next) => {
  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ ok: false, error: err && err.message ? err.message : "error" });
});

app.listen(PORT, "0.0.0.0", () => {
  ensureStore();
  readPanels();
  console.log(`Directorio Paneles YAAVS on http://localhost:${PORT}`);
});

function safeRelative(urlPath) {
  let decoded = urlPath;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  return decoded.replace(/^\/+/, "");
}

function resolvePublic(relativePath) {
  const file = path.normalize(path.join(publicDir, relativePath));
  if (file !== publicDir && !file.startsWith(publicDir + path.sep)) return null;
  return file;
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function sendPublic(res, file) {
  if (file.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  else if (file.endsWith(".css") || file.endsWith(".js")) {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
  }
  res.type(path.extname(file) || "html");
  res.send(fs.readFileSync(file));
}
