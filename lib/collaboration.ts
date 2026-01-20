/**
 * CodeSwitch v7.0 - Collaboration System
 * 
 * Features:
 * 1. Real-time cursor tracking
 * 2. User presence management
 * 3. Code annotations & comments
 * 4. Change synchronization
 * 5. Conflict resolution
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastActive: number;
}

export interface Cursor {
  userId: string;
  position: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  file: 'cobol' | 'python';
  timestamp: number;
}

export interface Annotation {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  line: number;
  file: 'cobol' | 'python';
  content: string;
  type: 'comment' | 'question' | 'suggestion' | 'issue';
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
  replies: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface CodeChange {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  file: 'cobol' | 'python';
  position: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  oldContent?: string;
  newContent: string;
  timestamp: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  users: User[];
  cursors: Map<string, Cursor>;
  annotations: Annotation[];
  pendingChanges: CodeChange[];
  cobolCode: string;
  pythonCode: string;
  version: number;
}

// Generate unique user colors
const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#f43f5e'
];

let colorIndex = 0;

export function getNextUserColor(): string {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

/**
 * Collaboration Session Manager
 */
export class CollaborationManager {
  private session: CollaborationSession;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(sessionId: string, sessionName: string, ownerId: string) {
    this.session = {
      id: sessionId,
      name: sessionName,
      ownerId,
      createdAt: Date.now(),
      users: [],
      cursors: new Map(),
      annotations: [],
      pendingChanges: [],
      cobolCode: '',
      pythonCode: '',
      version: 0
    };
  }

  // User Management
  addUser(user: Omit<User, 'color' | 'status' | 'lastActive'>): User {
    const fullUser: User = {
      ...user,
      color: getNextUserColor(),
      status: 'online',
      lastActive: Date.now()
    };
    this.session.users.push(fullUser);
    this.emit('user-joined', fullUser);
    return fullUser;
  }

  removeUser(userId: string): void {
    const user = this.session.users.find(u => u.id === userId);
    if (user) {
      this.session.users = this.session.users.filter(u => u.id !== userId);
      this.session.cursors.delete(userId);
      this.emit('user-left', user);
    }
  }

  updateUserStatus(userId: string, status: User['status']): void {
    const user = this.session.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      user.lastActive = Date.now();
      this.emit('user-status-changed', { userId, status });
    }
  }

  getUsers(): User[] {
    return [...this.session.users];
  }

  getOnlineUsers(): User[] {
    return this.session.users.filter(u => u.status === 'online');
  }

  // Cursor Management
  updateCursor(userId: string, cursor: Omit<Cursor, 'userId' | 'timestamp'>): void {
    const fullCursor: Cursor = {
      ...cursor,
      userId,
      timestamp: Date.now()
    };
    this.session.cursors.set(userId, fullCursor);
    this.emit('cursor-moved', fullCursor);
  }

  getCursors(): Cursor[] {
    return Array.from(this.session.cursors.values());
  }

  getCursorForUser(userId: string): Cursor | undefined {
    return this.session.cursors.get(userId);
  }

  // Annotations
  addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'resolved'>): Annotation {
    const fullAnnotation: Annotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: [],
      resolved: false
    };
    this.session.annotations.push(fullAnnotation);
    this.emit('annotation-added', fullAnnotation);
    return fullAnnotation;
  }

  replyToAnnotation(annotationId: string, reply: Omit<AnnotationReply, 'id' | 'createdAt'>): AnnotationReply | null {
    const annotation = this.session.annotations.find(a => a.id === annotationId);
    if (!annotation) return null;

    const fullReply: AnnotationReply = {
      ...reply,
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    annotation.replies.push(fullReply);
    annotation.updatedAt = Date.now();
    this.emit('annotation-replied', { annotationId, reply: fullReply });
    return fullReply;
  }

  resolveAnnotation(annotationId: string): void {
    const annotation = this.session.annotations.find(a => a.id === annotationId);
    if (annotation) {
      annotation.resolved = true;
      annotation.updatedAt = Date.now();
      this.emit('annotation-resolved', annotationId);
    }
  }

  getAnnotations(file?: 'cobol' | 'python'): Annotation[] {
    if (file) {
      return this.session.annotations.filter(a => a.file === file);
    }
    return [...this.session.annotations];
  }

  getAnnotationsForLine(file: 'cobol' | 'python', line: number): Annotation[] {
    return this.session.annotations.filter(a => a.file === file && a.line === line);
  }

  // Code Changes
  applyChange(change: Omit<CodeChange, 'id' | 'timestamp'>): CodeChange {
    const fullChange: CodeChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    this.session.pendingChanges.push(fullChange);
    this.session.version++;
    this.emit('code-changed', fullChange);
    
    return fullChange;
  }

  getPendingChanges(): CodeChange[] {
    return [...this.session.pendingChanges];
  }

  clearPendingChanges(): void {
    this.session.pendingChanges = [];
  }

  // Code State
  setCode(cobolCode: string, pythonCode: string): void {
    this.session.cobolCode = cobolCode;
    this.session.pythonCode = pythonCode;
    this.session.version++;
    this.emit('code-synced', { cobolCode, pythonCode, version: this.session.version });
  }

  getCode(): { cobolCode: string; pythonCode: string; version: number } {
    return {
      cobolCode: this.session.cobolCode,
      pythonCode: this.session.pythonCode,
      version: this.session.version
    };
  }

  // Event System
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Session Management
  getSessionInfo(): Omit<CollaborationSession, 'cursors'> & { cursors: Cursor[] } {
    return {
      ...this.session,
      cursors: this.getCursors()
    };
  }

  startSync(intervalMs: number = 1000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => {
      this.emit('sync', this.getSessionInfo());
    }, intervalMs);
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  destroy(): void {
    this.stopSync();
    this.eventHandlers.clear();
  }
}

/**
 * Format user presence for display
 */
export function formatPresenceList(users: User[]): string {
  const online = users.filter(u => u.status === 'online');
  const away = users.filter(u => u.status === 'away');
  
  let output = `## Active Collaborators\n\n`;
  
  if (online.length > 0) {
    output += `### Online (${online.length})\n`;
    online.forEach(u => {
      output += `- 🟢 **${u.name}** (${u.role})\n`;
    });
    output += '\n';
  }
  
  if (away.length > 0) {
    output += `### Away (${away.length})\n`;
    away.forEach(u => {
      output += `- 🟡 ${u.name}\n`;
    });
  }
  
  return output;
}

/**
 * Generate session share link
 */
export function generateShareLink(sessionId: string, role: 'editor' | 'viewer'): string {
  const token = btoa(`${sessionId}:${role}:${Date.now()}`);
  return `/collaborate?session=${sessionId}&token=${token}`;
}

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy = 'last-write-wins' | 'first-write-wins' | 'merge' | 'manual';

export function resolveConflict(
  changes: CodeChange[],
  strategy: ConflictStrategy
): CodeChange {
  if (changes.length === 0) {
    throw new Error('No changes to resolve');
  }
  
  if (changes.length === 1) {
    return changes[0];
  }

  switch (strategy) {
    case 'last-write-wins':
      return changes.reduce((latest, change) => 
        change.timestamp > latest.timestamp ? change : latest
      );
    
    case 'first-write-wins':
      return changes.reduce((first, change) => 
        change.timestamp < first.timestamp ? change : first
      );
    
    case 'merge':
      // Simple merge: concatenate all new content
      const merged = changes.map(c => c.newContent).join('\n');
      return {
        ...changes[0],
        newContent: merged,
        timestamp: Date.now()
      };
    
    case 'manual':
    default:
      // Return first change and mark others as pending
      return changes[0];
  }
}
