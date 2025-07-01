import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStaticProduction(app: Express) {
  const publicDir = path.resolve(process.cwd(), "dist/public");
  
  log(`Looking for static files in: ${publicDir}`);
  
  if (!fs.existsSync(publicDir)) {
    log(`Build directory not found: ${publicDir}. Creating fallback...`);
    // In production, we need to serve from wherever the built files are
    const altPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    if (fs.existsSync(altPath)) {
      log(`Using alternative path: ${altPath}`);
      app.use(express.static(altPath, {
        maxAge: "1y",
        etag: true,
        lastModified: true,
      }));
      
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        
        const indexPath = path.join(altPath, "index.html");
        res.sendFile(indexPath, (err) => {
          if (err) {
            log(`Error serving index.html: ${err.message}`);
            res.status(500).send("Internal Server Error");
          }
        });
      });
      return;
    }
    
    throw new Error(`Could not find build directory at ${publicDir} or ${altPath}`);
  }

  app.use(express.static(publicDir, {
    maxAge: "1y",
    etag: true,
    lastModified: true,
  }));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    const indexPath = path.join(publicDir, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        log(`Error serving index.html: ${err.message}`);
        res.status(500).send("Internal Server Error");
      }
    });
  });
}