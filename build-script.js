const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting build process...');
console.log('📁 Current directory:', process.cwd());

try {
  // Install client dependencies from root
  console.log('📦 Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit', shell: true });
  
  // Build the React app from root
  console.log('🔨 Building React app...');
  execSync('cd client && npm run build', { stdio: 'inherit', shell: true });
  
  // Copy build output to root
  console.log('📋 Copying build output to root...');
  const buildPath = path.join(__dirname, 'client', 'build');
  const rootBuildPath = path.join(__dirname, 'build');
  
  if (fs.existsSync(rootBuildPath)) {
    fs.rmSync(rootBuildPath, { recursive: true, force: true });
  }
  
  // Use shell command for copying
  execSync(`cp -r "${buildPath}" "${rootBuildPath}"`, { stdio: 'inherit', shell: true });
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Build output copied to:', rootBuildPath);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
