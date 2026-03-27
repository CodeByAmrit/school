const fs = require("fs");
const path = require("path");

const dirsToScan = ["app.js", "routes", "controllers", "middleware"];

function processDir(dirPath) {
  const fullPath = path.join(__dirname, dirPath);

  if (fs.statSync(fullPath).isFile()) {
    processFile(fullPath);
    return;
  }

  const files = fs.readdirSync(fullPath);
  for (const file of files) {
    const filePath = path.join(fullPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDir(path.join(dirPath, file));
    } else if (filePath.endsWith(".js") || filePath.endsWith(".ejs")) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;

  // Replace components -> controllers
  content = content.replace(
    /require\(['"](\.\.\/|\.\/|\.\.\/\.\.\/)components\/(.*?)['"]\)/g,
    "require('$1controllers/$2')",
  );
  // Replace router -> routes
  content = content.replace(
    /require\(['"](\.\.\/|\.\/|\.\.\/\.\.\/)router\/(.*?)['"]\)/g,
    "require('$1routes/$2')",
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated imports in: ${filePath}`);
  }
}

dirsToScan.forEach(processDir);
console.log("Done scanning and updating imports.");
