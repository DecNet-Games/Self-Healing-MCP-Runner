const fs = require('fs');
const path = require('path');

const DIR = 'C:\\Users\\ANSH\\Self-Healing MCP Runner\\self-healing-mcp\\tests\\live_mcp_test';

const pkg = {
  "name": "live-test-app",
  "version": "1.0.0",
  "scripts": { "start": "node index.js" }
};

const code = `
const { v4: uuidv4 } = require('uuid');
console.log('UUID Generated: ' + uuidv4());
`;

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'package.json'), JSON.stringify(pkg, null, 2));
fs.writeFileSync(path.join(DIR, 'index.js'), code);
console.log('Setup complete');
