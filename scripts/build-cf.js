const { execSync } = require('child_process');

if (process.env.IN_OPENNEXT_BUILD === 'true') {
  // Inside the OpenNext build wrapper -> execute the actual Next.js build
  console.log('Executing inner Next.js production build...');
  execSync('next build', { stdio: 'inherit' });
} else {
  // Top-level build -> invoke opennextjs-cloudflare wrapper
  console.log('Starting top-level OpenNext Cloudflare build...');
  
  // Set the environment flag so the child process doesn't recurse
  const env = { ...process.env, IN_OPENNEXT_BUILD: 'true' };
  
  execSync('npx opennextjs-cloudflare build', { 
    stdio: 'inherit',
    env
  });
  console.log('OpenNext build completed successfully!');
}
