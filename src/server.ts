#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { runWithSelfHealing } from './loop.js';
import { memory } from './memory.js';
import { runDoctor } from './doctor.js';
import { runCommand } from './runner.js';

const server = new Server(
  {
    name: 'self-healing-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper for JSON Schema
const RunCommandSchema = {
    type: 'object',
    properties: {
        command: { type: 'string', description: 'The shell command to run' },
        cwd: { type: 'string', description: 'Working directory' }
    },
    required: ['command']
};

/**
 * Tools Definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'run_command',
          description: 'Execute a shell command with self-healing (auto-fix common errors).',
          inputSchema: RunCommandSchema,
        },
        {
          name: 'get_last_error',
          description: 'Get the last captured error from memory.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_fix_attempts',
          description: 'Get list of fixes attempted in the last session.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'project_doctor',
            description: 'Proactive Health Check: Scans project for missing files/configs.',
            inputSchema: { type: 'object', properties: {} } // CWD implied
        },
        {
            name: 'scan_and_fix',
            description: 'Magic Button: Auto-detect issues and apply fixes iteratively.',
            inputSchema: { 
                type: 'object', 
                properties: {
                    max_fixes: { type: 'number', description: 'Max fixes to apply (default 5)' }
                } 
            }
        }
      ],
    };
  });

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'run_command': {
      const { command, cwd } = request.params.arguments as { command: string; cwd?: string };
      if (!command) {
        throw new McpError(ErrorCode.InvalidParams, 'Command is required');
      }

      try {
        const result = await runWithSelfHealing(command, cwd);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ error: error.message }),
                }
            ],
            isError: true
        };
      }
    }

    case 'get_last_error':
        const lastError = memory.get().lastError || "No error recorded.";
        return {
            content: [{ type: 'text', text: lastError }]
        };

    case 'get_fix_attempts':
        const attempts = memory.get().fixAttempts;
        return {
            content: [{ type: 'text', text: JSON.stringify(attempts, null, 2) }]
        };

    case 'project_doctor': {
        const issues = runDoctor(process.cwd());
        return {
            content: [{ type: 'text', text: JSON.stringify(issues, null, 2) }]
        };
    }

    case 'scan_and_fix': {
        const issues = runDoctor(process.cwd());
        const report: string[] = [];
        
        if (issues.length === 0) {
            return { content: [{ type: 'text', text: "Project is healthy! No fixes needed." }] };
        }

        for (const issue of issues) {
            report.push(`Detected: ${issue.description}`);
            if (issue.fixCommand) {
                report.push(`Applying fix: ${issue.fixCommand}`);
                await runCommand(issue.fixCommand);
                report.push(`✅ Fixed.`);
            } else {
                report.push(`⚠️ No auto-fix available.`);
            }
        }

        return {
            content: [{ type: 'text', text: report.join('\n') }]
        };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, 'Unknown tool');
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
