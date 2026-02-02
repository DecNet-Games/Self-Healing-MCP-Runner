# Self-Healing MCP Runner 🩹

> **One-liner:** An MCP server that lets AI agents run builds, detect errors, auto-fix common issues, and retry until a working prototype is stable.

## 🧠 Core Philosophy
- **Agent's Job:** Decide.
- **MCP's Job:** Execute + Stabilize.
- **Human's Job:** Supervise (only if needed).

## 🚀 Features (MVP)

### 1. MCP Server Core
- Exposes tools: `run_command`, `get_last_error`, `get_fix_attempts`.
- No UI. No Auth. No Cloud. Pure execution.

### 2. Command Runner
- Runs shell commands: `npm install`, `npm run build`, `next build`, etc.
- Captures `stdout` + `stderr`.
- Returns structured JSON results.

### 3. Error Classification 🔍
- **Dependency missing**
- **TypeScript error**
- **Next.js config error**
- **Port already in use**
- **Env variable missing**
- *Implementation: Regex + String Matching (No ML).*

### 4. Auto-Fix Strategies 🛠️
- **Missing package** → `npm install <pkg>`
- **Port busy** → Assign new port
- **Missing env** → Create placeholder `.env`
- **TS Error** → Suggest patch

### 5. Self-Healing Loop 🔄
1. Run Command
2. Error Detected
3. Apply Fix
4. Re-run Command
5. (Max Retries: 3) → ✅ Stable or ❌ Hand off to human.

### 6. Context Memory
- Stores last command, error, and fix attempts in a local JSON file.
- No database.

### 7. Project Doctor (New 🩺)
- **Proactive Health Check:** Scans `package.json`, checks for lockfile consistency, and verifies TypeScript setup.
- **Output:** JSON report of issues.

### 8. Scan & Fix (Magic Button ✨)
- **Auto-pilot:** Runs the Doctor and automatically applies fixes for all detected issues.
- **Iterative:** Fixes issues one by one until the project is healthy.

## 📂 Folder Structure
```
self-healing-mcp/
├─ src/
│  ├─ server.ts        # MCP entry point
│  ├─ runner.ts        # Command execution
│  ├─ classify.ts      # Error regex matching
│  ├─ fixes.ts         # Fix strategies
│  ├─ loop.ts          # Retry logic
│  └─ memory.ts        # Simple state file
├─ examples/
│  └─ nextjs-demo.md
├─ package.json
└─ README.md
```

## 🛠️ Quick Start (Universal Config)

Add this to your **Claude Desktop** or **MCP Client** configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "self-healing-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "self-healing-mcp-vibe"
      ]
    }
  }
}
```

### 🩺 Manual Usage (CLI)
You can also run the doctor directly in your terminal:
```bash
npx self-healing-mcp-vibe
```
