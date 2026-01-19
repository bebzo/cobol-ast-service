/**
 * Production Logger for CodeSwitch
 * Structured logging with levels and metadata
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  userEmail?: string;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Only log at or above this level in production
const nodeEnv = process.env.NODE_ENV as string | undefined;
const MIN_LOG_LEVEL: LogLevel = nodeEnv === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatLog(entry: LogEntry): string {
  if (nodeEnv === 'production') {
    // JSON format for production (easy to parse in log aggregators)
    return JSON.stringify(entry);
  }
  
  // Pretty format for development
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const context = entry.context ? ` [${entry.context}]` : '';
  const user = entry.userEmail ? ` (${entry.userEmail})` : '';
  const duration = entry.duration ? ` (${entry.duration}ms)` : '';
  
  let output = `${prefix}${context}${user}${duration} ${entry.message}`;
  
  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (nodeEnv !== 'production' && entry.error.stack) {
      output += `\n  Stack: ${entry.error.stack}`;
    }
  }
  
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    output += `\n  Metadata: ${JSON.stringify(entry.metadata)}`;
  }
  
  return output;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  options?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...options
  };
}

export const logger = {
  debug(message: string, options?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) {
    if (!shouldLog('debug')) return;
    console.debug(formatLog(createLogEntry('debug', message, options)));
  },

  info(message: string, options?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) {
    if (!shouldLog('info')) return;
    console.info(formatLog(createLogEntry('info', message, options)));
  },

  warn(message: string, options?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>) {
    if (!shouldLog('warn')) return;
    console.warn(formatLog(createLogEntry('warn', message, options)));
  },

  error(message: string, error?: Error | unknown, options?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message' | 'error'>>) {
    if (!shouldLog('error')) return;
    
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error ? {
      name: 'UnknownError',
      message: String(error)
    } : undefined;
    
    console.error(formatLog(createLogEntry('error', message, { ...options, error: errorInfo })));
  },

  // Track API request timing
  apiRequest(context: string, userEmail?: string) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      requestId,
      success(message: string, metadata?: Record<string, any>) {
        logger.info(message, {
          context,
          userEmail,
          requestId,
          duration: Date.now() - startTime,
          metadata
        });
      },
      error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
        logger.error(message, error, {
          context,
          userEmail,
          requestId,
          duration: Date.now() - startTime,
          metadata
        });
      }
    };
  }
};

export default logger;
