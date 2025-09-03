const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Preparing project for Vercel deployment...');

try {
  // Create a clean deployment directory
  const deployDir = path.join(__dirname, '.vercel-deploy');
  
  // Clean up any existing deployment directory
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir);
  
  // Copy client files to root of deployment directory
  console.log('📁 Copying client files to deployment root...');
  execSync(`xcopy "client\\*" "${deployDir}\\" /E /I /Y`, { stdio: 'inherit', shell: true });
  
  // Copy necessary configuration files
  console.log('📁 Copying configuration files...');
  execSync(`copy "client\\package.json" "${deployDir}\\"`, { stdio: 'inherit', shell: true });
  execSync(`copy "client\\tsconfig.json" "${deployDir}\\"`, { stdio: 'inherit', shell: true });
  execSync(`copy "client\\tailwind.config.js" "${deployDir}\\"`, { stdio: 'inherit', shell: true });
  execSync(`copy "client\\postcss.config.js" "${deployDir}\\"`, { stdio: 'inherit', shell: true });
  execSync(`copy "client\\.nvmrc" "${deployDir}\\"`, { stdio: 'inherit', shell: true });
  
  // Create production environment file
  console.log('📝 Creating production environment file...');
  const envContent = 'REACT_APP_API_URL=https://your-render-backend-url.onrender.com\n';
  fs.writeFileSync(path.join(deployDir, '.env.production'), envContent);
  
  // Create a simple vercel.json for the deployment directory
  console.log('📝 Creating deployment vercel.json...');
  const vercelConfig = {
    "framework": "create-react-app",
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  };
  fs.writeFileSync(
    path.join(deployDir, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  
  // Create a simple build script for Windows
  console.log('📝 Creating build script...');
  const buildScript = `@echo off
echo 🚀 Starting build process...
npm install
npm run build
echo ✅ Build completed!`;
  fs.writeFileSync(path.join(deployDir, 'build.bat'), buildScript);
  
  console.log('✅ Project prepared for Vercel deployment!');
  console.log('📁 Deployment files are in:', deployDir);
  console.log('🚀 You can now deploy this directory to Vercel');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Go to Vercel dashboard');
  console.log('2. Import the .vercel-deploy directory as a new project');
  console.log('3. Set the build command to: build.bat');
  console.log('4. Set the output directory to: build');
  console.log('5. Deploy!');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
