import express from "express";
import http from "http";
import path from "path";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000; // Changed to match .replit configuration

// Add middleware to properly set content types
app.use((req, res, next) => {
  const url = req.url;
  if (url.endsWith('.js')) {
    res.type('application/javascript');
  } else if (url.endsWith('.css')) {
    res.type('text/css');
  } else if (url.endsWith('.html')) {
    res.type('text/html');
  }
  next();
});

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
