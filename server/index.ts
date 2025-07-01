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

  // Add a fallback route for the root path AFTER vite setup
  app.get('*', (req, res) => {
    if (req.path === '/' || req.path === '/index.html') {
      res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzTax - 간편한 세금 신고 시스템</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
        <div class="text-center">
            <h1 class="text-4xl md:text-5xl font-bold text-blue-600 mb-4">EzTax ✅</h1>
            <p class="text-xl md:text-2xl font-bold text-gray-700 mb-2">세상쉬운 세금계산 세상귀한 노후준비</p>
            <p class="text-lg md:text-xl text-gray-600 mb-8" style="font-family: Georgia, serif;">Less Tax, More Wealth</p>
            <p class="text-lg text-gray-700 mb-8">세금시뮬레이터로 간단하게 계산하시고 노후준비도 진단하세요.</p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto mb-12">
                <button onclick="alert('세금시뮬레이터 기능이 곧 활성화됩니다!')" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
                    세금시뮬레이터(Tax Simulator)
                </button>
                <button onclick="alert('은퇴준비상태진단 기능이 곧 활성화됩니다!')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
                    은퇴준비상태진단
                </button>
            </div>
            
            <div class="mt-12 grid md:grid-cols-4 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="text-blue-500 mb-2">
                        <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">간편한 절차</h3>
                    <p class="text-gray-600">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="text-blue-500 mb-2">
                        <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">최대 공제 혜택</h3>
                    <p class="text-gray-600">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="text-blue-500 mb-2">
                        <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">최적의 은퇴전략 제안</h3>
                    <p class="text-gray-600">개인 맞춤형 은퇴 계획과 세금 최적화 전략을 제공합니다.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="text-blue-500 mb-2">
                        <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">안전하고 비공개적</h3>
                    <p class="text-gray-600">귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
      `);
    } else {
      res.status(404).send('Page not found');
    }
  });

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

  // Start server on port 5000
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`Direct access: https://${process.env.REPLIT_DEV_DOMAIN || '3e18f96e-0fbf-4af6-b766-cfbae9f2437b-00-17nnd6cbvtwuy.janeway.replit.dev'}`);
    log(`Local access: http://localhost:${port}`);
    log(`Local development file: file://${process.cwd()}/local-dev.html`);
  });
})();