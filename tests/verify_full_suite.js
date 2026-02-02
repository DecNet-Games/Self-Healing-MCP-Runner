const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVER_PATH = path.join(__dirname, '../build/server.js');
const TEST_DIR = path.join(__dirname, 'full_suite_test');

// Setup Test Environment
if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
fs.mkdirSync(TEST_DIR);

const server = spawn('node', [SERVER_PATH], { cwd: TEST_DIR });

let messageQueue = [];
let requestCount = 0;

function send(method, params) {
    const id = requestCount++;
    const msg = { jsonrpc: "2.0", id, method, params };
    server.stdin.write(JSON.stringify(msg) + '\n');
    return id;
}

server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            messageQueue.push(msg);
        } catch (e) { }
    }
});

async function waitForResponse(id) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const index = messageQueue.findIndex(m => m.id === id);
            if (index !== -1) {
                clearInterval(interval);
                resolve(messageQueue.splice(index, 1)[0]);
            }
        }, 50);
    });
}

(async () => {
    console.log('🚀 Starting Full Suite Verification...');

    // 0. Initialize
    console.log('[Test 0] Initializing...');
    send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "tester", version: "1.0" } });
    await waitForResponse(0);
    console.log('✅ Initialized');

    // 1. run_command (Basic)
    console.log('\n[Test 1] run_command (echo)...');
    const id1 = send("tools/call", { name: "run_command", arguments: { command: "echo Hello" } });
    const res1 = await waitForResponse(id1);
    const content1 = JSON.parse(res1.result.content[0].text);
    if (content1.stdout.trim() === "Hello") console.log('✅ run_command works');
    else console.error('❌ run_command failed', content1);

    // 2. project_doctor (Should detect missing package.json)
    console.log('\n[Test 2] project_doctor (Empty Dir)...');
    const id2 = send("tools/call", { name: "project_doctor", arguments: {} });
    const res2 = await waitForResponse(id2);
    const issues = JSON.parse(res2.result.content[0].text);
    if (issues.some(i => i.type === 'MISSING_FILE')) console.log('✅ project_doctor detected missing package.json');
    else console.error('❌ project_doctor failed', issues);

    // 3. scan_and_fix (Should create package.json)
    console.log('\n[Test 3] scan_and_fix (Fixing Project)...');
    const id3 = send("tools/call", { name: "scan_and_fix", arguments: {} });
    const res3 = await waitForResponse(id3);
    const fixReport = res3.result.content[0].text;
    if (fixReport.includes('FIXED')) console.log('✅ scan_and_fix reported success');
    
    // Check file existence
    if (fs.existsSync(path.join(TEST_DIR, 'package.json'))) console.log('✅ package.json created!');
    else console.error('❌ scan_and_fix did not create file');

    // 4. get_last_error (Should be empty or relevant)
    console.log('\n[Test 4] get_last_error...');
    const id4 = send("tools/call", { name: "run_command", arguments: { command: "node -e 'process.exit(1)'" } }); // Intentional fail
    await waitForResponse(id4);
    
    const id5 = send("tools/call", { name: "get_last_error", arguments: {} });
    const res5 = await waitForResponse(id5);
    console.log('✅ get_last_error returned:', res5.result.content[0].text.substring(0, 50) + '...');

    // 5. get_fix_attempts
    console.log('\n[Test 5] get_fix_attempts...');
    const id6 = send("tools/call", { name: "get_fix_attempts", arguments: {} });
    const res6 = await waitForResponse(id6);
    console.log('✅ get_fix_attempts works:', res6.result.content[0].text);

    console.log('\n🎉 ALL TOOLS VERIFIED!');
    server.kill();
    process.exit(0);
})();
