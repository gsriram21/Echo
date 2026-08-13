// Simple local dev server that mimics Vercel's routing for the api/ folder.
// Run with `npm run dev`. No Vercel CLI login required.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// Load .env.local into process.env (no dotenv dependency).
try {
  const raw = fs.readFileSync(path.join(__dirname, ".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  console.warn("(no .env.local found — API routes needing ANTHROPIC_API_KEY will fail)");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4":  "video/mp4",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".txt":  "text/plain; charset=utf-8",
  ".md":   "text/plain; charset=utf-8",
};

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  // Prevent path traversal.
  const filePath = path.normalize(path.join(__dirname, pathname));
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    return res.end("forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      return res.end("not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.setHeader("Content-Type", type);

    // Range support for video files — needed for scrubbing.
    if ((ext === ".mp4" || ext === ".webm") && req.headers.range) {
      const range = req.headers.range.match(/bytes=(\d*)-(\d*)/);
      const start = range && range[1] ? parseInt(range[1], 10) : 0;
      const end = range && range[2] ? parseInt(range[2], 10) : stat.size - 1;
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", end - start + 1);
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(filePath).pipe(res);
  });
}

const routes = new Map(); // path -> resolved handler
async function loadHandler(routePath) {
  if (routes.has(routePath)) return routes.get(routePath);
  const filePath = path.join(__dirname, "api", routePath + ".js");
  if (!fs.existsSync(filePath)) return null;
  const mod = await import(pathToFileURL(filePath).href);
  const handler = mod.default;
  routes.set(routePath, handler);
  return handler;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      const routePath = url.pathname.slice(5).replace(/\/$/, "");
      const handler = await loadHandler(routePath);
      if (!handler) {
        res.statusCode = 404;
        return res.end(`no api route: ${routePath}`);
      }
      // Pass req/res straight through — the handlers use raw Node http.
      return handler(req, res);
    }
    return serveStatic(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("internal error: " + err.message);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Echo dev server running at http://localhost:${PORT}`);
  console.log(`  static:   ${__dirname}`);
  console.log(`  api key:  ${process.env.ANTHROPIC_API_KEY ? "loaded" : "MISSING — add to .env.local"}`);
});
