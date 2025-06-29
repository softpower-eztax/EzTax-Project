import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production application...');

// Step 1: Build frontend with Vite
console.log('1. Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 2: Build backend with esbuild, excluding Vite dependencies
console.log('2. Building backend...');

const result = await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    // Exclude Vite and related dependencies from bundle
    'vite',
    '@vitejs/*',
    'rollup',
    'esbuild',
    // Keep Node.js built-ins external
    'fs',
    'path',
    'http',
    'https',
    'crypto',
    'os',
    'url',
    'querystring',
    'stream',
    'util',
    'events',
    'buffer',
    'child_process',
    // Keep database and other runtime dependencies external
    '@neondatabase/serverless',
    'pg',
    'drizzle-orm',
    'express',
    'passport',
    'nodemailer',
    'stripe',
    'ws'
  ],
  packages: 'external',
  banner: {
    js: `
// Production build - Vite dependencies excluded
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
`
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: false, // Keep readable for debugging
  sourcemap: true,
  metafile: true,
});

// Step 3: Create a package.json for production dependencies
console.log('3. Creating production package.json...');

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
    // Only include runtime dependencies, exclude dev tools
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
    "@stripe/stripe-js": originalPackage.dependencies["@stripe/stripe-js"],
    "@paypal/paypal-server-sdk": originalPackage.dependencies["@paypal/paypal-server-sdk"],
    "ws": originalPackage.dependencies["ws"],
    "openai": originalPackage.dependencies["openai"],
    "jspdf": originalPackage.dependencies["jspdf"],
    "date-fns": originalPackage.dependencies["date-fns"]
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

console.log('4. Build complete!');
console.log('Build analysis:', result.metafile);

if (result.errors?.length > 0) {
  console.error('Build errors:', result.errors);
  process.exit(1);
}

if (result.warnings?.length > 0) {
  console.warn('Build warnings:', result.warnings);
}

console.log('Production build ready in ./dist/');