/**
 * Redacts sensitive information from NativeScript commands.
 * Filters out passwords, aliases, and other sensitive flags.
 */
export function redactCommand(command: string): string {
  if (!command) return "";

  const sensitiveFlags = [
    "--key-store-password",
    "--key-password",
    "--certificate-password",
    "--provision",
  ];

  let redacted = command;
  
  sensitiveFlags.forEach(flag => {
    // Regex to match flag and its value (either space-separated or equals-separated)
    // Supports: --flag value, --flag=value, --flag "value", --flag="value"
    const regex = new RegExp(`(${flag})\\s*(=|\\s+)\\s*("[^"]*"|'[^']*'|\\S+)`, "gi");
    redacted = redacted.replace(regex, "$1$2********");
  });

  return redacted;
}

/**
 * Formats duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${seconds}s`;
  const minutes = (ms / 60000).toFixed(1);
  return `${minutes}m`;
}
