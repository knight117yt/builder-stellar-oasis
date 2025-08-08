/**
 * Error handling utilities for the application
 */

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  getItem: (key: string, fallback: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? safeJSONParse(item, fallback) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
      return false;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  },
};

/**
 * Safe ID generation
 */
export function generateSafeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID()
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Error logger
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error("Application Error:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, context);
  }
}

/**
 * Async error handler wrapper
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context,
        args: args.map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg),
        ),
      });
      throw error;
    }
  }) as T;
}

/**
 * Safe DOM operations
 */
export const safeDOMUtils = {
  getElementById: (id: string) => {
    try {
      return document.getElementById(id);
    } catch {
      return null;
    }
  },

  createElement: (tagName: string) => {
    try {
      return document.createElement(tagName);
    } catch {
      return null;
    }
  },

  dispatchEvent: (element: Element, event: Event) => {
    try {
      element.dispatchEvent(event);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Feature detection utilities
 */
export const featureDetection = {
  hasLocalStorage: () => {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  hasNotifications: () => {
    return "Notification" in window;
  },

  hasCrypto: () => {
    return "crypto" in window && "randomUUID" in crypto;
  },

  hasWebSocket: () => {
    return "WebSocket" in window;
  },
};

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
