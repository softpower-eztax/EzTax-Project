#!/usr/bin/env node
// Production build wrapper for npm run build
import { execSync } from 'child_process';

console.log('🚀 Running production build for deployment...');
execSync('node build-deployment-minimal.js', { stdio: 'inherit' });