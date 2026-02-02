# Next.js Auto-Fix Demo 演示

This document demonstrates how the Self-Healing MCP Runner handles a common Next.js scenario: **Missing Dependency**.

## Scenario
The Agent tries to start a Next.js app but forgot to install `next`.

### 1. Agent Request
```json
{
  "tool": "run_command",
  "arguments": {
    "command": "npm run dev"
  }
}
```

### 2. Execution (Attempt 1)
- **Command:** `npm run dev`
- **Output (stderr):**
  ```
  sh: next: command not found
  npm ERR! code ELIFECYCLE
  npm ERR! errno 1
  ```
- **MCP Analysis:**
  - `classifyError` detects: `DEPENDENCY_MISSING` (details: 'next' or command not found).
  - `getFixAction` returns: `npm install next` (heuristic).

### 3. Auto-Fix
- **MCP Action:** Executes `npm install next`.
- **Result:** Success (Exit code 0).

### 4. Wrapper Retry (Attempt 2)
- **Command:** `npm run dev`
- **Result:** Server starts on localhost:3000.
- **MCP Response to Agent:**
  ```json
  {
    "command": "npm run dev",
    "stdout": "ready - started server on 0.0.0.0:3000, url: http://localhost:3000",
    "exitCode": 0
  }
  ```

## Real-world Test
To verify this locally:
1. Create a dummy folder.
2. `npm init -y`
3. Add `"scripts": { "dev": "next dev" }` to package.json.
4. Do NOT install next.
5. Use `run_command` -> `npm run dev`.
6. Watch `self-healing-mcp` install `next` and succeed.
