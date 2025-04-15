import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Obtain __dirname in ES modules using URL
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      // Set Content-Type header explicitly so that the browser executes it as HTML
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Here we resolve to the directory where the production build assets are located.
  const distPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Please run the build command to generate static assets.`
    );
  }

  // Use express.static to serve files with correct MIME types
  app.use(express.static(distPath, { setHeaders: setCustomCacheControl }));

  // When a route is not found, send the index.html file with proper Content-Type header.
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });
}

// Optionally set custom cache control headers for your static assets (adjust as needed)
function setCustomCacheControl(res: express.Response, path: string) {
  if (path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
  }
}
