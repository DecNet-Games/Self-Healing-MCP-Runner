import fs from 'fs';
import path from 'path';

export interface DoctorIssue {
    type: 'MISSING_FILE' | 'LOCKFILE_MISMATCH' | 'NODE_MODULES_MISSING' | 'TYPES_MISSING';
    severity: 'CRITICAL' | 'WARNING';
    description: string;
    fixCommand?: string;
}

export function runDoctor(cwd: string): DoctorIssue[] {
    const issues: DoctorIssue[] = [];
    const files = fs.readdirSync(cwd);

    // 1. Check package.json
    if (!files.includes('package.json')) {
        issues.push({
            type: 'MISSING_FILE',
            severity: 'CRITICAL',
            description: 'Missing package.json. Not a Node.js project?',
            fixCommand: 'npm init -y'
        });
        return issues; // Basic requirement
    }

    // 2. Check Lockfiles
    const hasPackageLock = files.includes('package-lock.json');
    const hasYarnLock = files.includes('yarn.lock');
    const hasPnpmLock = files.includes('pnpm-lock.yaml');

    if (!hasPackageLock && !hasYarnLock && !hasPnpmLock) {
        issues.push({
            type: 'MISSING_FILE',
            severity: 'WARNING',
            description: 'No lockfile found. Builds might be inconsistent.',
            fixCommand: 'npm install'
        });
    }

    // 3. Check node_modules
    if (!files.includes('node_modules')) {
        issues.push({
            type: 'NODE_MODULES_MISSING',
            severity: 'CRITICAL',
            description: 'Dependencies not installed.',
            fixCommand: 'npm install'
        });
    }

    // 4. TSConfig Check (Heuristic: if .ts files exist in src)
    if (fs.existsSync(path.join(cwd, 'src'))) {
        const srcFiles = fs.readdirSync(path.join(cwd, 'src'));
        const hasTsFiles = srcFiles.some(f => f.endsWith('.ts'));
        if (hasTsFiles && !files.includes('tsconfig.json')) {
            issues.push({
                type: 'MISSING_FILE',
                severity: 'CRITICAL',
                description: 'TypeScript files detected but tsconfig.json is missing.',
                fixCommand: 'npx tsc --init'
            });
        }
    }

    return issues;
}
