#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🔍 Deployment Verification Checklist');
console.log('=====================================');

let allChecks = true;

// Check 1: dist/index.js exists
if (fs.existsSync('dist/index.js')) {
  const stats = fs.statSync('dist/index.js');
  console.log(`✅ dist/index.js exists (${Math.round(stats.size / 1024)}KB)`);
} else {
  console.log('❌ dist/index.js missing');
  allChecks = false;
}

// Check 2: dist/package.json exists with correct start script
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  if (pkg.scripts && pkg.scripts.start === 'NODE_ENV=production node index.js') {
    console.log('✅ dist/package.json has correct start script');
  } else {
    console.log('❌ dist/package.json missing or incorrect start script');
    allChecks = false;
  }
} else {
  console.log('❌ dist/package.json missing');
  allChecks = false;
}

// Check 3: Server listens on 0.0.0.0
const serverContent = fs.readFileSync('server/index-production.ts', 'utf8');
if (serverContent.includes('0.0.0.0')) {
  console.log('✅ Server configured to listen on 0.0.0.0');
} else {
  console.log('❌ Server not configured for 0.0.0.0');
  allChecks = false;
}

// Check 4: Production dependencies only
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  const devDeps = ['vite', '@vitejs/plugin-react', 'tsx', 'typescript'];
  const hasDevDeps = devDeps.some(dep => pkg.dependencies && pkg.dependencies[dep]);
  if (!hasDevDeps) {
    console.log('✅ Production package.json excludes dev dependencies');
  } else {
    console.log('❌ Production package.json includes dev dependencies');
    allChecks = false;
  }
}

// Check 5: Essential runtime dependencies included
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  const required = ['express', 'drizzle-orm', '@neondatabase/serverless'];
  const missing = required.filter(dep => !pkg.dependencies[dep]);
  if (missing.length === 0) {
    console.log('✅ All essential runtime dependencies included');
  } else {
    console.log(`❌ Missing dependencies: ${missing.join(', ')}`);
    allChecks = false;
  }
}

console.log('=====================================');
if (allChecks) {
  console.log('🎉 ALL DEPLOYMENT CHECKS PASSED');
  console.log('   Ready for Replit deployment!');
} else {
  console.log('⚠️  Some deployment checks failed');
  process.exit(1);
}