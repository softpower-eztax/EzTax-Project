#!/usr/bin/env node
/**
 * Updates package.json to use the new deployment script
 */
import fs from 'fs';

console.log('Updating package.json build script...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.build = 'node deployment-ultimate-final.js';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Build script updated successfully');
console.log('Build command now uses: deployment-ultimate-final.js');