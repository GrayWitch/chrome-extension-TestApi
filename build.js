const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = 'dist';
const files = {
  js: ['background.js', 'content.js', 'app.js', 'i18n.js', 'monaco-config.js'],
  css: ['app.css'],
  html: ['app.html']
};

console.log('Building API Inspector extension...\n');

// Clean dist directory - skip if locked, just overwrite files
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, maxRetries: 3, retryDelay: 500 });
    console.log('✓ Cleaned dist directory');
  } catch (e) {
    console.log('  Note: Could not delete dist (files in use), will overwrite existing files');
  }
}
fs.mkdirSync(distDir, { recursive: true });

// Copy icons
fs.cpSync('icons', path.join(distDir, 'icons'), { recursive: true });
console.log('✓ Copied icons');

// Copy monaco
fs.cpSync('monaco', path.join(distDir, 'monaco'), { recursive: true });
console.log('✓ Copied monaco');

// Minify JS files
files.js.forEach(file => {
  const outFile = file.replace('.js', '.min.js');
  try {
    execSync(`npx terser ${file} -o ${path.join(distDir, outFile)} -c -m`, { stdio: 'inherit' });
    console.log(`✓ Minified ${file} -> ${outFile}`);
  } catch (e) {
    console.error(`✗ Failed to minify ${file}`);
  }
});

// Fix content.js reference in background.min.js
const bgPath = path.join(distDir, 'background.min.js');
let bgContent = fs.readFileSync(bgPath, 'utf-8');
bgContent = bgContent.replace(/files:\["content\.js"\]/g, 'files:["content.min.js"]');
fs.writeFileSync(bgPath, bgContent);
console.log('✓ Fixed content.js reference in background.min.js');

// Minify CSS files
files.css.forEach(file => {
  const outFile = file.replace('.css', '.min.css');
  try {
    execSync(`npx cleancss -o ${path.join(distDir, outFile)} ${file}`, { stdio: 'inherit' });
    console.log(`✓ Minified ${file} -> ${outFile}`);
  } catch (e) {
    console.error(`✗ Failed to minify ${file}`);
  }
});

// Process HTML file - update references to minified files
files.html.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/app\.css/g, 'app.min.css');
  content = content.replace(/app\.js/g, 'app.min.js');
  content = content.replace(/i18n\.js/g, 'i18n.min.js');
  content = content.replace(/monaco-config\.js/g, 'monaco-config.min.js');
  fs.writeFileSync(path.join(distDir, file), content);
  console.log(`✓ Processed ${file}`);
});

// Generate manifest.json
const manifest = {
  manifest_version: 3,
  name: "API Inspector",
  version: "1.0.0",
  description: "拦截、查看、编辑和重放 API 请求",
  permissions: ["webRequest", "scripting", "activeTab", "tabs", "storage"],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "background.min.js"
  },
  action: {
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  web_accessible_resources: [
    {
      resources: ["monaco/vs/*"],
      matches: ["<all_urls>"]
    }
  ]
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log('✓ Generated manifest.json');

console.log('\n✅ Build complete! Output in dist/ directory');