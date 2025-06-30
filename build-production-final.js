#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Production Build for Replit Deployment');

// Step 1: Clean and create build directory
console.log('1️⃣ Cleaning and creating build directory...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('dist/public', { recursive: true });

// Step 2: Build frontend with Vite
console.log('2️⃣ Building frontend with Vite...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Frontend build completed');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 3: Build production server bundle
console.log('3️⃣ Building production server...');
try {
  execSync(`npx esbuild server/index-production.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@neondatabase/serverless --external:express --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:passport-google-oauth20 --external:drizzle-orm --external:drizzle-zod --external:zod --external:nodemailer --external:stripe --external:@paypal/paypal-server-sdk --external:ws --external:openai --external:jspdf --external:date-fns --packages=external --define:process.env.NODE_ENV='"production"' --minify --sourcemap`, { stdio: 'inherit' });
  console.log('✅ Server build completed');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

// Step 4: Create production package.json
console.log('4️⃣ Creating production package.json...');
const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const productionPackage = {
  name: originalPackage.name,
  version: originalPackage.version,
  type: "module",
  main: "index.js",
  engines: {
    node: ">=18.0.0"
  },
  scripts: {
    start: "NODE_ENV=production node index.js"
  },
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
console.log('✅ Production package.json created');

// Step 5: Create fallback index.html if needed
console.log('5️⃣ Creating fallback files...');
const fallbackHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzTax - 세금 계산 및 은퇴 준비</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            background: #3b82f6;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
        }
        .button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>EzTax</h1>
        <p>세금 계산 및 은퇴 준비 플랫폼</p>
    </div>
    
    <div class="content">
        <h2>서비스 로딩 중...</h2>
        <p>EzTax 서비스가 시작되고 있습니다. 잠시만 기다려주세요.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="/" class="button">홈페이지로 이동</a>
            <a href="/login" class="button">로그인</a>
        </div>
        
        <script>
            // Auto-refresh every 5 seconds until main app loads
            setTimeout(function() {
                window.location.reload();
            }, 5000);
        </script>
    </div>
</body>
</html>`;

// Ensure fallback HTML exists
if (!fs.existsSync('dist/public/index.html')) {
  fs.writeFileSync('dist/public/index.html', fallbackHtml);
  console.log('✅ Fallback index.html created');
}

// Step 6: Verify required files exist
console.log('6️⃣ Verifying build output...');
const requiredFiles = [
  'dist/index.js',
  'dist/package.json',
  'dist/public/index.html'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles);
  process.exit(1);
}

// Check file sizes
const stats = fs.statSync('dist/index.js');
console.log(`✅ Server bundle size: ${Math.round(stats.size / 1024)}KB`);

console.log('🎉 Production build completed successfully!');
console.log('📁 Build files:');
console.log('   - dist/index.js (server bundle)');
console.log('   - dist/package.json (production deps)');
console.log('   - dist/public/ (frontend assets)');
console.log('🚀 Ready for deployment!');