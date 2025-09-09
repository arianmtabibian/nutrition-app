const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Preparing project for Vercel deployment...');

try {
  // Create a temporary deployment structure
  const deployDir = path.join(__dirname, '.vercel-deploy');
  
  // Clean up any existing deployment directory
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir);
  
  // Copy client files to root of deployment directory
  console.log('📁 Copying client files to deployment root...');
  execSync(`cp -r client/* "${deployDir}/"`, { stdio: 'inherit', shell: true });
  
  // Copy server files to server subdirectory
  console.log('📁 Copying server files...');
  fs.mkdirSync(path.join(deployDir, 'server'));
  execSync(`cp -r server/* "${deployDir}/server/"`, { stdio: 'inherit', shell: true });
  
  // Copy root files
  console.log('📁 Copying root files...');
  execSync(`cp package.json "${deployDir}/"`, { stdio: 'inherit', shell: true });
  execSync(`cp vercel.json "${deployDir}/"`, { stdio: 'inherit', shell: true });
  execSync(`cp README.md "${deployDir}/"`, { stdio: 'inherit', shell: true });
  
  // Create a new package.json for deployment
  console.log('📝 Creating deployment package.json...');
  const clientPackagePath = path.join(__dirname, 'client', 'package.json');
  const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
  
  const deployPackage = {
    name: "nutrition-app-deploy",
    version: "1.0.0",
    private: true,
    dependencies: clientPackage.dependencies,
    scripts: {
      "build": "react-scripts build",
      "start": "react-scripts start"
    },
    browserslist: clientPackage.browserslist,
    eslintConfig: clientPackage.eslintConfig
  };
  
  fs.writeFileSync(
    path.join(deployDir, 'package.json'),
    JSON.stringify(deployPackage, null, 2)
  );
  
  // Copy other necessary client files
  console.log('📁 Copying additional client files...');
  execSync(`cp client/tsconfig.json "${deployDir}/"`, { stdio: 'inherit', shell: true });
  execSync(`cp client/tailwind.config.js "${deployDir}/"`, { stdio: 'inherit', shell: true });
  execSync(`cp client/postcss.config.js "${deployDir}/"`, { stdio: 'inherit', shell: true });
  
  console.log('✅ Project prepared for Vercel deployment!');
  console.log('📁 Deployment files are in:', deployDir);
  console.log('🚀 You can now deploy this directory to Vercel');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}







