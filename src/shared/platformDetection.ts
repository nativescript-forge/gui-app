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
): Promise<PlatformStatus> {
  if (!projectPath) {
    return {
      android: { available: false, reason: "No project selected" },
      ios: { available: false, reason: "No project selected" },
    };
  }

  const hasAndroidPkg = !!packages["@nativescript/android"];
  const hasIosPkg = !!packages["@nativescript/ios"];

  let androidAvailable = false;
  let androidReason = "";
  let iosAvailable = false;
  let iosReason = "";

  // Android Check
  if (!hasAndroidPkg) {
    androidReason = "Package @nativescript/android not found in package.json";
  } else {
    // Standard: Windows, Linux, macOS are all supported for Android
    const androidModulePath = `${projectPath}/node_modules/@nativescript/android`;
    const exists = await invoke<boolean>("path_exists", {
      path: androidModulePath,
    });
    if (!exists) {
      androidReason =
        "Folder @nativescript/android not found in node_modules. Please run npm install.";
    } else {
      androidAvailable = true;
    }
  }

  // iOS Check
  if (!isMac) {
    iosReason = "iOS development requires macOS";
  } else if (!hasIosPkg) {
    iosReason = "Package @nativescript/ios not found in package.json";
  } else {
    const iosModulePath = `${projectPath}/node_modules/@nativescript/ios`;
    const exists = await invoke<boolean>("path_exists", {
      path: iosModulePath,
    });
    if (!exists) {
      iosReason =
        "Folder @nativescript/ios not found in node_modules. Please run npm install.";
    } else {
      iosAvailable = true;
    }
  }

  return {
    android: { available: androidAvailable, reason: androidReason },
    ios: { available: iosAvailable, reason: iosReason },
  };
}
