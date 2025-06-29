import { execSync } from 'child_process';
import fs from 'fs';

console.log('Fixing deployment build structure...');

// Step 1: Clean and create dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Step 2: Build frontend (this creates dist/public)
console.log('Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 3: Build backend directly with esbuild using production entry
console.log('Building backend...');
execSync(`npx esbuild server/index-production.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@neondatabase/serverless --external:express --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:passport-google-oauth20 --external:drizzle-orm --external:drizzle-zod --external:zod --external:nodemailer --external:stripe --external:@paypal/paypal-server-sdk --external:ws --external:openai --external:jspdf --external:date-fns --packages=external --define:process.env.NODE_ENV='"production"'`, { stdio: 'inherit' });

// Step 4: Create production package.json
console.log('Creating production package.json...');
const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const productionPackage = {
  name: originalPackage.name,
  version: originalPackage.version,
  type: "module",
  main: "index.js",
  scripts: {
    start: "NODE_ENV=production node index.js"
  },
  dependencies: {
    "@neondatabase/serverless": originalPackage.dependencies["@neondatabase/serverless"],
    "express": originalPackage.dependencies["express"],
    "express-session": originalPackage.dependencies["express-session"],
    "connect-pg-simple": originalPackage.dependencies["connect-pg-simple"],
    "passport": originalPackage.dependencies["passport"],
    "passport-local": originalPackage.dependencies["passport-local"],
    "passport-google-oauth20": originalPackage.dependencies["passport-google-oauth20"],
    "drizzle-orm": originalPackage.dependencies["drizzle-orm"],
    "drizzle-zod": originalPackage.dependencies["drizzle-zod"],
    "zod": originalPackage.dependencies["zod"],
    "nodemailer": originalPackage.dependencies["nodemailer"],
    "stripe": originalPackage.dependencies["stripe"],
    "@paypal/paypal-server-sdk": originalPackage.dependencies["@paypal/paypal-server-sdk"],
    "ws": originalPackage.dependencies["ws"],
    "openai": originalPackage.dependencies["openai"],
    "jspdf": originalPackage.dependencies["jspdf"],
    "date-fns": originalPackage.dependencies["date-fns"]
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

// Step 5: Verify required files exist
const requiredFiles = ['dist/index.js', 'dist/package.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('Missing required files:', missingFiles);
  process.exit(1);
}

console.log('✅ Deployment build structure fixed!');
console.log('Files created:');
console.log('- dist/index.js (production server)');
console.log('- dist/package.json (production deps)');
console.log('- dist/public/ (frontend assets)');