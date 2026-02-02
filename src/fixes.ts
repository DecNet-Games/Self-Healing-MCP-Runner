import { ErrorType, ClassificationResult } from './classify.js';

export interface FixAction {
  description: string;
  command?: string;     // Shell command to run
  fileEdit?: {          // Or file to create/edit
    path: string;
    content: string;
  };
}

export function getFixAction(error: ClassificationResult): FixAction | null {
  switch (error.type) {
    case 'DEPENDENCY_MISSING':
      if (error.details) {
        // "command not found" usually implies a missing global or need to use npx, 
        // but often in node projects it means a missing dev dependency or script.
        // If it's a module import error, npm install is the way.
        return {
          description: `Install missing dependency: ${error.details}`,
          command: `npm install ${error.details}`
        };
      }
      break;

    case 'PORT_IN_USE':
      // Basic strategy: try the next likely port or let the framework find one.
      // Easiest "fix" for many Node apps is setting PORT env var.
      return {
        description: 'Attempt to restart on specific port 3001',
        command: process.platform === 'win32' 
          ? 'set PORT=3001 && npm run dev' // PowerShell/CMD syntax varies, assumes this runs in a fresh shell
          : 'PORT=3001 npm run dev'
      };

    case 'ENV_MISSING':
      if (error.details) {
        return {
          description: `Create .env with missing variable: ${error.details}`,
          fileEdit: {
            path: '.env',
            content: `${error.details}=placeholder_value\n`
          }
        };
      }
      break;

    case 'TS_ERROR':
        return {
            description: 'Attempt formatted lint fix',
            command: 'npm run lint -- --fix' 
        };
      
    case 'UNKNOWN':
        // Fallback: If unknown error persists, maybe try a Clean Install?
        // But only if we want to be very aggressive. 
        // For now, let's keep it safe.
        return null;

    default:
  }
  return null;
}

export function getRecursiveFix(previousFix: string): FixAction | null {
    // If "npm install" failed previously, try nuclear option.
    if (previousFix.includes('npm install')) {
        return {
            description: 'Nuclear option: Clear cache and reinstall',
            command: 'npm cache clean --force && rm -rf node_modules && npm install'
        };
    }
    return null;
}
