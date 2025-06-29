import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production logging function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 80)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Production static file serving
function serveStatic(app: express.Express) {
  const publicDir = path.resolve(process.cwd(), "dist/public");
  
  app.use(express.static(publicDir, {
    maxAge: process.env.NODE_ENV === "production" ? "1y" : "0",
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

(async () => {
  // Initialize database if needed
  if ('initialize' in storage) {
    try {
      log("데이터베이스 초기화 시작");
      await (storage as any).initialize();
      log("데이터베이스 초기화 완료");
    } catch (error) {
      log(`데이터베이스 초기화 중 오류: ${error}`);
    }
  }

  // Setup authentication first
  setupAuth(app);
  log("인증 설정 완료");
  
  const server = await registerRoutes(app);

  // Setup production static file serving
  serveStatic(app);
  log("정적 파일 서빙 설정 완료");

  // Global error handler - must be last middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    log(`Error ${status} on ${req.method} ${req.path}: ${message}`);
    
    // Don't expose sensitive error details in production
    const responseMessage = status === 500 ? "서버 오류가 발생했습니다" : message;
    
    if (!res.headersSent) {
      res.status(status).json({ 
        message: responseMessage
      });
    }
  });

  // Start server on port 5000
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Production server running on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
  });
})();