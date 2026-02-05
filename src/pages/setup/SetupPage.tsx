import React, { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  FaWindows,
  FaLinux,
  FaApple,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaRocket,
} from "react-icons/fa";
import { IntroPage } from "./intro/IntroPage";
import { WindowsSetup } from "./environment/windows/WindowsSetup";
import { LinuxSetup } from "./environment/linux/LinuxSetup";
import { MacOSSetup } from "./environment/macOS/MacOSSetup";
import { getBrandAssets } from "../../app/brand";

interface SetupPageProps {
  onComplete: () => void;
  theme: "light" | "dark";
}

export type OS = "windows" | "linux" | "macos";

export const SetupPage: React.FC<SetupPageProps> = ({ onComplete, theme }) => {
  const [os, setOs] = useState<OS | null>(null);
  const [step, setStep] = useState<
    "intro" | "select-os" | "wizard" | "complete"
  >("intro");

  useEffect(() => {
    const isLegalAgreed =
      localStorage.getItem("ns-forge-legal-agreed") === "true";
    const isDev = import.meta.env.DEV;

    if (isLegalAgreed) {
      if (isDev) {
        setStep("select-os");
      } else {
        setStep("wizard");
      }
    } else {
      setStep("intro");
    }
  }, []);

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("win")) setOs("windows");
    else if (platform.includes("linux")) setOs("linux");
    else if (platform.includes("mac")) setOs("macos");

    // Lock window to maximized and disable maximize controls on mount
    const lockWindow = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.maximize();
        await appWindow.setResizable(false);
        await appWindow.setMaximizable(false);
        // keep minimizable true
        await appWindow.setMinimizable(true);
      } catch (error) {
        console.error("Failed to lock window:", error);
      }
    };
    lockWindow();

    // Unlock window on unmount
    return () => {
      const unlockWindow = async () => {
        try {
          const appWindow = getCurrentWindow();
          await appWindow.setResizable(true);
          await appWindow.setMaximizable(true);
          await appWindow.setMinimizable(true);
        } catch (error) {
          console.error("Failed to unlock window:", error);
        }
      };
      unlockWindow();
    };
  }, []);

  const handleFinishSetup = () => {
    localStorage.setItem("ns-forge-setup-completed", "true");
    setStep("complete");
  };

  const handleAgreeLegal = () => {
    localStorage.setItem("ns-forge-legal-agreed", "true");
    const isDev = import.meta.env.DEV;
    if (isDev) {
      setStep("select-os");
    } else {
      setStep("wizard");
    }
  };

  const { logoSrc } = getBrandAssets(theme);
  const isDev = import.meta.env.DEV;

  const renderContent = () => {
    switch (step) {
      case "intro":
        return <IntroPage onAgree={handleAgreeLegal} theme={theme} />;
      case "select-os":
        return (
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center space-y-4">
              <img src={logoSrc} alt="NS-Forge Logo" className="w-56 h-auto" />
              <p className="text-base-content/60 text-lg max-w-md text-center">
                Let's get your environment ready for NativeScript development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
              <OSCard
                icon={<FaWindows className="text-5xl" />}
                label="Windows"
                selected={os === "windows"}
                onClick={() => setOs("windows")}
              />
              <OSCard
                icon={<FaLinux className="text-5xl" />}
                label="Linux"
                selected={os === "linux"}
                onClick={() => setOs("linux")}
              />
              <OSCard
                icon={<FaApple className="text-5xl" />}
                label="macOS"
                selected={os === "macos"}
                onClick={() => setOs("macos")}
              />
            </div>

            <button
              className="btn btn-primary btn-lg gap-2 px-8"
              disabled={!os}
              onClick={() => setStep("wizard")}
            >
              Start Setup <FaArrowRight />
            </button>
          </div>
        );

      case "wizard":
        return (
          <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-in slide-in-from-right duration-500">
            {isDev && (
              <div className="flex items-center justify-between mb-8">
                <button
                  className="btn btn-ghost gap-2"
                  onClick={() => setStep("select-os")}
                >
                  <FaArrowLeft /> Change OS
                </button>
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline gap-2 p-4">
                    {os === "windows" && <FaWindows />}
                    {os === "linux" && <FaLinux />}
                    {os === "macos" && <FaApple />}
                    <span className="capitalize">{os} Setup</span>
                  </span>
                </div>
              </div>
            )}

            {os === "windows" && <WindowsSetup onFinish={handleFinishSetup} />}
            {os === "linux" && <LinuxSetup onFinish={handleFinishSetup} />}
            {os === "macos" && <MacOSSetup onFinish={handleFinishSetup} />}
          </div>
        );

      case "complete":
        return (
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <FaCheckCircle className="text-9xl text-success" />
              <div className="absolute -top-2 -right-2">
                <span className="flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-success"></span>
                </span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">You're All Set!</h1>
              <p className="text-base-content/70 text-lg max-w-md">
                Your environment is configured and ready for NativeScript.
              </p>
            </div>

            <button
              className="btn btn-primary btn-lg gap-2 px-12"
              onClick={onComplete}
            >
              Go to Dashboard <FaRocket />
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className="h-full bg-base-300 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative"
      data-theme={theme}
    >
      <div className="w-full max-w-6xl">{renderContent()}</div>
    </div>
  );
};

interface OSCardProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const OSCard: React.FC<OSCardProps> = ({ icon, label, selected, onClick }) => (
  <div
    className={`card bg-base-100 shadow-xl cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
      selected
        ? "border-primary ring-2 ring-primary/20"
        : "border-transparent hover:border-primary/50"
    }`}
    onClick={onClick}
  >
    <div className="card-body items-center text-center p-8">
      <div
        className={`${selected ? "text-primary" : "text-base-content/50"} transition-colors`}
      >
        {icon}
      </div>
      <h2 className={`card-title mt-4 ${selected ? "text-primary" : ""}`}>
        {label}
      </h2>
    </div>
  </div>
);
