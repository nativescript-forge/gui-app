import React from "react";
import { SetupWizard, SetupStep } from "../../components/SetupWizard";
import { CodeBlock } from "../../components/CodeBlock";
import {
  FaTerminal,
  FaCog,
  FaAndroid,
  FaApple,
  FaCoffee,
} from "react-icons/fa";
import {
  checkNode,
  checkJDK,
  checkAndroidSDK,
  checkNS,
  checkIOS,
  checkBrew,
} from "../../utils/setupVerification";

interface MacOSSetupProps {
  onFinish: () => void;
}

export const MacOSSetup: React.FC<MacOSSetupProps> = ({ onFinish }) => {
  const steps: SetupStep[] = [
    {
      id: "mac-homebrew",
      title: "Homebrew",
      description:
        "Homebrew is the essential package manager for macOS. It simplifies tool installation.",
      testFn: checkBrew,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
            <FaTerminal className="text-2xl text-primary" />
            <p className="text-sm">
              Run this command in your Terminal to install Homebrew:
            </p>
          </div>
          <CodeBlock
            compact
            code='/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold opacity-70 ml-1">
              If already installed, keep it updated:
            </p>
            <CodeBlock compact code="brew update" />
          </div>
        </div>
      ),
    },
    {
      id: "mac-node-jdk",
      title: "Node.js & JDK 17",
      description:
        "Install the core runtimes for NativeScript and Android development.",
      testFn: async () => {
        const node = await checkNode();
        if (!node.success) return node;
        const jdk = await checkJDK();
        if (!jdk.success) return jdk;
        return {
          success: true,
          message: "Node.js and JDK 17 are correctly installed.",
        };
      },
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300 shadow-sm">
              <h4 className="text-xs font-bold mb-3 uppercase tracking-wider opacity-60 flex items-center gap-2">
                <FaTerminal className="text-primary" /> Node.js
              </h4>
              <CodeBlock compact code="brew install node@20" />
            </div>
            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300 shadow-sm">
              <h4 className="text-xs font-bold mb-3 uppercase tracking-wider opacity-60 flex items-center gap-2">
                <FaCoffee className="text-primary" /> JDK 17
              </h4>
              <CodeBlock compact code="brew install --cask temurin@17" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-info/5 rounded-xl border border-info/20">
            <p className="text-[10px] leading-relaxed opacity-80">
              Using Homebrew is the recommended way to keep these tools updated
              on macOS.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "mac-ios",
      title: "iOS Setup",
      description: "Configure your machine for iOS development using Xcode.",
      testFn: checkIOS,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300 shadow-sm">
            <FaApple className="text-3xl" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Install Xcode</h4>
              <p className="text-xs opacity-70">
                Download from the Mac App Store.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-base-200/30 rounded-xl border border-base-300">
              <p className="text-[11px] font-bold mb-2 uppercase tracking-wider opacity-60">
                After installation, run:
              </p>
              <div className="space-y-2">
                <CodeBlock
                  compact
                  code="sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
                />
                <CodeBlock compact code="sudo xcodebuild -license accept" />
              </div>
            </div>

            <div className="p-3 bg-base-200/30 rounded-xl border border-base-300">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  Install CocoaPods:
                </p>
                <span className="text-[10px] opacity-50 italic">
                  Required for iOS dependencies
                </span>
              </div>
              <CodeBlock compact code="sudo gem install cocoapods" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "mac-android",
      title: "Android SDK",
      description: "Setup the Android environment on macOS.",
      testFn: checkAndroidSDK,
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FaAndroid className="text-2xl text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold">Android Studio</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Recommended for managing SDKs, Build-Tools, and Emulators.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <CodeBlock compact code="brew install --cask android-studio" />

            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300">
              <h4 className="text-[11px] font-bold mb-3 uppercase tracking-wider opacity-60">
                Required SDK Components
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-[11px]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  SDK Platform 34
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  Build-Tools
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  Platform-Tools
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  Emulator
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "mac-env",
      title: "Environment Variables",
      description:
        "Finalize your environment by adding variables to your shell profile.",
      testFn: checkNS,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-warning/5 rounded-xl border border-warning/20">
            <FaCog className="text-base text-warning" />
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Required Shell Profile Updates
            </p>
          </div>

          <div className="border border-base-300 rounded-xl overflow-hidden bg-base-200/30">
            {/* JAVA_HOME */}
            <div className="collapse collapse-arrow collapse-sm border-b border-base-300 rounded-none">
              <input type="radio" name="env-accordion" defaultChecked />
              <div className="collapse-title text-[10px] font-bold min-h-0 py-1 px-4">
                JAVA_HOME
              </div>
              <div className="collapse-content !p-0 !px-4">
                <CodeBlock
                  compact
                  code="export JAVA_HOME=$(/usr/libexec/java_home -v 17)"
                />
                <div className="h-1"></div>
              </div>
            </div>

            {/* ANDROID_HOME */}
            <div className="collapse collapse-arrow collapse-sm border-b border-base-300 rounded-none">
              <input type="radio" name="env-accordion" />
              <div className="collapse-title text-[10px] font-bold min-h-0 py-1 px-4">
                ANDROID_HOME
              </div>
              <div className="collapse-content !p-0 !px-4">
                <CodeBlock
                  compact
                  code="export ANDROID_HOME=$HOME/Library/Android/sdk"
                />
                <div className="h-1"></div>
              </div>
            </div>

            {/* PATH Updates */}
            <div className="collapse collapse-arrow collapse-sm rounded-none">
              <input type="radio" name="env-accordion" />
              <div className="collapse-title text-[10px] font-bold min-h-0 py-1 px-4">
                PATH Updates
              </div>
              <div className="collapse-content !p-0 !px-4">
                <CodeBlock
                  compact
                  code={
                    "export PATH=$PATH:$ANDROID_HOME/platform-tools\nexport PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
                  }
                />
                <div className="h-1"></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-base-200/50 rounded-xl border border-base-300">
            <p className="text-[10px] mb-1 font-bold uppercase tracking-wider opacity-60">
              Apply changes:
            </p>
            <CodeBlock compact code="source ~/.zshrc" />
          </div>

          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-[10px] mb-1 font-bold uppercase tracking-wider opacity-70">
              Finally, install NativeScript CLI:
            </p>
            <CodeBlock compact code="npm install -g nativescript" />
          </div>
        </div>
      ),
    },
  ];

  return <SetupWizard steps={steps} onFinish={onFinish} />;
};
