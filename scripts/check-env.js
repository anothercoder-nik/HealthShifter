// Environment variable checker for production deployment
console.log('🔍 Environment Variables Check:');
console.log('================================');

const requiredVars = [
  'AUTH0_SECRET',
  'AUTH0_BASE_URL',
  'AUTH0_DOMAIN', 
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'DATABASE_URL'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue = ['SECRET', 'CLIENT_SECRET', 'DATABASE_URL'].some(s => varName.includes(s)) 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allGood = false;
  }
});

console.log('================================');
console.log(allGood ? '✅ All environment variables are set!' : '❌ Some environment variables are missing!');

// Check Auth0 URLs specifically
if (process.env.AUTH0_BASE_URL) {
  const baseUrl = process.env.AUTH0_BASE_URL;
  if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: AUTH0_BASE_URL still points to localhost in production!');
    console.log('   Should be: https://healthshifter-production.up.railway.app');
  }
}
