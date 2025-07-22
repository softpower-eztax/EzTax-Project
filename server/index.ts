import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  log("구글 로그인 설정 완료");
  
  const server = await registerRoutes(app);

  // Setup development or production environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler - must be last middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    log(`Error ${status} on ${req.method} ${req.path}: ${message}`);
    
    // Don't expose sensitive error details in production
    const responseMessage = process.env.NODE_ENV === "production" 
      ? (status === 500 ? "서버 오류가 발생했습니다" : message)
      : message;
    
    if (!res.headersSent) {
      res.status(status).json({ 
        message: responseMessage,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
      });
    }
  });

  // Start server on port 5000 or environment port
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    
    // Display access URLs based on environment
    if (process.env.REPLIT_DEV_DOMAIN) {
      log(`Replit Development URL: https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      log(`Replit Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    }
    
    log(`Local access: http://localhost:${port}`);
    log(`Local development file: file://${process.cwd()}/local-dev.html`);
  });
})();