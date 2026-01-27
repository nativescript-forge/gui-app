import type { Theme } from "./types";

export function getBrandAssets(theme: Theme) {
  if (theme === "dark") {
    return {
      logoSrc: "/nsf-light.svg",
      iconSrc: "/nsf-light-io.svg",
    };
  }

  return {
    logoSrc: "/nsf-dark.svg",
    iconSrc: "/nsf-dark-io.svg",
  };
}
