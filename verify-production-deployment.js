#!/usr/bin/env node
/**
 * PRODUCTION DEPLOYMENT VERIFICATION
 * Comprehensive testing of production deployment readiness
 */
import fs from 'fs';
import { spawn } from 'child_process';

console.log('🔍 VERIFYING PRODUCTION DEPLOYMENT...\n');

const checks = [];

// Check 1: Required files exist
console.log('1️⃣ Checking required files...');
const requiredFiles = [
  'dist/index.js',
  'dist/package.json',
  'dist/public/index.html',
  'dist/public/manifest.json'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const size = exists ? fs.statSync(file).size : 0;
  checks.push({ 
    name: `${file} exists (${size} bytes)`, 
    passed: exists && size > 0 
  });
  console.log(`   ${exists && size > 0 ? '✅' : '❌'} ${file} (${size} bytes)`);
});

// Check 2: Package.json validation
console.log('\n2️⃣ Validating package.json...');
if (fs.existsSync('dist/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
  
  const packageChecks = [
    { name: 'Start script exists', check: !!pkg.scripts?.start },
    { name: 'Start script correct', check: pkg.scripts?.start === 'NODE_ENV=production node index.js' },
    { name: 'Module type set', check: pkg.type === 'module' },
    { name: 'Main entry point', check: pkg.main === 'index.js' },
    { name: 'Express dependency', check: !!pkg.dependencies?.express },
    { name: 'Node engine specified', check: !!pkg.engines?.node }
  ];
  
  packageChecks.forEach(check => {
    checks.push({ name: check.name, passed: check.check });
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
  });
}

// Check 3: Server code validation
console.log('\n3️⃣ Validating server code...');
if (fs.existsSync('dist/index.js')) {
  const serverCode = fs.readFileSync('dist/index.js', 'utf8');
  
  const serverChecks = [
    { name: 'Binds to 0.0.0.0', check: serverCode.includes('0.0.0.0') },
    { name: 'Uses PORT env var', check: serverCode.includes('process.env.PORT') },
    { name: 'Has health endpoint', check: serverCode.includes('/health') },
    { name: 'Has API health endpoint', check: serverCode.includes('/api/health') },
    { name: 'Has error handling', check: serverCode.includes('error, req, res, next') },
    { name: 'Has graceful shutdown', check: serverCode.includes('SIGTERM') }
  ];
  
  serverChecks.forEach(check => {
    checks.push({ name: check.name, passed: check.check });
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
  });
}

// Check 4: Production server test
console.log('\n4️⃣ Testing production server startup...');

const testServer = () => {
  return new Promise((resolve) => {
    const server = spawn('node', ['index.js'], {
      cwd: 'dist',
      env: { ...process.env, PORT: '9000' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    // Give server time to start
    setTimeout(() => {
      server.kill();
      
      const startupChecks = [
        { name: 'Server starts without errors', check: !output.includes('Error') && !output.includes('error') },
        { name: 'Logs startup message', check: output.includes('EzTax Production Server') },
        { name: 'Shows port binding', check: output.includes('running on port') },
        { name: 'Shows ready message', check: output.includes('ready for deployment') }
      ];
      
      startupChecks.forEach(check => {
        checks.push({ name: check.name, passed: check.check });
        console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
      });
      
      resolve();
    }, 3000);
  });
};

await testServer();

// Final summary
console.log('\n📊 DEPLOYMENT VERIFICATION SUMMARY');
console.log('==================================');

const passedChecks = checks.filter(c => c.passed).length;
const totalChecks = checks.length;
const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${successRate}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
  console.log('🚀 Production build is ready for Replit deployment');
  console.log('\n📋 Next steps:');
  console.log('   1. Click the Deploy button in Replit');
  console.log('   2. Choose "Autoscale" deployment');
  console.log('   3. Deployment will use: npm run build && npm start');
} else {
  console.log(`\n⚠️  ${totalChecks - passedChecks} issues found`);
  console.log('❌ Some deployment requirements not satisfied');
  
  const failedChecks = checks.filter(c => !c.passed);
  console.log('\nFailed checks:');
  failedChecks.forEach(check => {
    console.log(`   • ${check.name}`);
  });
}

console.log(`\n📦 Production bundle info:`);
if (fs.existsSync('dist/index.js')) {
  const size = fs.statSync('dist/index.js').size;
  console.log(`   • Server bundle: ${Math.round(size / 1024)}KB`);
}
if (fs.existsSync('dist/public/index.html')) {
  const size = fs.statSync('dist/public/index.html').size;
  console.log(`   • Frontend: ${Math.round(size / 1024)}KB`);
}