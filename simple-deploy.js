#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

console.log('Creating clean deployment build...');

// Remove existing dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Build server only (no vite, no frontend)
console.log('Building server bundle...');
execSync(`npx esbuild server/index-production.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@neondatabase/serverless --external:express --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:passport-google-oauth20 --external:drizzle-orm --external:drizzle-zod --external:zod --external:nodemailer --external:stripe --external:@paypal/paypal-server-sdk --external:ws --external:openai --external:jspdf --external:date-fns --packages=external --minify`, { stdio: 'inherit' });

// Create minimal package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  type: "module",
  main: "index.js",
  scripts: { start: "node index.js" },
  dependencies: {
    "@neondatabase/serverless": pkg.dependencies["@neondatabase/serverless"],
    "express": pkg.dependencies["express"],
    "express-session": pkg.dependencies["express-session"],
    "connect-pg-simple": pkg.dependencies["connect-pg-simple"],
    "passport": pkg.dependencies["passport"],
    "passport-local": pkg.dependencies["passport-local"],
    "passport-google-oauth20": pkg.dependencies["passport-google-oauth20"],
    "drizzle-orm": pkg.dependencies["drizzle-orm"],
    "drizzle-zod": pkg.dependencies["drizzle-zod"],
    "zod": pkg.dependencies["zod"],
    "nodemailer": pkg.dependencies["nodemailer"],
    "stripe": pkg.dependencies["stripe"],
    "@paypal/paypal-server-sdk": pkg.dependencies["@paypal/paypal-server-sdk"],
    "ws": pkg.dependencies["ws"],
    "openai": pkg.dependencies["openai"],
    "jspdf": pkg.dependencies["jspdf"],
    "date-fns": pkg.dependencies["date-fns"]
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(prodPkg, null, 2));

// Verify
const size = fs.statSync('dist/index.js').size;
console.log(`Server bundle: ${Math.round(size/1024)}KB`);
console.log('Deployment files ready');