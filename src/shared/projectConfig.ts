import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

export const NSFORGE_DIR = ".nsforge";

export interface ProjectConfig {
  lastOpened?: number;
  customFontMappings?: Record<string, string>;
  [key: string]: any;
}

/**
 * Ensures the .nsforge directory exists in the project path.
 * Uses custom Rust command to bypass scope restrictions.
 */
export async function ensureNsForgeDir(projectPath: string): Promise<string> {
  const dirPath = await join(projectPath, NSFORGE_DIR);
  const isExists = await invoke<boolean>("path_exists", { path: dirPath });
  if (!isExists) {
    await invoke("create_dir", { path: dirPath });
  }
  return dirPath;
}

/**
 * Saves project-specific configuration to .nsforge/config.json
 */
export async function saveProjectConfig(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  const dirPath = await ensureNsForgeDir(projectPath);
  const configPath = await join(dirPath, "config.json");

  // Merge with existing config if any
  const existingConfig = await readProjectConfig(projectPath);
  const newConfig = { ...existingConfig, ...config };

  await invoke("write_text_file", {
    path: configPath,
    content: JSON.stringify(newConfig, null, 2),
  });
}

/**
 * Reads project-specific configuration from .nsforge/config.json
 */
export async function readProjectConfig(
  projectPath: string,
): Promise<ProjectConfig> {
  try {
    const dirPath = await join(projectPath, NSFORGE_DIR);
    const configPath = await join(dirPath, "config.json");

    const isExists = await invoke<boolean>("path_exists", { path: configPath });
    if (!isExists) {
      return {};
    }

    const content = await invoke<string>("read_text_file", {
      path: configPath,
    });
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read project config:", err);
    return {};
  }
}

/**
 * Saves specific data to a file inside .nsforge directory.
 * Supports subdirectories (e.g., "configs/fonts.json")
 */
export async function saveNsForgeData(
  projectPath: string,
  fileName: string,
  data: any,
): Promise<void> {
  const dirPath = await join(projectPath, NSFORGE_DIR);
  const filePath = await join(dirPath, fileName);

  // Ensure the subdirectory exists if fileName contains slashes
  if (fileName.includes("/") || fileName.includes("\\")) {
    const parts = fileName.split(/[\\/]/);
    parts.pop(); // Remove file name
    let currentPath = dirPath;
    for (const part of parts) {
      currentPath = await join(currentPath, part);
      const isDirExists = await invoke<boolean>("path_exists", {
        path: currentPath,
      });
      if (!isDirExists) {
        await invoke("create_dir", { path: currentPath });
      }
    }
  }

  await invoke("write_text_file", {
    path: filePath,
    content: JSON.stringify(data, null, 2),
  });
}

/**
 * Reads specific data from a file inside .nsforge directory.
 * Supports subdirectories (e.g., "configs/fonts.json")
 */
export async function readNsForgeData<T>(
  projectPath: string,
  fileName: string,
): Promise<T | null> {
  try {
    const dirPath = await join(projectPath, NSFORGE_DIR);
    const filePath = await join(dirPath, fileName);

    const isExists = await invoke<boolean>("path_exists", { path: filePath });
    if (!isExists) {
      return null;
    }

    const content = await invoke<string>("read_text_file", { path: filePath });
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Failed to read ${fileName}:`, err);
    return null;
  }
}
