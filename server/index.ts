import express from "express";
import http from "http";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

(async () => {
  try {
    if (process.env.NODE_ENV !== "production") {
      // In development we'll use Vite's middleware to serve our assets
      await setupVite(app, server);
      log("Vite middleware setup complete");
    } else {
      // In production ensure that the client assets have been built into dist/public
      serveStatic(app);
      log("Serving static files");
    }
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
})();
