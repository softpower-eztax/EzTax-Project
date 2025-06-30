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
    
    // Create minimal fallback structure for production
    log(`Creating minimal static file structure at ${publicDir}`);
    fs.mkdirSync(publicDir, { recursive: true });
    
    const fallbackHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzTax</title>
    <style>
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        h1 { color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>EzTax</h1>
        <p>세금계산 및 은퇴준비 애플리케이션</p>
        <p>서버가 성공적으로 시작되었습니다.</p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(publicDir, "index.html"), fallbackHtml);
    log(`Created fallback static files at ${publicDir}`);
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