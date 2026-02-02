import { spawn } from 'child_process';

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

/**
 * Runs a shell command and returns the output.
 * Minimal implementation using native child_process.
 */
export async function runCommand(command: string, cwd: string = process.cwd()): Promise<CommandResult> {
  return new Promise((resolve) => {
    // Split command into cmd and args for spawn
    // Simple splitting by space - complex commands might need executing via shell: true
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const shellArgs = process.platform === 'win32' ? ['-Command', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd,
      shell: false, // We use explicit shell
      env: { ...process.env, CI: 'true' } // Force non-interactive mode often helped by CI=true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      resolve({
        command,
        stdout,
        stderr,
        exitCode: null,
        error: err.message
      });
    });

    child.on('close', (code) => {
      resolve({
        command,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}
