export type Route =
  | "setup"
  | "home"
  | "create"
  | "projects"
  | "app-actions"
  | "app-plugins"
  | "app-permissions"
  | "app-config"
  | "app-platform-config"
  | "app-resources"
  | "app-fonts"
  | "activity"
  | "settings";

export type Theme = "light" | "dark";

export type ActivityLog = {
  id: number;
  activity_type: string;
  description: string;
  status: string;
  timestamp: string;
  metadata?: string | null;
};

export type ProjectRow = {
  id: number;
  name: string;
  path: string;
  nativescript_version: string | null;
  framework: string | null;
  platforms: string | null;
  last_opened: number | null;
  created_at?: number | null;
  plugins_count?: number;
  permissions_count?: number;
  version_code?: string | null;
  version_name?: string | null;
  target_sdk?: string | null;
  min_sdk?: string | null;
  ks_path?: string | null;
  ks_password?: string | null;
  ks_alias?: string | null;
  ks_alias_password?: string | null;
};

export type ProjectAnalysis = {
  name: string;
  path: string;
  nativescriptVersion?: string | null;
  framework?: string | null;
  platforms: string[];
  pluginsCount: number;
  permissionsCount: number;
  versionCode?: string | null;
  versionName?: string | null;
  targetSdk?: string | null;
  minSdk?: string | null;
  createdAt: number;
};

export type DoctorCheck = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error" | "skipped" | string;
  summary: string;
  details?: string | null;
  hint?: string | null;
};

export type CommandResult = {
  statusCode?: number | null;
  stdout: string;
  stderr: string;
  command?: string | null;
};

export type AdbDevice = {
  id: string;
  model: string;
  status: string;
  platform: "android" | "ios" | "visionos";
};

export type RunConfig = {
  platform: "android" | "ios";
  action: "run" | "debug";
  mode?: "debug" | "release";
  format?: "apk" | "aab" | "ipa";
  buildType?: "local" | "cloud" | "simulator";
  deviceId?: string;
  emulator?: boolean;
  debugBrk?: boolean;
  start?: boolean;
  timeout?: number;
  noWatch?: boolean;
  clean?: boolean;
  noHmr?: boolean;
  aab?: boolean;
  force?: boolean;
  uglify?: boolean;
  aot?: boolean;
  snapshot?: boolean;
  v8cache?: boolean;
  compileSnapshot?: boolean;
  report?: boolean;
  sourceMap?: boolean;
  hiddenSourceMap?: boolean;
  additionalOptions?: string;
};

export type BuildConfig = {
  platform: "android" | "ios";
  mode: "debug" | "release";
  format: "apk" | "aab" | "ipa";
  buildType: "local" | "cloud" | "simulator";
  keyStorePath?: string;
  keyStorePassword?: string;
  keyStoreAlias?: string;
  keyStoreAliasPassword?: string;
  additionalOptions?: string;
  clean?: boolean;
  aot?: boolean;
  snapshot?: boolean;
  v8cache?: boolean;
  compileSnapshot?: boolean;
  uglify?: boolean;
  report?: boolean;
  sourceMap?: boolean;
  hiddenSourceMap?: boolean;
  force?: boolean;
  compileSdk?: string;
  copyTo?: string;
};

// NativeScript Config Types
export interface IConfigPlatform {
  id?: string;
  discardUncaughtJsExceptions?: boolean;
}

export interface IOSSPMPackageBase {
  name: string;
  libs: string[];
  targets?: string[];
}

export interface IOSRemoteSPMPackage extends IOSSPMPackageBase {
  repositoryURL: string;
  version: string;
}

export interface IOSLocalSPMPackage extends IOSSPMPackageBase {
  path: string;
}

export type IOSSPMPackage = IOSRemoteSPMPackage | IOSLocalSPMPackage;

export interface IConfigIOS extends IConfigPlatform {
  SPMPackages?: Array<IOSSPMPackage>;
  NativeSource?: Array<{
    name: string;
    path: string;
  }>;
}

export interface IConfigVisionOS extends IConfigIOS {}

export interface IConfigAndroid extends IConfigPlatform {
  v8Flags?: string;
  codeCache?: boolean;
  heapSnapshotScript?: string;
  SnapshotFile?: string;
  profilerOutputDir?: string;
  gcThrottleTime?: number;
  markingMode?: string;
  handleTimeZoneChanges?: boolean;
  maxLogcatObjectSize?: number;
  forceLog?: boolean;
  memoryCheckInterval?: number;
  freeMemoryRatio?: number;
  enableLineBreakpoints?: boolean;
  enableMultithreadedJavascript?: boolean;
}

export interface IConfigCLI {
  packageManager: "yarn" | "pnpm" | "npm";
  pathsToClean?: string[];
  additionalPathsToClean?: string[];
}

export interface IConfigHook {
  type: string;
  script: string;
}

export interface IConfigEmbedProps {
  hostProjectPath?: string;
  hostProjectModuleName?: string;
}

export interface IConfigEmbed extends IConfigEmbedProps {
  ios?: IConfigEmbedProps;
  android?: IConfigEmbedProps;
}

export interface ISecurityConfig {
  allowRemoteModules: boolean;
  remoteModuleAllowlist?: string[];
}

export type BundlerType = "webpack" | "vite";

export interface NativeScriptConfig {
  id?: string;
  main?: string;
  appPath?: string;
  appResourcesPath?: string;
  shared?: boolean;
  previewAppSchema?: string;
  overridePods?: string;
  projectName?: string;
  embed?: IConfigEmbed;
  webpackConfigPath?: string;
  bundlerConfigPath?: string;
  bundler?: BundlerType;
  logScriptLoading?: boolean;
  showErrorDisplay?: boolean;
  ios?: IConfigIOS;
  visionos?: IConfigVisionOS;
  android?: IConfigAndroid;
  profiling?: string;
  cssParser?: "rework" | "nativescript" | "css-tree";
  ignoredNativeDependencies?: string[];
  cli?: IConfigCLI;
  hooks?: IConfigHook[];
  security?: ISecurityConfig;
}
