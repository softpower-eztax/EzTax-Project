#!/usr/bin/env node
/**
 * Deployment Readiness Verification
 * Verifies all deployment requirements are met for Replit deployment
 */
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 VERIFYING DEPLOYMENT READINESS...\n');

const checks = [];

// Check 1: Required files exist
console.log('1️⃣ Checking required deployment files...');
const requiredFiles = [
  'dist/index.js',
  'dist/package.json',
  'dist/public/index.html'
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  checks.push({ name: `${file} exists`, passed: exists });
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
}

// Check 2: Server bundle size and quality
console.log('\n2️⃣ Checking server bundle...');
if (fs.existsSync('dist/index.js')) {
  const size = fs.statSync('dist/index.js').size;
  const sizeKB = Math.round(size / 1024);
  const sizeOK = size > 1000;
  checks.push({ name: 'Server bundle size adequate', passed: sizeOK });
  console.log(`   ${sizeOK ? '✅' : '❌'} Bundle size: ${sizeKB}KB`);
}

// Check 3: Production package.json structure
console.log('\n3️⃣ Checking production package.json...');
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  
  const hasStartScript = pkg.scripts?.start?.includes('node index.js');
  const hasModuleType = pkg.type === 'module';
  const hasMainEntry = pkg.main === 'index.js';
  const hasExpress = pkg.dependencies?.express;
  
  checks.push({ name: 'Start script correct', passed: hasStartScript });
  checks.push({ name: 'Module type set', passed: hasModuleType });
  checks.push({ name: 'Main entry point set', passed: hasMainEntry });
  checks.push({ name: 'Express dependency included', passed: !!hasExpress });
  
  console.log(`   ${hasStartScript ? '✅' : '❌'} Start script: ${pkg.scripts?.start}`);
  console.log(`   ${hasModuleType ? '✅' : '❌'} Module type: ${pkg.type}`);
  console.log(`   ${hasMainEntry ? '✅' : '❌'} Main entry: ${pkg.main}`);
  console.log(`   ${hasExpress ? '✅' : '❌'} Express dependency: ${pkg.dependencies?.express || 'missing'}`);
}

// Check 4: Server syntax validation
console.log('\n4️⃣ Testing server syntax...');
try {
  execSync('node --check dist/index.js', { stdio: 'pipe' });
  checks.push({ name: 'Server syntax valid', passed: true });
  console.log('   ✅ Server syntax validation passed');
} catch (error) {
  checks.push({ name: 'Server syntax valid', passed: false });
  console.log('   ❌ Server syntax validation failed');
}

// Check 5: Port binding configuration
console.log('\n5️⃣ Checking server configuration...');
const serverContent = fs.readFileSync('dist/index.js', 'utf8');
const bindsTo0000 = serverContent.includes('0.0.0.0');
const hasErrorHandling = serverContent.includes('uncaughtException');
const hasGracefulShutdown = serverContent.includes('SIGTERM');

checks.push({ name: 'Binds to 0.0.0.0', passed: bindsTo0000 });
checks.push({ name: 'Error handling implemented', passed: hasErrorHandling });
checks.push({ name: 'Graceful shutdown handling', passed: hasGracefulShutdown });

console.log(`   ${bindsTo0000 ? '✅' : '❌'} Server binds to 0.0.0.0`);
console.log(`   ${hasErrorHandling ? '✅' : '❌'} Error handling implemented`);
console.log(`   ${hasGracefulShutdown ? '✅' : '❌'} Graceful shutdown handling`);

// Check 6: Build command updated
console.log('\n6️⃣ Checking build configuration...');
const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildCmdUpdated = rootPkg.scripts.build.includes('deployment-comprehensive-fix.js');
checks.push({ name: 'Build command updated', passed: buildCmdUpdated });
console.log(`   ${buildCmdUpdated ? '✅' : '❌'} Build command: ${rootPkg.scripts.build}`);

// Summary
console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
console.log('═'.repeat(50));

const passedChecks = checks.filter(check => check.passed).length;
const totalChecks = checks.length;
const allPassed = passedChecks === totalChecks;

console.log(`Checks passed: ${passedChecks}/${totalChecks}`);

if (allPassed) {
  console.log('\n🎉 ALL DEPLOYMENT REQUIREMENTS MET!');
  console.log('✅ Your application is ready for Replit deployment');
  console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
  console.log('   1. Run: npm run build');
  console.log('   2. Deploy to Replit');
  console.log('   3. Replit will run: npm run start');
  console.log('\n💡 The deployment will use:');
  console.log('   • dist/index.js as the production server');
  console.log('   • PORT environment variable for dynamic port assignment');
  console.log('   • 0.0.0.0 binding for proper port forwarding');
  console.log('   • Error handling to prevent crash loops');
} else {
  console.log('\n❌ DEPLOYMENT NOT READY');
  console.log('Please fix the failed checks before deploying.');
  
  const failedChecks = checks.filter(check => !check.passed);
  console.log('\nFailed checks:');
  failedChecks.forEach(check => {
    console.log(`   ❌ ${check.name}`);
  });
}

console.log('\n' + '═'.repeat(50));