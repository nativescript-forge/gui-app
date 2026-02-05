import React from "react";
import { SetupWizard, SetupStep } from "../../components/SetupWizard";
import { CodeBlock } from "../../components/CodeBlock";
import { FaTerminal, FaCog, FaAndroid, FaCoffee } from "react-icons/fa";
import {
  checkNode,
  checkJDK,
  checkAndroidSDK,
  checkNS,
} from "../../utils/setupVerification";

interface LinuxSetupProps {
  onFinish: () => void;
}

export const LinuxSetup: React.FC<LinuxSetupProps> = ({ onFinish }) => {
  const steps: SetupStep[] = [
    {
      id: "linux-node",
      title: "Node.js",
      description: "NativeScript requires Node.js LTS.",
      testFn: checkNode,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-warning/5 rounded-xl border border-warning/20 shadow-sm">
            <FaTerminal className="text-2xl text-warning" />
            <p className="text-sm">
              Install Node.js via NodeSource (Ubuntu/Debian):
            </p>
          </div>
          <CodeBlock
            compact
            code="curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\nsudo apt-get install -y nodejs"
          />
        </div>
      ),
    },
    {
      id: "linux-jdk",
      title: "Java JDK",
      description: "Install OpenJDK 17.",
      testFn: checkJDK,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-info/5 rounded-xl border border-info/20 shadow-sm">
            <FaCoffee className="text-2xl text-info" />
            <p className="text-sm">Install OpenJDK 17 on Ubuntu/Debian:</p>
          </div>
          <CodeBlock compact code="sudo apt-get install -y openjdk-17-jdk" />
        </div>
      ),
    },
    {
      id: "linux-android-sdk",
      title: "Android SDK",
      description: "Setup Android SDK for Linux.",
      testFn: checkAndroidSDK,
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FaAndroid className="text-2xl text-primary" />
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Download Android Command Line Tools and place them in your home
              directory under <code>~/Android/Sdk</code>.
            </p>
          </div>
          <CodeBlock compact code="mkdir -p ~/Android/Sdk/cmdline-tools" />
        </div>
      ),
    },
    {
      id: "linux-env-vars",
      title: "Environment Variables",
      description:
        "Add environment variables to your shell profile (e.g., .bashrc or .zshrc).",
      testFn: checkNS,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-warning/5 rounded-xl border border-warning/20">
            <FaCog className="text-base text-warning" />
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Required Shell Exports
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
                  code="export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
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
                <CodeBlock compact code="export ANDROID_HOME=$HOME/Android/Sdk" />
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
                  code={"export PATH=$PATH:$JAVA_HOME/bin\nexport PATH=$PATH:$ANDROID_HOME/platform-tools\nexport PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"}
                />
                <div className="h-1"></div>
              </div>
            </div>
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
