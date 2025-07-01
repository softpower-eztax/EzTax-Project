#!/usr/bin/env node
/**
 * Build Verification Script - Ensures all deployment requirements are met
 */
import fs from 'fs';
import path from 'path';

console.log('🔍 DEPLOYMENT VERIFICATION STARTING...\n');

let allChecks = true;
const checks = [];

// Check 1: Verify dist/index.js exists and is valid
console.log('1️⃣ Checking dist/index.js...');
const indexPath = 'dist/index.js';
if (fs.existsSync(indexPath)) {
  const stats = fs.statSync(indexPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`   ✅ dist/index.js exists (${sizeKB}KB)`);
  checks.push({ name: 'dist/index.js exists', passed: true, size: sizeKB });
  
  // Verify it contains required elements
  const content = fs.readFileSync(indexPath, 'utf8');
  const hasExpressImport = content.includes("import express from 'express'");
  const hasPortConfig = content.includes('process.env.PORT');
  const hasHealthEndpoint = content.includes('/health');
  const hasErrorHandling = content.includes('error');
  
  if (hasExpressImport && hasPortConfig && hasHealthEndpoint && hasErrorHandling) {
    console.log('   ✅ Server code structure verified');
    checks.push({ name: 'Server structure valid', passed: true });
  } else {
    console.log('   ❌ Server code structure incomplete');
    checks.push({ name: 'Server structure valid', passed: false });
    allChecks = false;
  }
} else {
  console.log('   ❌ dist/index.js missing');
  checks.push({ name: 'dist/index.js exists', passed: false });
  allChecks = false;
}

// Check 2: Verify dist/package.json exists and is valid
console.log('\n2️⃣ Checking dist/package.json...');
const packagePath = 'dist/package.json';
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const hasStartScript = pkg.scripts?.start === 'NODE_ENV=production node index.js';
  const hasMainEntry = pkg.main === 'index.js';
  const hasEssentialDeps = pkg.dependencies?.express && pkg.dependencies?.['@neondatabase/serverless'];
  
  console.log(`   ✅ dist/package.json exists`);
  console.log(`   ${hasStartScript ? '✅' : '❌'} Start script: ${pkg.scripts?.start}`);
  console.log(`   ${hasMainEntry ? '✅' : '❌'} Main entry: ${pkg.main}`);
  console.log(`   ${hasEssentialDeps ? '✅' : '❌'} Essential dependencies present`);
  
  checks.push({ name: 'package.json valid', passed: hasStartScript && hasMainEntry && hasEssentialDeps });
  if (!(hasStartScript && hasMainEntry && hasEssentialDeps)) allChecks = false;
} else {
  console.log('   ❌ dist/package.json missing');
  checks.push({ name: 'package.json exists', passed: false });
  allChecks = false;
}

// Check 3: Verify frontend exists
console.log('\n3️⃣ Checking frontend files...');
const frontendPath = 'dist/public/index.html';
if (fs.existsSync(frontendPath)) {
  const stats = fs.statSync(frontendPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`   ✅ Frontend exists (${sizeKB}KB)`);
  checks.push({ name: 'Frontend exists', passed: true });
} else {
  console.log('   ❌ Frontend missing');
  checks.push({ name: 'Frontend exists', passed: false });
  allChecks = false;
}

// Check 4: Test server startup simulation
console.log('\n4️⃣ Testing server configuration...');
try {
  // Simulate server startup checks
  const serverContent = fs.readFileSync('dist/index.js', 'utf8');
  
  // Check for proper port binding
  const hasPortBinding = serverContent.includes('0.0.0.0');
  const hasErrorHandling = serverContent.includes('EADDRINUSE');
  const hasGracefulShutdown = serverContent.includes('SIGTERM');
  
  console.log(`   ${hasPortBinding ? '✅' : '❌'} Port binding to 0.0.0.0`);
  console.log(`   ${hasErrorHandling ? '✅' : '❌'} Port conflict handling`);
  console.log(`   ${hasGracefulShutdown ? '✅' : '❌'} Graceful shutdown`);
  
  const serverConfigValid = hasPortBinding && hasErrorHandling && hasGracefulShutdown;
  checks.push({ name: 'Server configuration', passed: serverConfigValid });
  if (!serverConfigValid) allChecks = false;
} catch (error) {
  console.log('   ❌ Server configuration test failed');
  checks.push({ name: 'Server configuration', passed: false });
  allChecks = false;
}

// Final verification summary
console.log('\n📊 VERIFICATION SUMMARY:');
console.log('========================');
checks.forEach(check => {
  const status = check.passed ? '✅ PASS' : '❌ FAIL';
  const size = check.size ? ` (${check.size}KB)` : '';
  console.log(`${status}: ${check.name}${size}`);
});

console.log(`\n🎯 Overall Status: ${allChecks ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);

if (allChecks) {
  console.log('\n🚀 DEPLOYMENT READY!');
  console.log('   All requirements satisfied');
  console.log('   Run: npm run start');
  console.log('   Health check: http://localhost:5000/health');
} else {
  console.log('\n⚠️  DEPLOYMENT NOT READY');
  console.log('   Please fix the failed checks above');
  process.exit(1);
}

export default { allChecks, checks };
