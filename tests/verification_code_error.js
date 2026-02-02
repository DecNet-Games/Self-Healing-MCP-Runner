// tests/verification_code_error.js
const fs = require('fs');
const path = require('path');
const { runWithSelfHealing } = require('../build/loop.js');

const TEST_DIR = path.join(__dirname, 'temp_error_env');
if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR);

const pkg = { name: "error-app", scripts: { "start": "node bad_code.js" } };
fs.writeFileSync(path.join(TEST_DIR, 'package.json'), JSON.stringify(pkg));

// Create a file with a Runtime Error (ReferenceError)
// and a Syntax Error to test both if needed. let's start with ReferenceError.
const badCode = `
console.log("Starting app...");
undefinedFunctionCall(); // This will throw ReferenceError
`;

fs.writeFileSync(path.join(TEST_DIR, 'bad_code.js'), badCode);

async function test() {
    console.log('🧪 Testing Code Error Detection...');
    // We expect exitCode 1, but with specific stderr info
    const result = await runWithSelfHealing('npm start', TEST_DIR);
    
    console.log('Exit Code (Should be 1):', result.exitCode);
    console.log('Stderr contains Diagnostic?', result.stderr.includes('[MCP DIAGNOSTIC]'));
    
    if (result.stderr.includes('[MCP DIAGNOSTIC]') && result.stderr.includes('bad_code.js')) {
        console.log('✅ SUCCESS: MCP detected code error and handed off to Agent.');
        console.log('Diagnostic Message:\n', result.stderr.split('[MCP DIAGNOSTIC]')[1]);
    } else {
        console.log('❌ FAILED: MCP did not return diagnostic.');
        console.log('Full Stderr:', result.stderr);
    }
}

test();
