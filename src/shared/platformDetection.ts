import { invoke } from "@tauri-apps/api/core";

export interface PlatformStatus {
  android: {
    available: boolean;
    reason?: string;
  };
  ios: {
    available: boolean;
    reason?: string;
  };
}

export function isAndroid(platform: string): boolean {
  return platform.toLowerCase().includes("android");
}

export function isIos(platform: string): boolean {
  return platform.toLowerCase().includes("ios");
}

/**
 * Detects if Android and iOS platforms are available based on:
 * 1. package.json dependencies (@nativescript/android, @nativescript/ios)
 * 2. existence of platform folders in node_modules
 * 3. Operating System constraints (iOS requires macOS)
 */
export async function detectPlatforms(
  projectPath: string | null,
  packages: Record<string, string>,
  isMac: boolean,
  knownPlatforms: string[] = [],
): Promise<PlatformStatus> {
  if (!projectPath) {
    return {
      android: { available: false, reason: "No project selected" },
      ios: { available: false, reason: "No project selected" },
    };
  }

  const hasAndroidPkg =
    !!packages["@nativescript/android"] ||
    knownPlatforms.some((p) => isAndroid(p));
  const hasIosPkg =
    !!packages["@nativescript/ios"] || knownPlatforms.some((p) => isIos(p));

  let androidAvailable = false;
  let androidReason = "";
  let iosAvailable = false;
  let iosReason = "";

  // Android Check
  if (!hasAndroidPkg) {
    androidReason = "Platform Android needs to be added to the project.";
  } else {
    // Standard: Windows, Linux, macOS are all supported for Android
    const androidModulePath = `${projectPath}/node_modules/@nativescript/android`;
    const exists = await invoke<boolean>("path_exists", {
      path: androidModulePath,
    });
    if (!exists) {
      androidReason =
        "Android runtime not installed. It will be added automatically on run.";
    } else {
      androidAvailable = true;
    }
  }

  // iOS Check
  if (!isMac) {
    iosReason = "iOS development requires macOS";
  } else if (!hasIosPkg) {
    iosReason = "Platform iOS needs to be added to the project.";
  } else {
    const iosModulePath = `${projectPath}/node_modules/@nativescript/ios`;
    const exists = await invoke<boolean>("path_exists", {
      path: iosModulePath,
    });
    if (!exists) {
      iosReason =
        "iOS runtime not installed. It will be added automatically on run.";
    } else {
      iosAvailable = true;
    }
  }

  return {
    android: { available: androidAvailable, reason: androidReason },
    ios: { available: iosAvailable, reason: iosReason },
  };
}
