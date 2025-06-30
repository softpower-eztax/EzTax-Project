#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 MINIMAL DEPLOYMENT BUILD - Creating dist/index.js');

// Step 1: Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('dist/public', { recursive: true });

// Step 2: Build server bundle (main requirement)
console.log('Building production server bundle...');
try {
  execSync(`npx esbuild server/index-production.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@neondatabase/serverless --external:express --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:passport-google-oauth20 --external:drizzle-orm --external:drizzle-zod --external:zod --external:nodemailer --external:stripe --external:@paypal/paypal-server-sdk --external:ws --external:openai --external:jspdf --external:date-fns --packages=external --define:process.env.NODE_ENV='"production"' --minify`, { stdio: 'inherit' });
  console.log('✅ Server bundle created');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

// Step 3: Create production package.json
console.log('Creating production package.json...');
const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const productionPackage = {
  name: originalPackage.name,
  version: originalPackage.version,
  type: "module",
  main: "index.js",
  engines: { node: ">=18.0.0" },
  scripts: { start: "NODE_ENV=production node index.js" },
  dependencies: {
    "@neondatabase/serverless": originalPackage.dependencies["@neondatabase/serverless"],
    "express": originalPackage.dependencies["express"],
    "express-session": originalPackage.dependencies["express-session"],
    "connect-pg-simple": originalPackage.dependencies["connect-pg-simple"],
    "passport": originalPackage.dependencies["passport"],
    "passport-local": originalPackage.dependencies["passport-local"],
    "passport-google-oauth20": originalPackage.dependencies["passport-google-oauth20"],
    "drizzle-orm": originalPackage.dependencies["drizzle-orm"],
    "drizzle-zod": originalPackage.dependencies["drizzle-zod"],
    "zod": originalPackage.dependencies["zod"],
    "nodemailer": originalPackage.dependencies["nodemailer"],
    "stripe": originalPackage.dependencies["stripe"],
    "@paypal/paypal-server-sdk": originalPackage.dependencies["@paypal/paypal-server-sdk"],
    "ws": originalPackage.dependencies["ws"],
    "openai": originalPackage.dependencies["openai"],
    "jspdf": originalPackage.dependencies["jspdf"],
    "date-fns": originalPackage.dependencies["date-fns"]
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

// Step 4: Create minimal fallback frontend
console.log('Creating minimal frontend fallback...');
const minimalHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzTax - 세금 계산 및 은퇴 준비</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .logo { font-size: 2.5em; font-weight: bold; color: #3b82f6; margin-bottom: 20px; }
        .tagline { color: #64748b; margin-bottom: 30px; font-size: 1.1em; }
        .loading { 
            width: 40px; height: 40px; border: 3px solid #f3f4f6; 
            border-top: 3px solid #3b82f6; border-radius: 50%;
            animation: spin 1s linear infinite; margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .button {
            display: inline-block; background: #3b82f6; color: white; 
            padding: 12px 24px; text-decoration: none; border-radius: 8px;
            margin: 10px; transition: background 0.3s;
        }
        .button:hover { background: #2563eb; }
        .status { color: #10b981; font-weight: 500; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">EzTax</div>
        <div class="tagline">세금 계산 및 은퇴 준비 플랫폼</div>
        <div class="loading"></div>
        <div class="status">서비스 시작 중...</div>
        <div style="margin-top: 30px;">
            <a href="/" class="button">홈페이지</a>
            <a href="/login" class="button">로그인</a>
        </div>
        <script>
            // Check if main app is available
            fetch('/api/user').then(() => {
                window.location.reload();
            }).catch(() => {
                setTimeout(() => window.location.reload(), 3000);
            });
        </script>
    </div>
</body>
</html>`;

fs.writeFileSync('dist/public/index.html', minimalHtml);

// Step 5: Verify build
const requiredFiles = ['dist/index.js', 'dist/package.json', 'dist/public/index.html'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing files:', missingFiles);
  process.exit(1);
}

const serverSize = Math.round(fs.statSync('dist/index.js').size / 1024);
console.log(`✅ Build complete! Server bundle: ${serverSize}KB`);
console.log('📁 Ready for deployment with:');
console.log('   - dist/index.js (production server)');
console.log('   - dist/package.json (dependencies)');
console.log('   - dist/public/index.html (fallback UI)');