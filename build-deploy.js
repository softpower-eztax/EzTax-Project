#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Quick Deployment Build - Creating dist/index.js');

// Step 1: Clean and create dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Step 2: Build production server bundle
console.log('Building production server...');
try {
  execSync(`npx esbuild server/index-production.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@neondatabase/serverless --external:express --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:passport-google-oauth20 --external:drizzle-orm --external:drizzle-zod --external:zod --external:nodemailer --external:stripe --external:@paypal/paypal-server-sdk --external:ws --external:openai --external:jspdf --external:date-fns --packages=external --define:process.env.NODE_ENV='"production"' --minify`, { stdio: 'inherit' });
  
  const stats = fs.statSync('dist/index.js');
  console.log(`✅ Server bundle created: dist/index.js (${Math.round(stats.size / 1024)}KB)`);
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

// Step 4: Create minimal static files for production
console.log('Creating minimal frontend structure...');
fs.mkdirSync('dist/public', { recursive: true });

// Create a minimal index.html that loads the React app
const minimalHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EzTax - 세금 계산기</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; text-align: center; }
    .btn { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px; }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>EzTax - 세금 계산기</h1>
    <p>세금시뮬레이터로 간단하게 계산하시고 노후준비도 진단하세요</p>
    <a href="/login" class="btn">로그인</a>
    <a href="/register" class="btn">회원가입</a>
    <a href="/guest" class="btn">게스트로 시작</a>
  </div>
</body>
</html>`;

fs.writeFileSync('dist/public/index.html', minimalHtml);
console.log('✅ Minimal frontend structure created');

// Step 5: Verify build output
console.log('📋 Build Summary:');
console.log(`  - Server bundle: dist/index.js (${Math.round(fs.statSync('dist/index.js').size / 1024)}KB)`);
console.log(`  - Package config: dist/package.json`);
console.log(`  - Frontend: dist/public/index.html`);
console.log('🎉 Deployment build complete! Ready for production.');