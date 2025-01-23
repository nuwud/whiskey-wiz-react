#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
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
  'next'
];

let errors = 0;
let warnings = 0;

// Check environment variables
console.log('\nChecking environment variables...');
const envPath = path.join(process.cwd(), '.env.local');
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
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`${colors.green}✓ ${file}${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Missing ${file}${colors.reset}`);
    errors++;
  }
});

// Check dependencies
console.log('\nChecking dependencies...');
const packageJson = require(path.join(process.cwd(), 'package.json'));
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
