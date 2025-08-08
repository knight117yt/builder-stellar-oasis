/**
 * Utility to suppress specific console warnings from third-party libraries
 * This is only for development and doesn't affect production builds
 */

// Store original console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Patterns of warnings to suppress
const SUPPRESSED_WARNING_PATTERNS = [
  // Recharts defaultProps warnings - more flexible pattern matching
  /Support for defaultProps will be removed from function components/,
  /defaultProps will be removed from function components/,
  // Specific Recharts components
  /XAxis.*defaultProps/,
  /YAxis.*defaultProps/,
  /ReferenceLine.*defaultProps/,
  /CartesianGrid.*defaultProps/,
  /Tooltip.*defaultProps/,
  /Bar.*defaultProps/,
  /Line.*defaultProps/,
  // Add other third-party warnings here as needed
];

function shouldSuppressWarning(message: string): boolean {
  return SUPPRESSED_WARNING_PATTERNS.some((pattern) => pattern.test(message));
}

function createFilteredConsoleMethod(originalMethod: typeof console.warn) {
  return (...args: any[]) => {
    // Handle React's console.warn with format specifiers
    let message = "";
    if (typeof args[0] === "string" && args[0].includes("%s")) {
      // Format string with substitutions
      message = args[0];
      for (let i = 1; i < args.length; i++) {
        message = message.replace("%s", String(args[i]));
      }
    } else {
      message = args.join(" ");
    }

    // Only suppress in development
    if (
      process.env.NODE_ENV === "development" &&
      shouldSuppressWarning(message)
    ) {
      return; // Suppress the warning
    }

    // Call original method for all other warnings/errors
    originalMethod.apply(console, args);
  };
}

export function suppressThirdPartyWarnings() {
  if (process.env.NODE_ENV === "development") {
    console.warn = createFilteredConsoleMethod(originalConsoleWarn);
    console.error = createFilteredConsoleMethod(originalConsoleError);
  }
}

export function restoreConsole() {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
}

// Auto-apply suppression in development
if (process.env.NODE_ENV === "development") {
  suppressThirdPartyWarnings();
}
