import fs from 'fs';
import path from 'path';

export interface MemoryState {
  lastCommand: string | null;
  lastError: string | null;
  fixAttempts: string[];
}

const MEMORY_FILE = path.join(process.cwd(), 'mcp-memory.json');

export class Memory {
  private state: MemoryState;

  constructor() {
    this.state = this.load();
  }

  private load(): MemoryState {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Failed to load memory', e);
    }
    return { lastCommand: null, lastError: null, fixAttempts: [] };
  }

  public save(): void {
    try {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('Failed to save memory', e);
    }
  }

  public update(update: Partial<MemoryState>) {
    this.state = { ...this.state, ...update };
    this.save();
  }

  public get() {
    return this.state;
  }
    
  public addFixAttempt(fix: string) {
      this.state.fixAttempts.push(fix);
      this.save();
  }

  public clear() {
      this.state = { lastCommand: null, lastError: null, fixAttempts: [] };
      this.save();
  }
}

export const memory = new Memory();
