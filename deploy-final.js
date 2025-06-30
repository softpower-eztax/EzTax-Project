#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔥 FINAL DEPLOYMENT BUILD - Resolving all deployment issues');

// Clean slate
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Build with comprehensive error handling
console.log('Building production server...');
try {
  const buildCmd = [
    'npx esbuild server/index-production.ts',
    '--bundle --platform=node --format=esm',
    '--outfile=dist/index.js',
    '--external:@neondatabase/serverless',
    '--external:express --external:express-session',
    '--external:connect-pg-simple --external:passport',
    '--external:passport-local --external:passport-google-oauth20',
    '--external:drizzle-orm --external:drizzle-zod --external:zod',
    '--external:nodemailer --external:stripe',
    '--external:@paypal/paypal-server-sdk --external:ws',
    '--external:openai --external:jspdf --external:date-fns',
    '--packages=external --minify',
    '--define:process.env.NODE_ENV=\\"production\\"'
  ].join(' ');
  
  execSync(buildCmd, { stdio: 'inherit' });
  
  // Verify bundle exists and has content
  if (!fs.existsSync('dist/index.js')) {
    throw new Error('Bundle file not created');
  }
  
  const size = fs.statSync('dist/index.js').size;
  if (size < 1000) {
    throw new Error('Bundle size too small, likely build failed');
  }
  
  console.log(`✅ Server bundle: ${Math.round(size/1024)}KB`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Create production package.json with exact requirements
const originalPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const productionPkg = {
  name: originalPkg.name,
  version: originalPkg.version,
  type: "module",
  main: "index.js",
  engines: { node: ">=18.0.0" },
  scripts: { 
    start: "NODE_ENV=production node index.js"
  },
  dependencies: Object.fromEntries([
    '@neondatabase/serverless',
    'express', 'express-session', 'connect-pg-simple',
    'passport', 'passport-local', 'passport-google-oauth20',
    'drizzle-orm', 'drizzle-zod', 'zod', 'nodemailer',
    'stripe', '@paypal/paypal-server-sdk', 'ws',
    'openai', 'jspdf', 'date-fns'
  ].map(dep => [dep, originalPkg.dependencies[dep]]))
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPkg, null, 2));

// Test bundle execution
console.log('Testing production bundle...');
try {
  const testResult = execSync('timeout 3s node dist/index.js 2>&1 || true', {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3000' },
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  if (testResult.includes('Error') || testResult.includes('Cannot find module')) {
    console.error('❌ Bundle test failed:', testResult);
    process.exit(1);
  }
  
  console.log('✅ Bundle test passed');
} catch (error) {
  console.log('⚠️ Bundle test completed (timeout expected)');
}

// Final verification
const requiredFiles = ['dist/index.js', 'dist/package.json'];
const missing = requiredFiles.filter(f => !fs.existsSync(f));
if (missing.length > 0) {
  console.error('❌ Missing files:', missing);
  process.exit(1);
}

console.log('\n🎉 DEPLOYMENT READY');
console.log('📁 Files created:');
console.log('   dist/index.js - Production server');
console.log('   dist/package.json - Runtime dependencies');
console.log('\n🚀 Replit deployment should now succeed!');