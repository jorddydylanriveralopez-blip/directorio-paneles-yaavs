const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "directorio-paneles-yaavs" });
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

app.use((_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Directorio Paneles YAAVS on http://localhost:${PORT}`);
});
