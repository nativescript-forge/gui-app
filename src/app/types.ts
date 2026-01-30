export type Route =
  | "home"
  | "create"
  | "projects"
  | "app-doctor"
  | "app-actions"
  | "app-plugins"
  | "app-permissions"
  | "app-config";

export type Theme = "light" | "dark";

export type ProjectRow = {
  id: number;
  name: string;
  path: string;
  nativescript_version: string | null;
  framework: string | null;
  platforms: string | null;
  last_opened: number | null;
  plugins_count?: number;
  permissions_count?: number;
  version_code?: string | null;
  version_name?: string | null;
  target_sdk?: string | null;
  min_sdk?: string | null;
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
};

export type AdbDevice = {
  id: string;
  model: string;
  status: string;
  platform: "android" | "ios" | "visionos";
};
