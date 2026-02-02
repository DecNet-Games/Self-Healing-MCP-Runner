export type ErrorType = 
  | 'DEPENDENCY_MISSING'
  | 'TS_ERROR'
  | 'PORT_IN_USE'
  | 'ENV_MISSING'
  | 'NEXT_CONFIG_ERROR'
  | 'CODE_ERROR'
  | 'UNKNOWN';

export interface ClassificationResult {
  type: ErrorType;
  details?: string;
  file?: string;
  line?: number;
}

export function classifyError(stderr: string, stdout: string): ClassificationResult {
  const combined = (stderr + stdout).toLowerCase();

  // 1. Dependency Missing
  // Error: Cannot find module 'react'
  // npm ERR! code MODULE_NOT_FOUND
  const depMatch = combined.match(/cannot find module ['"](@?[\w\-\/]+)['"]/i) 
    || combined.match(/module not found: error: can't resolve ['"](@?[\w\-\/]+)['"]/i)
    || combined.match(/command not found: (\w+)/i) // sometimes missing global tools
    || combined.match(/'(\w+)' is not recognized as an internal or external command/i);

  if (depMatch) {
    return { type: 'DEPENDENCY_MISSING', details: depMatch[1] };
  }

  // 2. TypeScript Error
  // TSError: ⨯ Unable to compile TypeScript:
  // src/index.ts(1,1): error TS2304: Cannot find name 'foo'.
  if (combined.includes('typescript') && combined.includes('error ts')) {
    return { type: 'TS_ERROR' };
  }

  // 3. Port in Use
  // Error: listen EADDRINUSE: address already in use :::3000
  if (combined.includes('eaddrinuse') || combined.includes('address already in use')) {
    return { type: 'PORT_IN_USE' };
  }

  // 5. Code Errors (Syntax/Reference/Type)
  // ReferenceError: x is not defined
  // at Object.<anonymous> (/path/to/file.js:10:5)
  // SyntaxError: Unexpected token
  const codeErrorMatch = combined.match(/(ReferenceError|SyntaxError|TypeError): (.+)/i);
  if (codeErrorMatch) {
      // Try to extract file path from stack trace in lines following the error
      const stackMatch = combined.match(/at .+ \((.+):(\d+):(\d+)\)/) || combined.match(/at (.+):(\d+):(\d+)/);
      return {
          type: 'CODE_ERROR',
          details: codeErrorMatch[0], // "ReferenceError: x is not defined"
          file: stackMatch ? stackMatch[1] : undefined,
          line: stackMatch ? parseInt(stackMatch[2]) : undefined
      };
  }

  return { type: 'UNKNOWN' };
}
