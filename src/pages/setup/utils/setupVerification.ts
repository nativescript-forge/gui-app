import { Command } from "@tauri-apps/plugin-shell";

export async function checkNode(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const command = Command.create("node", ["-v"]);
    const output = await command.execute();
    if (output.code === 0) {
      return {
        success: true,
        message: `Node.js found: ${output.stdout.trim()}`,
      };
    }
    return {
      success: false,
      message: `Node.js check failed: ${output.stderr}`,
    };
  } catch (error) {
    return { success: false, message: `Node.js not found in PATH. ${error}` };
  }
}

export async function checkJDK(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const command = Command.create("javac", ["-version"]);
    const output = await command.execute();
    if (output.code === 0) {
      return {
        success: true,
        message: `JDK found: ${output.stdout.trim() || output.stderr.trim()}`,
      };
    }
    return { success: false, message: `JDK check failed: ${output.stderr}` };
  } catch (error) {
    return {
      success: false,
      message: `JDK (javac) not found in PATH. ${error}`,
    };
  }
}

export async function checkAndroidSDK(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check for adb as a proxy for SDK
    const command = Command.create("adb", ["--version"]);
    const output = await command.execute();
    if (output.code === 0) {
      return {
        success: true,
        message: `Android Platform Tools found: ${output.stdout.split("\n")[0].trim()}`,
      };
    }
    return { success: false, message: `ADB check failed: ${output.stderr}` };
  } catch (error) {
    return {
      success: false,
      message: `ADB not found in PATH. Please ensure Android SDK is installed and platform-tools is in PATH. ${error}`,
    };
  }
}

export async function checkNS(): Promise<{
  success: boolean;
  message: string;
}> {
  // Try 'ns' first
  try {
    const command = Command.create("ns", ["-v"]);
    const output = await command.execute();
    if (output.code === 0) {
      return {
        success: true,
        message: `NativeScript CLI found: ${output.stdout.trim()}`,
      };
    }
  } catch (error) {
    // Fall through to next attempt
  }

  // If 'ns' failed or not found, try 'ns.cmd' (common on Windows for global npm packages)
  try {
    const command = Command.create("ns-cmd", ["-v"]);
    const output = await command.execute();
    if (output.code === 0) {
      return {
        success: true,
        message: `NativeScript CLI found: ${output.stdout.trim()}`,
      };
    }
    return {
      success: false,
      message: `NativeScript CLI check failed: ${output.stderr}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `NativeScript CLI ('ns') not found in PATH. Make sure it's installed via 'npm install -g nativescript' and you have restarted the application.`,
    };
  }
}

export async function checkIOS(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check Xcode
    const xcodeCommand = Command.create("xcode-select", ["-p"]);
    const xcodeOutput = await xcodeCommand.execute();

    if (xcodeOutput.code !== 0) {
      return {
        success: false,
        message:
          "Xcode Command Line Tools not found. Please run the setup commands.",
      };
    }

    // Check CocoaPods
    const podCommand = Command.create("pod", ["--version"]);
    const podOutput = await podCommand.execute();

    if (podOutput.code !== 0) {
      return {
        success: false,
        message:
          "CocoaPods not found. Please install it using 'sudo gem install cocoapods'.",
      };
    }

    return {
      success: true,
      message: `iOS environment ready. Xcode path: ${xcodeOutput.stdout.trim()}, CocoaPods: ${podOutput.stdout.trim()}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `iOS check failed. Ensure Xcode and CocoaPods are installed. ${error}`,
    };
  }
}

export async function checkBrew(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const command = Command.create("brew", ["--version"]);
    const output = await command.execute();

    if (output.code === 0) {
      return {
        success: true,
        message: `Homebrew found: ${output.stdout.split("\n")[0].trim()}`,
      };
    }
    return {
      success: false,
      message: `Homebrew check failed: ${output.stderr}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Homebrew ('brew') not found in PATH. ${error}`,
    };
  }
}
