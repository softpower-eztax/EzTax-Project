import { execSync } from 'child_process';
import fs from 'fs';

console.log('Building minimal production version...');

try {
  // Create dist directory
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Build backend without Vite dependencies
  console.log('Building production server...');
  execSync(`esbuild server/index-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --define:process.env.NODE_ENV='"production"'`, { stdio: 'inherit' });

  console.log('✅ Production server built successfully');
  console.log('   - Vite dependencies excluded from bundle');
  console.log('   - Static file serving configured for production');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}