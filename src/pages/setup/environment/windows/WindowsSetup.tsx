import React from "react";
import { SetupWizard, SetupStep } from "../../components/SetupWizard";
import { CodeBlock } from "../../components/CodeBlock";
import {
  FaExternalLinkAlt,
  FaTerminal,
  FaCog,
  FaAndroid,
  FaCoffee,
} from "react-icons/fa";
import {
  checkNode,
  checkJDK,
  checkAndroidSDK,
  checkNS,
} from "../../utils/setupVerification";

interface WindowsSetupProps {
  onFinish: () => void;
}

export const WindowsSetup: React.FC<WindowsSetupProps> = ({ onFinish }) => {
  const steps: SetupStep[] = [
    {
      id: "win-node",
      title: "Node.js",
      description:
        "NativeScript is built on Node.js. We recommend using the Long Term Support (LTS) version.",
      testFn: checkNode,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-warning/5 rounded-xl border border-warning/20 shadow-sm">
            <FaTerminal className="text-2xl text-warning" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Install via Administrative PowerShell:
              </p>
              <a
                href="https://chocolatey.org/install"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs link link-primary flex items-center gap-1 w-fit"
              >
                Need Chocolatey? Install it first{" "}
                <FaExternalLinkAlt className="text-[10px]" />
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold opacity-70 ml-1">
              Quick Install:
            </p>
            <CodeBlock code="choco install nodejs-lts -y" />
          </div>
          <div className="divider text-xs opacity-50">OR</div>
          <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-xl border border-base-300">
            <p className="text-sm">Download manually from official site:</p>
            <a
              href="https://nodejs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm gap-2"
            >
              Node.js Website <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: "win-jdk",
      title: "Java Development Kit",
      description:
        "NativeScript requires JDK 17 to build Android applications.",
      testFn: checkJDK,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-info/5 rounded-xl border border-info/20 shadow-sm">
            <FaCoffee className="text-2xl text-info" />
            <p className="text-sm">
              We recommend <strong>Microsoft Build of OpenJDK 17</strong> or{" "}
              <strong>Adoptium Temurin 17</strong>.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <p className="text-sm font-bold">Install via Chocolatey:</p>
              <a
                href="https://chocolatey.org/install"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs link link-primary flex items-center gap-1"
              >
                Setup Guide <FaExternalLinkAlt className="text-[10px]" />
              </a>
            </div>
            <CodeBlock code="choco install microsoft-openjdk17 -y" />
          </div>
          <div className="divider text-xs opacity-50">OR</div>
          <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-xl border border-base-300">
            <p className="text-sm">Download installer manually:</p>
            <a
              href="https://learn.microsoft.com/en-us/java/openjdk/download"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm gap-2"
            >
              Download JDK 17 <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: "win-android-sdk",
      title: "Android SDK",
      description:
        "Install the Android SDK and required components for mobile development.",
      testFn: checkAndroidSDK,
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FaAndroid className="text-2xl text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold">Android Studio Recommended</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                The easiest way to manage SDKs, Build-Tools, and Emulators in
                one place.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300">
              <h4 className="text-xs font-bold mb-3 uppercase tracking-wider opacity-60">
                Platforms
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  SDK Platform 34
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  Platform-Tools
                </li>
              </ul>
            </div>
            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300">
              <h4 className="text-xs font-bold mb-3 uppercase tracking-wider opacity-60">
                Tools
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  SDK Build-Tools
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  Android Emulator
                </li>
              </ul>
            </div>
          </div>

          <a
            href="https://developer.android.com/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-md btn-block gap-3 shadow-md"
          >
            Download Android Studio <FaExternalLinkAlt />
          </a>
        </div>
      ),
    },
    {
      id: "win-env-vars",
      title: "Environment Variables",
      description:
        "Configure your system environment variables for NativeScript.",
      testFn: checkNS,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 p-2 bg-warning/5 rounded-xl border border-warning/20">
            <FaCog className="text-base text-warning" />
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Required System Variables
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
                <CodeBlock compact code="C:\Program Files\Java\jdk-17" />
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
                  code="%USERPROFILE%\AppData\Local\Android\Sdk"
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
                    "%JAVA_HOME%\\bin\n%ANDROID_HOME%\\platform-tools\n%ANDROID_HOME%\\cmdline-tools\\latest\\bin"
                  }
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
