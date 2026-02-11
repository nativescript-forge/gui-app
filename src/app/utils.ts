/**
 * Shortens a file path for display purposes.
 * Example: C:\Users\dyazi\DataDisk\projects\kang-cahya\tauri\NS-Forge
 * Becomes: C:\...\tauri\NS-Forge
 */
export function shortenPath(path: string, maxSegments: number = 3): string {
  if (!path) return "";

  // Normalize separators to handle both Windows and Unix paths
  const separator = path.includes("\\") ? "\\" : "/";
  const segments = path.split(separator).filter(Boolean);

  // If path is short, return as is
  if (segments.length <= maxSegments + 1) {
    return path;
  }

  const drive = path.startsWith(separator) ? "" : segments[0];
  const lastSegments = segments.slice(-maxSegments);
  
  const prefix = drive ? `${drive}${separator}` : separator;
  return `${prefix}...${separator}${lastSegments.join(separator)}`;
}

/**
 * Strips ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
  if (!str) return "";
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, "");
}
