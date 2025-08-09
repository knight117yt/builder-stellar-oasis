/**
 * Utility to suppress specific console warnings from third-party libraries
 * This is only for development and doesn't affect production builds
 */

// Store original console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Patterns of warnings to suppress
const SUPPRESSED_WARNING_PATTERNS = [
  // Recharts defaultProps warnings - exact React format
  /Support for defaultProps will be removed from function components.*XAxis/,
  /Support for defaultProps will be removed from function components.*YAxis/,
  /Support for defaultProps will be removed from function components.*ReferenceLine/,
  /Support for defaultProps will be removed from function components.*CartesianGrid/,
  /Support for defaultProps will be removed from function components.*Tooltip/,
  /Support for defaultProps will be removed from function components.*Bar/,
  /Support for defaultProps will be removed from function components.*Line/,
  /Support for defaultProps will be removed from function components.*Area/,
  /Support for defaultProps will be removed from function components.*ResponsiveContainer/,
  /Support for defaultProps will be removed from function components.*Surface/,
  // Generic patterns for any Recharts component
  /Support for defaultProps will be removed from function components/,
  /defaultProps will be removed from function components/,
  // Specific component names that might appear separately
  /XAxis.*defaultProps/,
  /YAxis.*defaultProps/,
  /ReferenceLine.*defaultProps/,
  /CartesianGrid.*defaultProps/,
  /Tooltip.*defaultProps/,
  // Add other third-party warnings here as needed
];

function shouldSuppressWarning(message: string): boolean {
  // More aggressive suppression for Recharts warnings
  if (
    message.includes("Support for defaultProps will be removed") &&
    (message.includes("XAxis") ||
      message.includes("YAxis") ||
      message.includes("ReferenceLine"))
  ) {
    return true;
  }

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

    // Also check individual arguments for component names
    const allArgsString = args.join(" ");

    // Check if any argument contains recharts component names
    const hasRechartComponents = args.some(
      (arg: any) =>
        typeof arg === "string" &&
        (arg.includes("XAxis") ||
          arg.includes("YAxis") ||
          arg.includes("ReferenceLine") ||
          arg.includes("CartesianGrid") ||
          arg.includes("Tooltip") ||
          arg.includes("Bar") ||
          arg.includes("Line") ||
          arg.includes("Surface")),
    );

    // Only suppress in development
    if (
      process.env.NODE_ENV === "development" &&
      (shouldSuppressWarning(message) ||
        shouldSuppressWarning(allArgsString) ||
        hasRechartComponents)
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
