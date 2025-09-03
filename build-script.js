const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting build process...');

try {
  // Change to client directory
  process.chdir(path.join(__dirname, 'client'));
  console.log('📁 Changed to client directory:', process.cwd());
  
  // Install dependencies
  console.log('📦 Installing client dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build the React app
  console.log('🔨 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Copy build output to root
  console.log('📋 Copying build output to root...');
  const buildPath = path.join(__dirname, 'client', 'build');
  const rootBuildPath = path.join(__dirname, 'build');
  
  if (fs.existsSync(rootBuildPath)) {
    fs.rmSync(rootBuildPath, { recursive: true, force: true });
  }
  
  execSync(`cp -r "${buildPath}" "${rootBuildPath}"`, { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Build output copied to:', rootBuildPath);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
