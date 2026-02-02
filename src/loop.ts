import fs from 'fs';
import { runCommand, CommandResult } from './runner.js';
import { classifyError } from './classify.js';
import { getFixAction } from './fixes.js';
import { memory } from './memory.js';
// import chalk from 'chalk'; 
// import ora from 'ora';

export async function runWithSelfHealing(command: string, cwd: string = process.cwd()): Promise<CommandResult> {
    let attempts = 0;
    const MAX_RETRIES = 3;
    let currentCommand = command;

    memory.clear();
    memory.update({ lastCommand: command });

    while (attempts <= MAX_RETRIES) {
        // console.error(`[MCP Loop] Attempt ${attempts + 1}/${MAX_RETRIES + 1}: ${currentCommand}`);
        
        const result = await runCommand(currentCommand, cwd);

        if (result.exitCode === 0) {
            // console.error('[MCP Loop] Success');
            return result;
        }

        // Error detected
        // console.error('[MCP Loop] Command failed. Analyzing...');
        
        const classification = classifyError(result.stderr, result.stdout);
        // console.error(`[MCP Loop] Detected Error: ${classification.type} ${classification.details || ''}`);

        memory.update({ lastError: JSON.stringify(classification) });

        if (classification.type === 'UNKNOWN') {
            // console.error('[MCP Loop] Unknown error. No auto-fix available.');
            return result; 
        }

        if (classification.type === 'CODE_ERROR') {
            // console.error(`   🛑 Code Error Detected: ${classification.details}`);
            // console.error(`   👉 Handing off to Agent.`);
            result.stderr += `\n\n[MCP DIAGNOSTIC] Code Error detected in ${classification.file || 'unknown'}:${classification.line || '?'}.\nReason: ${classification.details}\nRecommendation: Agent, please edit this file to fix the logic error.`;
            return result;
        }

        const fix = getFixAction(classification);
        if (!fix) {
            // console.error('[MCP Loop] No fix strategy for this error.');
            return result;
        }

        // Apply fix
        // console.error(`[MCP Loop] Applying fix: ${fix.description}`);
        memory.addFixAttempt(fix.description);

        if (fix.fileEdit) {
            try {
                fs.writeFileSync(fix.fileEdit.path, fix.fileEdit.content, { flag: 'a+' });
            } catch (err: any) {
                // console.error(`[MCP Loop] File edit failed: ${err.message}`);
                return result;
            }
        } else if (fix.command) {
            const fixResult = await runCommand(fix.command, cwd);
            if (fixResult.exitCode !== 0) {
                // console.error(`[MCP Loop] Fix command failed: ${fixResult.stderr}`);
            }
        }

        attempts++;
    }

    return {
        command,
        stdout: '',
        stderr: 'Max retries exceeded.',
        exitCode: 1
    };
}
