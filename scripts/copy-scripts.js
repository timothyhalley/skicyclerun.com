// Build script to copy scripts to public directory
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const scriptsDir = path.join(__dirname, "..", "src", "scripts");
const publicScriptsDir = path.join(__dirname, "..", "public", "scripts");

// Log the directories for debugging
console.log("📁 Source scripts directory:", scriptsDir);
console.log("📁 Target public scripts directory:", publicScriptsDir);

// Create public/scripts directory if it doesn't exist
if (!fs.existsSync(publicScriptsDir)) {
  console.log("🆕 Creating public/scripts directory...");
  fs.mkdirSync(publicScriptsDir, { recursive: true });
} else {
  console.log("✓ Public scripts directory already exists");
}

// Clean target directory to avoid stale files
for (const filename of fs.readdirSync(publicScriptsDir)) {
  const full = path.join(publicScriptsDir, filename);
  try {
    fs.unlinkSync(full);
    console.log(`🧹 Removed stale ${filename}`);
  } catch {}
}

// Only copy the single, supported script.
const scriptFiles = ["simple-auth-icon.js"];
console.log("📋 Files to copy:", scriptFiles);

for (const file of scriptFiles) {
  const srcPath = path.join(scriptsDir, file);
  const destPath = path.join(publicScriptsDir, file);

  console.log(`🔍 Checking ${file}...`);
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file} to public/scripts`);
    } catch (error) {
      console.error(`❌ Error copying ${file}:`, error);
    }
  } else {
    console.error(`❌ Source file not found: ${srcPath}`);
  }
}

console.log("✨ Script copying complete!");
