import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building production application...');

// Step 1: Clean dist directory
console.log('1️⃣ Cleaning dist directory...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Step 2: Build frontend with Vite
console.log('2️⃣ Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 3: Build backend with esbuild using production entry point
console.log('3️⃣ Building backend server...');

const result = await build({
  entryPoints: ['server/index-production.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    // Node.js built-ins
    'fs', 'path', 'http', 'https', 'crypto', 'os', 'url', 'querystring', 
    'stream', 'util', 'events', 'buffer', 'child_process', 'net', 'tls',
    // Production dependencies (will be installed via package.json)
    '@neondatabase/serverless',
    'pg', 'drizzle-orm', 'drizzle-zod', 'zod',
    'express', 'express-session', 'connect-pg-simple',
    'passport', 'passport-local', 'passport-google-oauth20',
    'nodemailer', 'stripe', '@paypal/paypal-server-sdk',
    'ws', 'openai', 'jspdf', 'date-fns'
  ],
  packages: 'external',
  banner: {
    js: `// Production Server Entry Point
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);`
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: true,
  sourcemap: false,
  metafile: true
});

// Step 4: Create production package.json
console.log('4️⃣ Creating production package.json...');

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

// Step 5: Verify build output
console.log('5️⃣ Verifying build output...');

const requiredFiles = ['dist/index.js', 'dist/package.json', 'dist/public/index.html'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles);
  process.exit(1);
}

console.log('✅ Production build completed successfully!');
console.log('📁 Build output:');
console.log('   - dist/index.js (server entry point)');
console.log('   - dist/package.json (production dependencies)');
console.log('   - dist/public/ (frontend assets)');

if (result.errors?.length > 0) {
  console.error('❌ Build errors:', result.errors);
  process.exit(1);
}

if (result.warnings?.length > 0) {
  console.warn('⚠️ Build warnings:', result.warnings);
}

console.log('🎉 Ready for deployment!');