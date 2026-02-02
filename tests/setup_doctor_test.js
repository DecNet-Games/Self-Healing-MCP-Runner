const fs = require('fs');
const path = require('path');

const DIR = 'C:\\Users\\ANSH\\Self-Healing MCP Runner\\self-healing-mcp\\tests\\doctor_test';

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

// Empty dir = Doctor should scream "Missing package.json"
console.log('Setup doctor test complete (empty dir)');
