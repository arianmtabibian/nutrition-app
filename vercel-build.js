const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Vercel build process...');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 Script location:', __dirname);
console.log('🔧 Platform:', process.platform);
console.log('🔧 Node version:', process.version);
console.log('🔧 NPM version:', execSync('npm --version', { encoding: 'utf8' }).trim());

try {
  // Change to client directory
  const clientPath = path.join(__dirname, 'client');
  console.log('📁 Client directory path:', clientPath);
  
  if (!fs.existsSync(clientPath)) {
    throw new Error(`Client directory not found at: ${clientPath}`);
  }
  
  process.chdir(clientPath);
  console.log('📁 Changed to client directory:', process.cwd());
  
  // List contents of client directory
  console.log('📋 Client directory contents:', fs.readdirSync('.').join(', '));
  
  // Create production environment file
  const envPath = path.join(process.cwd(), '.env.production');
  console.log('📝 Creating production environment file at:', envPath);
  
  // You can update this URL to your actual backend URL
  const envContent = 'REACT_APP_API_URL=https://nutrition-back-jtf3.onrender.com\n';
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created successfully');
  
  // Always install dependencies fresh (don't try to clean first)
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
  
  // Verify react-scripts is available
  const reactScriptsPath = path.join(process.cwd(), 'node_modules', '.bin', 'react-scripts');
  console.log('🔍 React scripts path:', reactScriptsPath);
  console.log('🔍 React scripts exists:', fs.existsSync(reactScriptsPath));
  
  if (process.platform === 'win32') {
    const reactScriptsWinPath = path.join(process.cwd(), 'node_modules', '.bin', 'react-scripts.cmd');
    console.log('🔍 React scripts Windows path:', reactScriptsWinPath);
    console.log('🔍 React scripts Windows exists:', fs.existsSync(reactScriptsWinPath));
  }
  
  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
  
  // Verify build output
  const buildPath = path.join(process.cwd(), 'build');
  if (fs.existsSync(buildPath)) {
    console.log('✅ Build output verified at:', buildPath);
    console.log('📋 Build output contents:', fs.readdirSync(buildPath).join(', '));
  } else {
    throw new Error('Build output not found after build completion');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
