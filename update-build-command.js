#!/usr/bin/env node
/**
 * Updates package.json build command to use the working deployment script
 */
import fs from 'fs';

console.log('Updating package.json build command...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.build = 'node deployment-final-working.js';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Build command updated to use deployment-final-working.js');
console.log('💡 You can now run: npm run build && npm run start');