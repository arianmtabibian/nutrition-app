const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Force deploying latest changes to Vercel...');

try {
  // First, let's build locally to ensure everything works
  console.log('🔨 Building client locally...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  // Add a timestamp to force a new deployment
  const timestamp = new Date().toISOString();
  const deployMarker = `// Force deploy: ${timestamp}\n`;
  
  // Add timestamp to a file to force Vercel to recognize changes
  const indexPath = 'client/public/index.html';
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Remove any existing deploy marker
  indexContent = indexContent.replace(/<!-- Force deploy:.*? -->\n?/g, '');
  
  // Add new deploy marker
  indexContent = indexContent.replace('<head>', `<head>\n    <!-- Force deploy: ${timestamp} -->`);
  
  fs.writeFileSync(indexPath, indexContent);
  
  console.log('✅ Added deployment marker');
  console.log('📝 Timestamp:', timestamp);
  console.log('🚀 Ready for deployment!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Commit and push these changes to your Git repository');
  console.log('2. Or run: vercel --prod (if you have Vercel CLI)');
  console.log('3. Check that your custom domain points to the latest deployment');
  
} catch (error) {
  console.error('❌ Force deploy preparation failed:', error.message);
  process.exit(1);
}
