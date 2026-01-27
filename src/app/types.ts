export type Route =
  | "welcome"
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
};

export type ProjectAnalysis = {
  name: string;
  path: string;
  nativescriptVersion?: string | null;
  framework?: string | null;
  platforms: string[];
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
