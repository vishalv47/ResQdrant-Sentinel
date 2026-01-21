// ================================================================
// ResQdrant Backend - Environment Verification Script
// ================================================================
// Run this to check if your .env is configured correctly
// Usage: node verify-env.js
// ================================================================

require('dotenv').config();

console.log('');
console.log('🔍 ResQdrant Backend - Environment Verification');
console.log('================================================');
console.log('');

let errors = 0;
let warnings = 0;

// ================================================================
// CHECK 1: .env File Exists
// ================================================================
const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('❌ CHECK 1: .env file NOT FOUND');
  console.log('   Solution: cp .env.example .env');
  console.log('');
  errors++;
} else {
  console.log('✅ CHECK 1: .env file exists');
}

// ================================================================
// CHECK 2: MONGO_URI Defined
// ================================================================
if (!process.env.MONGO_URI) {
  console.log('❌ CHECK 2: MONGO_URI is undefined');
  console.log('   Solution: Add MONGO_URI to your .env file');
  console.log('');
  errors++;
} else {
  console.log('✅ CHECK 2: MONGO_URI is defined');
}

// ================================================================
// CHECK 3: No Placeholder Passwords
// ================================================================
if (process.env.MONGO_URI && 
    (process.env.MONGO_URI.includes('YOUR_PASSWORD') ||
     process.env.MONGO_URI.includes('your-password') ||
     process.env.MONGO_URI.includes('<password>'))) {
  console.log('❌ CHECK 3: Placeholder password detected!');
  console.log('   Your MONGO_URI still contains: YOUR_PASSWORD');
  console.log('   Solution: Replace with your actual MongoDB password');
  console.log('');
  errors++;
} else if (process.env.MONGO_URI) {
  console.log('✅ CHECK 3: No placeholder passwords');
}

// ================================================================
// CHECK 4: Connection String Format
// ================================================================
if (process.env.MONGO_URI) {
  const uri = process.env.MONGO_URI;
  
  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    console.log('❌ CHECK 4: Invalid MongoDB URI format');
    console.log('   Should start with: mongodb+srv:// or mongodb://');
    console.log('');
    errors++;
  } else {
    console.log('✅ CHECK 4: Valid URI prefix');
  }
  
  // Check for database name
  if (!uri.includes('.net/') && !uri.includes('.com/')) {
    console.log('⚠️  WARNING: Database name might be missing');
    console.log('   URI should include /resqdrant after .net or .com');
    console.log('   Example: ...mongodb.net/resqdrant?retryWrites=true');
    console.log('');
    warnings++;
  } else {
    const dbMatch = uri.match(/\.net\/([^?]+)/);
    if (dbMatch && dbMatch[1]) {
      console.log(`✅ CHECK 5: Database name found: "${dbMatch[1]}"`);
    } else {
      console.log('⚠️  WARNING: No database name after .net/');
      warnings++;
    }
  }
}

// ================================================================
// CHECK 6: Port Configuration
// ================================================================
const port = process.env.PORT || 5000;
console.log(`✅ CHECK 6: PORT configured: ${port}`);

// ================================================================
// CHECK 7: OpenAI API Key (Optional)
// ================================================================
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-api-key')) {
  console.log('⚠️  CHECK 7: OpenAI API key not configured (optional)');
  console.log('   Backend will work with keyword detection only');
  console.log('   Add OPENAI_API_KEY to .env to enable AI');
  console.log('');
} else {
  console.log('✅ CHECK 7: OpenAI API key configured');
  console.log('   AI-assisted classification enabled');
}

// ================================================================
// CHECK 8: Node Environment
// ================================================================
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`✅ CHECK 8: NODE_ENV: ${nodeEnv}`);

// ================================================================
// SUMMARY
// ================================================================
console.log('');
console.log('================================================');
console.log('📊 VERIFICATION SUMMARY');
console.log('================================================');
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}`);
console.log('');

if (errors === 0 && warnings === 0) {
  console.log('🎉 PERFECT! Your .env is fully configured!');
  console.log('');
  console.log('Next steps:');
  console.log('1. npm run dev');
  console.log('2. Open: http://localhost:5000/api/health');
  console.log('3. Check MongoDB connection');
  console.log('');
} else if (errors === 0) {
  console.log('✅ GOOD! No critical errors.');
  console.log(`⚠️  ${warnings} warning(s) - backend should still work`);
  console.log('');
  console.log('You can start the backend:');
  console.log('npm run dev');
  console.log('');
} else {
  console.log('❌ CRITICAL ERRORS FOUND!');
  console.log(`   Fix ${errors} error(s) before starting the backend.`);
  console.log('');
  console.log('Quick fix guide:');
  console.log('1. Make sure .env file exists: cp .env.example .env');
  console.log('2. Edit .env and replace YOUR_PASSWORD with real password');
  console.log('3. Run this script again: node verify-env.js');
  console.log('');
  process.exit(1);
}

// ================================================================
// SHOW CURRENT CONFIGURATION (Sanitized)
// ================================================================
if (process.env.MONGO_URI) {
  console.log('📋 CURRENT CONFIGURATION (Sanitized)');
  console.log('================================================');
  
  // Hide password in output
  let sanitizedURI = process.env.MONGO_URI;
  const match = sanitizedURI.match(/\/\/([^:]+):([^@]+)@/);
  if (match) {
    const username = match[1];
    const password = match[2];
    sanitizedURI = sanitizedURI.replace(password, '***HIDDEN***');
    console.log(`Username: ${username}`);
    console.log(`Password: ***HIDDEN*** (${password.length} characters)`);
  }
  
  const serverMatch = sanitizedURI.match(/@([^/]+)/);
  if (serverMatch) {
    console.log(`Server: ${serverMatch[1]}`);
  }
  
  const dbMatch = sanitizedURI.match(/\.net\/([^?]+)/);
  if (dbMatch && dbMatch[1]) {
    console.log(`Database: ${dbMatch[1]}`);
  }
  
  console.log('');
  console.log('Full URI (sanitized):');
  console.log(sanitizedURI);
  console.log('');
}

console.log('================================================');
console.log('');
