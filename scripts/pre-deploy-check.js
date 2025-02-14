#!/usr/bin/env node

import { join } from 'path';
import fs from 'fs';
import process from 'process';

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Required environment variables - updated for Vite
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

// Required files
const requiredFiles = [
  '.env.local',
  'firebase.json',
  '.firebaserc'
];

// Required dependencies
const requiredDeps = [
  'firebase',
  'react',
  'react-dom',
  'vite'
];

let errors = 0;
let warnings = 0;

// Check environment variables
console.log('\nChecking environment variables...');
const envPath = join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  requiredEnvVars.forEach(envVar => {
    if (!envContent.includes(envVar)) {
      console.log(`${colors.red}❌ Missing ${envVar}${colors.reset}`);
      errors++;
    } else if (!envContent.match(new RegExp(`${envVar}=.+`))) {
      console.log(`${colors.yellow}⚠️  ${envVar} has no value${colors.reset}`);
      warnings++;
    } else {
      console.log(`${colors.green}✓ ${envVar}${colors.reset}`);
    }
  });
} else {
  console.log(`${colors.red}❌ Missing .env.local file${colors.reset}`);
  errors++;
}

// Check required files
console.log('\nChecking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(join(process.cwd(), file))) {
    console.log(`${colors.green}✓ ${file}${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Missing ${file}${colors.reset}`);
    errors++;
  }
});

// Check dependencies
console.log('\nChecking dependencies...');
const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`${colors.green}✓ ${dep}${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Missing ${dep}${colors.reset}`);
    errors++;
  }
});

// Summary
console.log('\nPre-deployment check summary:');
console.log(`${colors.red}Errors: ${errors}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);

if (errors > 0) {
  console.log('\n❌ Pre-deployment checks failed. Please fix errors before deploying.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Pre-deployment checks passed with warnings.');
} else {
  console.log('\n✓ All pre-deployment checks passed!');
}