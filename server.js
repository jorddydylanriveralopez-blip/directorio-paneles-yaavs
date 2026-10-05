const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  let root = [];
  let pub = [];
  let pubErr = null;
  try {
    root = fs.readdirSync(__dirname);
  } catch (err) {
    root = [err.message];
  }
  try {
    pub = fs.readdirSync(publicDir);
  } catch (err) {
    pubErr = err.message;
  }
  res.json({
    ok: true,
    app: "directorio-paneles-yaavs",
    dir: __dirname,
    root,
    pub,
    pubErr,
    index: fs.existsSync(path.join(publicDir, "index.html")),
  });
});

app.get("/api/ping-html", (_req, res) => {
  res.type("html").send("<!doctype html><title>ok</title><p>hola</p>");
});

app.use(
  express.static(publicDir, {
    extensions: ["html"],
    etag: false,
    lastModified: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
      else if (filePath.endsWith(".css") || filePath.endsWith(".js")) {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      }
    },
  }),
);

app.use((req, res, next) => {
  res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.use((err, _req, res, _next) => {
  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ ok: false, error: err && err.message ? err.message : "error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Directorio Paneles YAAVS on http://localhost:${PORT}`);
});
