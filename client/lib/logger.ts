// FILE: lib/logger.ts
// DESCRIPTION: Environment-aware logging utility that respects NODE_ENV
// Prevents sensitive data leakage in production while maintaining debug capabilities in development

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enabledInProduction: boolean;
    minLevel: LogLevel;
}

const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private isDevelopment: boolean;
    private isProduction: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Debug level logging - only in development
     * Use for detailed debugging information
     */
    debug(message: string, ...args: unknown[]): void {
        if (this.isDevelopment) {
            console.log(`🔍 [DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Info level logging - development only by default
     * Use for general informational messages
     */
    info(message: string, ...args: unknown[]): void {
        if (this.isDevelopment) {
            console.log(`ℹ️  [INFO] ${message}`, ...args);
        }
    }

    /**
     * Warning level logging - always enabled
     * Use for potentially harmful situations
     */
    warn(message: string, ...args: unknown[]): void {
        console.warn(`⚠️  [WARN] ${message}`, ...args);
    }

    /**
     * Error level logging - always enabled
     * Use for error events that might still allow the application to continue
     */
    error(message: string, error?: unknown): void {
        if (error instanceof Error) {
            console.error(`❌ [ERROR] ${message}`, {
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined,
            });
        } else {
            console.error(`❌ [ERROR] ${message}`, error);
        }
    }

    /**
     * Conditional logging based on environment
     * Use when you need explicit control over production logging
     */
    conditionalLog(
        level: LogLevel,
        message: string,
        data?: unknown,
        config?: Partial<LoggerConfig>
    ): void {
        const enableInProd = config?.enabledInProduction ?? false;
        const minLevel = config?.minLevel ?? 'info';

        if (!this.shouldLog(level, minLevel, enableInProd)) {
            return;
        }

        switch (level) {
            case 'debug':
                this.debug(message, data);
                break;
            case 'info':
                this.info(message, data);
                break;
            case 'warn':
                this.warn(message, data);
                break;
            case 'error':
                this.error(message, data);
                break;
        }
    }

    private shouldLog(
        level: LogLevel,
        minLevel: LogLevel,
        enableInProd: boolean
    ): boolean {
        // In production, only log if explicitly enabled
        if (this.isProduction && !enableInProd) {
            return false;
        }

        // Check if level meets minimum threshold
        return levelPriority[level] >= levelPriority[minLevel];
    }

    /**
     * Redacts sensitive information from objects for safe logging
     */
    redact<T extends Record<string, unknown>>(
        obj: T,
        sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'authorization']
    ): Record<string, unknown> {
        const redacted: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
                redacted[key] = '[REDACTED]';
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                redacted[key] = this.redact(value as Record<string, unknown>, sensitiveKeys);
            } else {
                redacted[key] = value;
            }
        }

        return redacted;
    }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel };
