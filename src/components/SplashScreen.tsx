import type { Theme } from "../shared/types";

type SplashScreenProps = {
  theme: Theme;
  logoSrc: string;
  bootStatus?: string;
};

export function SplashScreen(props: SplashScreenProps) {
  return (
    <div
      data-theme={props.theme}
      data-tauri-drag-region
      className="flex-1 h-screen w-full bg-base-200 text-base-content overflow-hidden select-none"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
        <div className="card p-6 shadow-none border-none animate-bounce">
          <img
            src={props.logoSrc}
            alt="NativeScript Forge"
            className="h-24 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <span className="text-sm font-medium opacity-70">
              {props.bootStatus || "Preparing app…"}
            </span>
          </div>
          {props.bootStatus && (
            <div className="text-[10px] uppercase tracking-widest opacity-30 font-bold">
              Initialization in progress
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
