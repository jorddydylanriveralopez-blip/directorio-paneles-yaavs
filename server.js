const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "directorio-paneles-yaavs" });
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
