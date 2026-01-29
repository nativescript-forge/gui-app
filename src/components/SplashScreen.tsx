import type { Theme } from "../app/types";

type SplashScreenProps = {
  theme: Theme;
  logoSrc: string;
};

export function SplashScreen(props: SplashScreenProps) {
  return (
    <div
      data-theme={props.theme}
      data-tauri-drag-region
      className="flex-1 h-screen w-full bg-base-200 text-base-content overflow-hidden select-none"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
        <div className="card p-6 shadow-none border-none">
          <img
            src={props.logoSrc}
            alt="NativeScript Forge"
            className="h-24 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-md" />
          <span className="text-sm opacity-70">Preparing app…</span>
        </div>
      </div>
    </div>
  );
}
