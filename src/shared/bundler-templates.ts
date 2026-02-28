export type ProjectFlavor =
  | "angular"
  | "vue"
  | "vue2"
  | "react"
  | "svelte"
  | "solid"
  | "core";

export const getViteTemplate = (flavor: ProjectFlavor): string => {
  const configMap: Record<string, string> = {
    angular: "angularConfig",
    vue: "vueConfig",
    vue2: "vueConfig",
    react: "reactConfig",
    svelte: "svelteConfig",
    solid: "solidConfig",
    core: "typescriptConfig",
  };

  const helper = configMap[flavor] || "typescriptConfig";

  return `import { defineConfig, mergeConfig, UserConfig } from 'vite'
import { ${helper} } from '@nativescript/vite'

export default defineConfig(({ mode }): UserConfig => {
  return mergeConfig(${helper}({ mode }), {})
})`;
};

export const getWebpackTemplate = (_flavor: ProjectFlavor): string => {
  return `const webpack = require("@nativescript/webpack");

module.exports = (env) => {
	webpack.init(env);

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

	return webpack.resolveConfig();
};`;
};
