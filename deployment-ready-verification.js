#!/usr/bin/env node
/**
 * FINAL DEPLOYMENT VERIFICATION - COMPREHENSIVE TESTING
 * Tests production server startup and all endpoints to ensure deployment readiness
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

console.log('🔬 FINAL DEPLOYMENT VERIFICATION STARTING...\n');

// Step 1: Verify all required files exist
console.log('1️⃣ Verifying deployment files...');
const requiredFiles = [
  'dist/index.js',
  'dist/package.json', 
  'dist/public/index.html'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   ✅ ${file} exists (${sizeKB}KB)`);
  } else {
    console.log(`   ❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Deployment files missing - run npm run build first');
  process.exit(1);
}

// Step 2: Test production server startup
console.log('\n2️⃣ Testing production server startup...');

const testServer = () => {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/index.js'], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production', PORT: '5001' }
    });

    let serverStarted = false;
    let startupTimeout;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`   📡 ${output.trim()}`);
      
      if (output.includes('Server ready for deployment')) {
        serverStarted = true;
        clearTimeout(startupTimeout);
        
        // Test health endpoint
        setTimeout(() => {
          testHealthEndpoints()
            .then(() => {
              console.log('   ✅ Production server test completed');
              serverProcess.kill('SIGTERM');
              resolve(true);
            })
            .catch((error) => {
              console.log(`   ❌ Health check failed: ${error.message}`);
              serverProcess.kill('SIGTERM');
              reject(error);
            });
        }, 2000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.log(`   ⚠️ ${data.toString().trim()}`);
    });

    serverProcess.on('error', (error) => {
      console.log(`   ❌ Server startup failed: ${error.message}`);
      reject(error);
    });

    // Timeout after 15 seconds
    startupTimeout = setTimeout(() => {
      if (!serverStarted) {
        console.log('   ❌ Server startup timeout');
        serverProcess.kill('SIGTERM');
        reject(new Error('Server startup timeout'));
      }
    }, 15000);
  });
};

const testHealthEndpoints = () => {
  return new Promise((resolve, reject) => {
    const testEndpoint = (path, expectedStatus = 200) => {
      return new Promise((res, rej) => {
        const req = http.get(`http://localhost:5001${path}`, (response) => {
          let data = '';
          
          response.on('data', chunk => {
            data += chunk;
          });
          
          response.on('end', () => {
            if (response.statusCode === expectedStatus) {
              try {
                const jsonData = JSON.parse(data);
                console.log(`   ✅ ${path}: ${response.statusCode} - ${jsonData.status || 'OK'}`);
                res(jsonData);
              } catch (e) {
                console.log(`   ✅ ${path}: ${response.statusCode} - Response received`);
                res(data);
              }
            } else {
              console.log(`   ❌ ${path}: ${response.statusCode}`);
              rej(new Error(`Unexpected status: ${response.statusCode}`));
            }
          });
        });
        
        req.on('error', (error) => {
          console.log(`   ❌ ${path}: Connection failed - ${error.message}`);
          rej(error);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          rej(new Error('Request timeout'));
        });
      });
    };

    Promise.all([
      testEndpoint('/health'),
      testEndpoint('/api/health'),
      testEndpoint('/') // Frontend
    ])
    .then(() => resolve())
    .catch(reject);
  });
};

// Step 3: Run the test
testServer()
  .then(() => {
    console.log('\n🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
    console.log('========================================');
    console.log('✅ All deployment files present');
    console.log('✅ Production server starts successfully');
    console.log('✅ Health endpoints respond correctly');
    console.log('✅ Frontend serves properly');
    console.log('\n🚀 READY FOR REPLIT DEPLOYMENT!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build');
    console.log('2. Deploy to Replit');
    console.log('3. Test deployed URL endpoints');
  })
  .catch((error) => {
    console.log('\n❌ DEPLOYMENT VERIFICATION FAILED!');
    console.log('=====================================');
    console.log(`Error: ${error.message}`);
    console.log('\nPlease fix the issues and run verification again.');
    process.exit(1);
  });