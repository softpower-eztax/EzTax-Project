import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { log, serveStaticProduction } from "./utils";

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
  log("인증 설정 완료");
  
  const server = await registerRoutes(app);

  // Use production static file serving (no Vite)
  serveStaticProduction(app);
  log("Production static file serving setup complete");

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

  // Start server - use PORT from environment or find available port
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Handle port conflicts gracefully
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is busy, trying port ${port + 1}...`);
      setTimeout(() => {
        server.close();
        server.listen(port + 1, "0.0.0.0", () => {
          log(`Production server running on port ${port + 1}`);
          log(`Environment: ${process.env.NODE_ENV || 'production'}`);
        });
      }, 1000);
    } else {
      log(`Server error: ${err.message}`);
      throw err;
    }
  });

  server.listen(port, "0.0.0.0", () => {
    log(`Production server running on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  });
})();