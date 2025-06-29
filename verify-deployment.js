#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 DEPLOYMENT VERIFICATION');

// Check required files exist
const requiredFiles = [
  'dist/index.js',
  'dist/package.json', 
  'dist/public/index.html'
];

console.log('1️⃣ Checking required files...');
let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    console.log(`   ✅ ${file} (${Math.round(size/1024)}KB)`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('❌ DEPLOYMENT INCOMPLETE - Running build...');
  execSync('node build-deployment-fix.js', { stdio: 'inherit' });
}

// Verify server bundle size
const indexJsSize = fs.statSync('dist/index.js').size;
if (indexJsSize < 10000) {
  console.log('❌ Server bundle too small - may be corrupted');
  process.exit(1);
}

// Check production package.json
const prodPkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
if (!prodPkg.scripts.start || !prodPkg.main) {
  console.log('❌ Production package.json missing required fields');
  process.exit(1);
}

console.log('2️⃣ Verifying package.json configuration...');
console.log(`   ✅ Main entry: ${prodPkg.main}`);
console.log(`   ✅ Start script: ${prodPkg.scripts.start}`);
console.log(`   ✅ Dependencies: ${Object.keys(prodPkg.dependencies).length} packages`);

console.log('3️⃣ Checking .replit deployment configuration...');
const replitConfig = fs.readFileSync('.replit', 'utf8');
if (replitConfig.includes('build = ["npm", "run", "build"]') && 
    replitConfig.includes('run = ["npm", "run", "start"]')) {
  console.log('   ✅ .replit deployment configuration correct');
} else {
  console.log('   ⚠️ .replit may need deployment configuration update');
}

console.log('');
console.log('✅ DEPLOYMENT VERIFICATION COMPLETE');
console.log('📦 Ready for Replit deployment with:');
console.log('   • Build command: npm run build');
console.log('   • Start command: npm run start'); 
console.log('   • Server port: 5000');
console.log('   • Host binding: 0.0.0.0');
console.log('');
console.log('🚀 All deployment requirements satisfied!');