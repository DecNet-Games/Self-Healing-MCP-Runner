const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = path.join(__dirname, '../build/server.js');
const TEST_CWD = path.join(__dirname, 'doctor_test');

const server = spawn('node', [SERVER_PATH], {
    cwd: TEST_CWD // Run server *inside* the test dir so process.cwd() is correct
});

let buffer = '';

server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        try {
            const msg = JSON.parse(line);
            console.log('Received:', msg.id);

            if (msg.id === 0) {
                // Initialized, now call doctor
                const request = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "tools/call",
                    params: {
                        name: "project_doctor",
                        arguments: {}
                    }
                };
                server.stdin.write(JSON.stringify(request) + '\n');
            }
            
            if (msg.id === 1) {
                console.log('Doctor Result:', JSON.stringify(msg.result, null, 2));
                server.kill();
                process.exit(0);
            }

        } catch (e) {
            // console.error('Parse error:', e);
        }
    }
    buffer = lines[lines.length - 1];
});

// Initialize Handshake
const init = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-script", version: "1.0" }
    }
};

server.stdin.write(JSON.stringify(init) + '\n');

server.stderr.on('data', (d) => console.error('STDERR:', d.toString()));
