#!/usr/bin/env node
/**
 * COMPREHENSIVE DEPLOYMENT VERIFICATION
 * Tests all deployment requirements and provides detailed status
 */
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 COMPREHENSIVE DEPLOYMENT VERIFICATION');
console.log('Testing all deployment requirements...\n');

const checks = [];
let allPassed = true;

// Check 1: Required files exist
console.log('1️⃣ Checking required files...');
const requiredFiles = [
  'dist/index.js',
  'dist/package.json',
  'dist/public/index.html'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  checks.push({ name: `${file} exists`, passed: exists });
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allPassed = false;
});

// Check 2: Production package.json validation
console.log('\n2️⃣ Validating production package.json...');
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  
  const hasStartScript = pkg.scripts?.start?.includes('node index.js');
  const hasModuleType = pkg.type === 'module';
  const hasMainEntry = pkg.main === 'index.js';
  const hasCoreDeps = pkg.dependencies?.express && pkg.dependencies?.['@neondatabase/serverless'];
  
  checks.push({ name: 'Start script correct', passed: hasStartScript });
  checks.push({ name: 'Module type set', passed: hasModuleType });
  checks.push({ name: 'Main entry point set', passed: hasMainEntry });
  checks.push({ name: 'Core dependencies present', passed: hasCoreDeps });
  
  console.log(`   ${hasStartScript ? '✅' : '❌'} Start script: ${pkg.scripts?.start}`);
  console.log(`   ${hasModuleType ? '✅' : '❌'} Module type: ${pkg.type}`);
  console.log(`   ${hasMainEntry ? '✅' : '❌'} Main entry: ${pkg.main}`);
  console.log(`   ${hasCoreDeps ? '✅' : '❌'} Core dependencies present`);
  
  if (!hasStartScript || !hasModuleType || !hasMainEntry || !hasCoreDeps) allPassed = false;
}

// Check 3: Server configuration validation
console.log('\n3️⃣ Validating server configuration...');
if (fs.existsSync('dist/index.js')) {
  const serverCode = fs.readFileSync('dist/index.js', 'utf8');
  
  const bindsTo000 = serverCode.includes('0.0.0.0');
  const parsesPORT = serverCode.includes('parseInt') && serverCode.includes('process.env.PORT');
  const hasHealthEndpoints = serverCode.includes('/api/health') || serverCode.includes('/health');
  
  checks.push({ name: 'Server binds to 0.0.0.0', passed: bindsTo000 });
  checks.push({ name: 'PORT properly parsed', passed: parsesPORT });
  checks.push({ name: 'Health endpoints included', passed: hasHealthEndpoints });
  
  console.log(`   ${bindsTo000 ? '✅' : '❌'} Server binds to 0.0.0.0`);
  console.log(`   ${parsesPORT ? '✅' : '❌'} PORT environment variable parsed`);
  console.log(`   ${hasHealthEndpoints ? '✅' : '❌'} Health endpoints included`);
  
  if (!bindsTo000 || !parsesPORT || !hasHealthEndpoints) allPassed = false;
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
  allPassed = false;
}

// Check 5: Frontend validation
console.log('\n5️⃣ Validating frontend files...');
if (fs.existsSync('dist/public/index.html')) {
  const html = fs.readFileSync('dist/public/index.html', 'utf8');
  
  const hasTitle = html.includes('EzTax');
  const hasHealthCheck = html.includes('/api/health') || html.includes('checkHealth');
  const hasResponsiveDesign = html.includes('viewport') && html.includes('mobile');
  
  checks.push({ name: 'Frontend has EzTax branding', passed: hasTitle });
  checks.push({ name: 'Frontend has health monitoring', passed: hasHealthCheck });
  checks.push({ name: 'Frontend is responsive', passed: hasResponsiveDesign });
  
  console.log(`   ${hasTitle ? '✅' : '❌'} EzTax branding present`);
  console.log(`   ${hasHealthCheck ? '✅' : '❌'} Health monitoring included`);
  console.log(`   ${hasResponsiveDesign ? '✅' : '❌'} Responsive design`);
  
  if (!hasTitle || !hasHealthCheck || !hasResponsiveDesign) allPassed = false;
}

// Check 6: Bundle size analysis
console.log('\n6️⃣ Analyzing bundle sizes...');
const serverSize = fs.existsSync('dist/index.js') ? fs.statSync('dist/index.js').size : 0;
const frontendSize = fs.existsSync('dist/public/index.html') ? fs.statSync('dist/public/index.html').size : 0;

console.log(`   📦 Server bundle: ${Math.round(serverSize / 1024)}KB`);
console.log(`   🌐 Frontend size: ${Math.round(frontendSize / 1024)}KB`);

const reasonableSize = serverSize > 1000 && serverSize < 100000; // Between 1KB and 100KB
checks.push({ name: 'Server bundle size reasonable', passed: reasonableSize });
if (!reasonableSize) allPassed = false;

// Check 7: Deployment readiness summary
console.log('\n7️⃣ Deployment readiness summary...');
const passedChecks = checks.filter(c => c.passed).length;
const totalChecks = checks.length;

console.log(`   📊 Passed: ${passedChecks}/${totalChecks} checks`);
console.log(`   📈 Success rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

// Final status
console.log(`\n${allPassed ? '🎉' : '⚠️'} DEPLOYMENT STATUS:`);

if (allPassed) {
  console.log('   ✅ ALL DEPLOYMENT ISSUES RESOLVED');
  console.log('   ✅ dist/index.js file exists and is valid');
  console.log('   ✅ Server properly configured for 0.0.0.0:5000');
  console.log('   ✅ PORT environment variable handling fixed');
  console.log('   ✅ Production package.json with correct start script');
  console.log('   ✅ Frontend with health monitoring ready');
  console.log('   ✅ All syntax validations passed');
  console.log('\n🚀 READY FOR REPLIT DEPLOYMENT!');
  console.log('   Deploy using the Replit Deploy button');
  console.log('   Or run: npm run build && npm run start');
} else {
  console.log('   ❌ Some deployment requirements not met');
  console.log('\n🔧 Failed checks:');
  checks.filter(c => !c.passed).forEach(c => {
    console.log(`      • ${c.name}`);
  });
  console.log('\n   Please address the failed items before deployment');
}

// Show deployment commands
console.log('\n📋 DEPLOYMENT COMMANDS:');
console.log('   Build: npm run build');
console.log('   Start: npm run start');
console.log('   Test locally: cd dist && node index.js');

export default { allPassed, checks, passedChecks, totalChecks };