import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Get the correct __dirname in ESM
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

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
    middlewareMode: true as const,
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
  
  // Handle all other routes by sending the index.html
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    try {
      // Get the absolute path to the index.html file
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      
      // Check if index.html exists
      if (!fs.existsSync(clientTemplate)) {
        log(`Error: index.html not found at ${clientTemplate}`);
        return res.status(404).send("index.html not found. Make sure the client/index.html file exists.");
      }
      
      // Read and transform index.html
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      
      const page = await vite.transformIndexHtml(url, template);
      
      // Set Content-Type header explicitly
      res.status(200)
        .set({ "Content-Type": "text/html; charset=utf-8" })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error(`Error processing request: ${e}`);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Path to the built files
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  // Check if dist/public exists
  if (!fs.existsSync(distPath)) {
    log(`Warning: Build directory not found at ${distPath}`);
    throw new Error(
      `Could not find the build directory: ${distPath}. Please run the build command to generate static assets.`
    );
  }
  
  // Serve static files with proper MIME types
  app.use(express.static(distPath, { 
    setHeaders: (res, path) => {
      setCustomCacheControl(res, path);
      
      // Set correct MIME types for common file extensions
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }));
  
  // Serve index.html for all routes not found (SPA behavior)
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("index.html not found in build directory. Make sure you ran the build command properly.");
    }
    
    res.sendFile(indexPath, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });
}

// Set custom cache control headers for static assets
function setCustomCacheControl(res: express.Response, path: string) {
  if (path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-cache");
  } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    // Cache assets that rarely change for up to a week
    res.setHeader("Cache-Control", "public, max-age=604800");
  }
}
