export type Route =
  | "home"
  | "create"
  | "projects"
  | "app-doctor"
  | "app-actions"
  | "app-plugins"
  | "app-permissions"
  | "app-config"
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
  compileSnapshot?: boolean;
  uglify?: boolean;
  report?: boolean;
  sourceMap?: boolean;
  hiddenSourceMap?: boolean;
  force?: boolean;
  compileSdk?: string;
  copyTo?: string;
};
