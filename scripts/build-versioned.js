import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const version = pkg.version;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const buildName = `v${version}_${timestamp}`;
const releaseDir = path.join(rootDir, 'releases', buildName);

console.log(`🚀 Starting versioned build: ${buildName}...`);

try {
    // 1. Run the standard build
    console.log('📦 Running vite build...');
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

    // 2. Ensure releases directory exists
    if (!fs.existsSync(path.join(rootDir, 'releases'))) {
        fs.mkdirSync(path.join(rootDir, 'releases'));
    }

    // 3. Create unique version directory
    fs.mkdirSync(releaseDir, { recursive: true });

    // 4. Copy dist content to release directory
    const distDir = path.join(rootDir, 'dist');
    
    function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (let entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    console.log(`📂 Archiving build to ${releaseDir}...`);
    copyDir(distDir, releaseDir);

    // 5. Create a "latest" symlink or record file
    fs.writeFileSync(path.join(rootDir, 'releases', 'latest.txt'), buildName);

    console.log(`✅ Build Complete! Version archived in: /releases/${buildName}`);
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}
