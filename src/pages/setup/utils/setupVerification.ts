import { invoke } from "@tauri-apps/api/core";

export interface VerificationResult {
  success: boolean;
  message: string;
}

interface CommandResult {
  statusCode: number | null;
  stdout: string;
  stderr: string;
  command?: string;
}

export async function checkNode(): Promise<VerificationResult> {
  try {
    const res = await invoke<CommandResult>("verify_tool", { tool: "node" });
    return {
      success: true,
      message: `Node.js found: ${res.stdout.trim()}`,
    };
  } catch (error) {
    return { success: false, message: `Node.js not found: ${error}` };
  }
}

export async function checkJDK(): Promise<VerificationResult> {
  try {
    const res = await invoke<CommandResult>("verify_tool", { tool: "javac" });
    return {
      success: true,
      message: `JDK found: ${res.stdout.trim() || res.stderr.trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `JDK (javac) not found. Please ensure JDK is installed and JAVA_HOME is set. ${error}`,
    };
  }
}

export async function checkAndroidSDK(): Promise<VerificationResult> {
  try {
    const res = await invoke<CommandResult>("verify_tool", { tool: "adb" });
    return {
      success: true,
      message: `Android Platform Tools found: ${res.stdout.split("\n")[0].trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Android SDK/ADB not found. Please ensure Android SDK is installed and ANDROID_HOME is set. ${error}`,
    };
  }
}

export async function checkNS(): Promise<VerificationResult> {
  try {
    const res = await invoke<CommandResult>("verify_tool", { tool: "ns" });
    return {
      success: true,
      message: `NativeScript CLI found: ${res.stdout.trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `NativeScript CLI ('ns') not found. ${error}`,
    };
  }
}

export async function checkIOS(): Promise<VerificationResult> {
  try {
    const xcodeRes = await invoke<CommandResult>("verify_tool", {
      tool: "xcode-select",
    });
    const podRes = await invoke<CommandResult>("verify_tool", { tool: "pod" });

    return {
      success: true,
      message: `iOS environment ready. Xcode: ${xcodeRes.stdout.trim()}, CocoaPods: ${podRes.stdout.trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `iOS check failed. Ensure Xcode and CocoaPods are installed. ${error}`,
    };
  }
}

export async function checkBrew(): Promise<VerificationResult> {
  try {
    const res = await invoke<CommandResult>("verify_tool", { tool: "brew" });
    return {
      success: true,
      message: `Homebrew found: ${res.stdout.split("\n")[0].trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Homebrew ('brew') not found. ${error}`,
    };
  }
}
