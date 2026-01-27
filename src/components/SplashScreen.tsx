import type { Theme } from "../app/types";

type SplashScreenProps = {
  theme: Theme;
  logoSrc: string;
};

export function SplashScreen(props: SplashScreenProps) {
  return (
    <div
      data-theme={props.theme}
      className="h-full w-full bg-base-200 text-base-content"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
        <div className="card bg-base-100 p-6 shadow-xl border border-base-200">
          <img src={props.logoSrc} alt="NativeScript Forge" className="h-20 w-auto" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold">NativeScript Forge</div>
          <div className="mt-1 text-sm opacity-70">
            Visual toolkit for NativeScript developers
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-md" />
          <span className="text-sm opacity-70">Preparing app…</span>
        </div>
      </div>
    </div>
  );
}
