import { useState } from "react";
import {
  FiArrowLeft,
  FiFolder,
  FiPackage,
  FiLayers,
  FiCheckCircle,
} from "react-icons/fi";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

type CreateProjectPageProps = {
  onBack: () => void;
  onCreate: (config: ProjectConfig) => void;
  isCreating: boolean;
};

export type ProjectConfig = {
  name: string;
  parentPath: string;
  flavor: string;
  template: string;
  platform: "standard" | "vision";
};

const FLAVORS = [
  {
    id: "ts",
    label: "TypeScript",
    icon: "/assets/images/flavors/typescript.svg",
    category: "official",
  },
  {
    id: "js",
    label: "JavaScript",
    icon: "/assets/images/flavors/javascript.svg",
    category: "official",
  },
  {
    id: "angular",
    label: "Angular",
    icon: "/assets/images/flavors/angular.svg",
    category: "community",
  },
  {
    id: "vue",
    label: "Vue",
    icon: "/assets/images/flavors/vue.svg",
    category: "community",
  },
  {
    id: "react",
    label: "React",
    icon: "/assets/images/flavors/reactjs.svg",
    category: "community",
  },
  {
    id: "solid",
    label: "Solid",
    icon: "/assets/images/flavors/solid.svg",
    category: "community",
  },
  {
    id: "svelte",
    label: "Svelte",
    icon: "/assets/images/flavors/svelte.svg",
    category: "community",
  },
];

const TEMPLATES = [
  // --- STANDARD PLATFORM TEMPLATES ---
  // Blank Templates
  {
    id: "@nativescript/template-blank",
    label: "Blank",
    description: "A basic blank template",
    platforms: ["standard"],
    flavors: ["js"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-ts",
    label: "Blank (TypeScript)",
    description: "A basic blank template using TypeScript",
    platforms: ["standard"],
    flavors: ["ts"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-ng",
    label: "Blank (Angular)",
    description: "A basic blank template using Angular",
    platforms: ["standard"],
    flavors: ["angular"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-react",
    label: "Blank (React)",
    description: "A basic blank template using React",
    platforms: ["standard"],
    flavors: ["react"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-vue",
    label: "Blank (Vue)",
    description: "A basic blank template using Vue.js",
    platforms: ["standard"],
    flavors: ["vue"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-vue-ts",
    label: "Blank (Vue + TS)",
    description: "A basic blank template using Vue.js and TypeScript",
    platforms: ["standard"],
    flavors: ["vue"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-svelte",
    label: "Blank (Svelte)",
    description: "A basic blank template using Svelte",
    platforms: ["standard"],
    flavors: ["svelte"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },
  {
    id: "@nativescript/template-blank-solid",
    label: "Blank (Solid)",
    description: "A basic blank template using Solid",
    platforms: ["standard"],
    flavors: ["solid"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },

  {
    id: "@nativescript/template-blank-solid-ts",
    label: "Blank (Solid + TS)",
    description: "A basic blank template using Solid and TypeScript",
    platforms: ["standard"],
    flavors: ["solid"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-blank-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-blank-ios.png",
    },
  },

  // Navigation Templates
  {
    id: "@nativescript/template-drawer-navigation",
    label: "Drawer Navigation",
    description: "Side drawer navigation pattern",
    platforms: ["standard"],
    flavors: ["js", "ts"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-drawer-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-drawer-ios.png",
    },
  },
  {
    id: "@nativescript/template-drawer-navigation-ng",
    label: "Drawer Navigation (Angular)",
    description: "Side drawer navigation pattern for Angular",
    platforms: ["standard"],
    flavors: ["angular"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-drawer-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-drawer-ios.png",
    },
  },
  {
    id: "@nativescript/template-drawer-navigation-vue",
    label: "Drawer Navigation (Vue)",
    description: "Side drawer navigation pattern for Vue.js",
    platforms: ["standard"],
    flavors: ["vue"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-drawer-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-drawer-ios.png",
    },
  },
  {
    id: "@nativescript/template-tab-navigation",
    label: "Tab Navigation",
    description: "Bottom tab navigation pattern",
    platforms: ["standard"],
    flavors: ["js", "ts"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-tab-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-tab-ios.png",
    },
  },
  {
    id: "@nativescript/template-tab-navigation-ng",
    label: "Tab Navigation (Angular)",
    description: "Bottom tab navigation pattern for Angular",
    platforms: ["standard"],
    flavors: ["angular"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-tab-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-tab-ios.png",
    },
  },
  {
    id: "@nativescript/template-tab-navigation-vue",
    label: "Tab Navigation (Vue)",
    description: "Bottom tab navigation pattern for Vue.js",
    platforms: ["standard"],
    flavors: ["vue"],
    previews: {
      android: "/assets/images/phone-mockup/appTemplate-tab-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-tab-ios.png",
    },
  },
  {
    id: "@nativescript/template-master-detail",
    label: "Master-Detail",
    description: "List and detail view pattern",
    platforms: ["standard"],
    flavors: ["js", "ts"],
    previews: {
      android:
        "/assets/images/phone-mockup/appTemplate-masterdetail-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-masterdetail-ios.png",
    },
  },
  {
    id: "@nativescript/template-master-detail-vue",
    label: "Master-Detail (Vue)",
    description: "List and detail view pattern for Vue.js",
    platforms: ["standard"],
    flavors: ["vue"],
    previews: {
      android:
        "/assets/images/phone-mockup/appTemplate-masterdetail-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-masterdetail-ios.png",
    },
  },
  {
    id: "@nativescript/template-master-detail-ng",
    label: "Master-Detail (Angular)",
    description: "List and detail view pattern for Angular",
    platforms: ["standard"],
    flavors: ["angular"],
    previews: {
      android:
        "/assets/images/phone-mockup/appTemplate-masterdetail-android.png",
      ios: "/assets/images/phone-mockup/appTemplate-masterdetail-ios.png",
    },
  },

  // --- VISION PLATFORM TEMPLATES ---
  {
    id: "@nativescript/template-hello-world-ts-vision",
    label: "visionOS Hello World (TypeScript)",
    description: "A complete example for Apple visionOS using TypeScript",
    platforms: ["vision"],
    flavors: ["ts"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
  {
    id: "@nativescript/template-hello-world-ng-vision",
    label: "visionOS Hello World (Angular)",
    description: "A complete example for Apple visionOS using Angular",
    platforms: ["vision"],
    flavors: ["angular"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
  {
    id: "@nativescript/template-blank-react-vision",
    label: "visionOS Blank (React)",
    description: "A basic blank template for Apple visionOS using React",
    platforms: ["vision"],
    flavors: ["react"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
  {
    id: "@nativescript/template-blank-vue-vision",
    label: "visionOS Blank (Vue)",
    description: "A basic blank template for Apple visionOS using Vue.js",
    platforms: ["vision"],
    flavors: ["vue"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
  {
    id: "@nativescript/template-blank-svelte-vision",
    label: "visionOS Blank (Svelte)",
    description: "A basic blank template for Apple visionOS using Svelte",
    platforms: ["vision"],
    flavors: ["svelte"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
  {
    id: "@nativescript/template-blank-solid-vision",
    label: "visionOS Blank (Solid)",
    description: "A basic blank template for Apple visionOS using Solid",
    platforms: ["vision"],
    flavors: ["solid"],
    previews: {
      vision: "/assets/images/phone-mockup/appTemplate-blank-vision.png",
    },
  },
];

export function CreateProjectPage(props: CreateProjectPageProps) {
  const [name, setName] = useState("");
  const [parentPath, setParentPath] = useState("");
  const [flavor, setFlavor] = useState("angular");
  const [template, setTemplate] = useState("@nativescript/template-blank");
  const [platform, setPlatform] = useState<"standard" | "vision">("standard");
  const [previewPlatform, setPreviewPlatform] = useState<
    "android" | "ios" | "vision"
  >("android");

  // Filter flavors based on available templates for the selected platform
  const filteredFlavors = FLAVORS.filter((f) =>
    TEMPLATES.some(
      (t: any) => t.platforms.includes(platform) && t.flavors.includes(f.id),
    ),
  );

  // Filter templates based on both platform and selected flavor
  const filteredTemplates = TEMPLATES.filter(
    (t: any) => t.platforms.includes(platform) && t.flavors.includes(flavor),
  );

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);
  const selectedFlavor = FLAVORS.find((f) => f.id === flavor);

  const handlePlatformChange = (p: "standard" | "vision") => {
    setPlatform(p);

    // Get available flavors for the new platform
    const availableFlavors = FLAVORS.filter((f) =>
      TEMPLATES.some(
        (t: any) => t.platforms.includes(p) && t.flavors.includes(f.id),
      ),
    );

    // Check if current flavor is available on the new platform
    const isFlavorAvailable = availableFlavors.some((f) => f.id === flavor);
    let nextFlavor = flavor;

    if (!isFlavorAvailable && availableFlavors.length > 0) {
      // If current flavor is not available, pick the first one from the new platform (prefer ts or angular)
      const preferred =
        availableFlavors.find((f) => f.id === "ts") ||
        availableFlavors.find((f) => f.id === "angular") ||
        availableFlavors[0];
      nextFlavor = preferred.id;
      setFlavor(nextFlavor);
    }

    if (p === "vision") {
      setPreviewPlatform("vision");
    } else {
      setPreviewPlatform("android");
    }

    // Find the first available template for the new platform and selected/new flavor
    const firstCompatibleTemplate = TEMPLATES.find(
      (t: any) => t.platforms.includes(p) && t.flavors.includes(nextFlavor),
    );

    if (firstCompatibleTemplate) {
      setTemplate(firstCompatibleTemplate.id);
    }
  };

  const handleFlavorChange = (f: string) => {
    setFlavor(f);
    // Find the first available template for this flavor and the current platform
    const firstCompatibleTemplate = TEMPLATES.find(
      (t: any) => t.platforms.includes(platform) && t.flavors.includes(f),
    );

    if (firstCompatibleTemplate) {
      setTemplate(firstCompatibleTemplate.id);
    }
  };

  const [error, setError] = useState("");

  const validateName = (val: string) => {
    if (!val) return "Project name is required";
    if (/\s/.test(val)) return "Spaces are not allowed";
    if (/[^a-zA-Z0-9_-]/.test(val)) return "Special characters are not allowed";
    if (/^\d/.test(val)) return "Project name cannot start with a number";
    return "";
  };

  const handleBrowse = async () => {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Select Parent Directory",
    });
    if (typeof selected === "string") {
      setParentPath(selected);
    }
  };

  const handleSubmit = () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!parentPath) {
      setError("Please select a parent directory");
      return;
    }
    setError("");
    props.onCreate({ name, parentPath, flavor, template, platform });
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-4 mb-8">
        <button className="btn btn-ghost btn-circle" onClick={props.onBack}>
          <FiArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">Create New Project</h1>
          <p className="text-sm opacity-50 uppercase tracking-widest mt-1">
            NativeScript Project Wizard
          </p>
        </div>
        <div className="join bg-base-200 p-1 rounded-2xl shadow-inner border border-base-300">
          <button
            className={`btn btn-sm join-item px-6 transition-all ${platform === "standard" ? "btn-primary shadow-md" : "btn-ghost opacity-60"}`}
            onClick={() => handlePlatformChange("standard")}
          >
            Android & iOS
          </button>
          <button
            className={`btn btn-sm join-item px-6 transition-all ${platform === "vision" ? "btn-primary shadow-md" : "btn-ghost opacity-60"}`}
            onClick={() => handlePlatformChange("vision")}
          >
            VisionOS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Step 1: Project Details */}
          <section className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 mb-4">
                <FiPackage className="text-primary" /> Project Details
              </h2>
              <div className="grid gap-6">
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase tracking-wider opacity-60">
                      Project Name
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="my-cool-app"
                    className={`input input-bordered w-full bg-base-50/50 focus:bg-base-100 transition-all ${error && validateName(name) ? "input-error" : "focus:border-primary"}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                  />
                  <label className="label py-1">
                    <span className="label-text-alt opacity-40 text-[10px]">
                      No spaces, no special characters, cannot start with a
                      number.
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase tracking-wider opacity-60">
                      Parent Directory
                    </span>
                  </label>
                  <div className="join w-full shadow-sm">
                    <input
                      type="text"
                      className="input input-bordered join-item flex-1 bg-base-50/50 cursor-default"
                      value={parentPath}
                      readOnly
                      placeholder="Select a folder..."
                    />
                    <button
                      className="btn btn-neutral join-item px-6 hover:bg-primary hover:border-primary transition-colors transition-all"
                      onClick={handleBrowse}
                    >
                      <FiFolder className="mr-2" /> Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Flavor */}
          <section className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 mb-6">
                <FiLayers className="text-primary" /> Choose Flavor
              </h2>

              {/* Official / Core Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Official Core
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredFlavors
                    .filter((f) => f.category === "official")
                    .map((f) => (
                      <button
                        key={f.id}
                        className={`btn h-auto py-6 flex flex-col gap-3 transition-all duration-300 border-2 group ${
                          flavor === f.id
                            ? "btn-primary border-primary shadow-md scale-[1.02]"
                            : "bg-base-50 border-transparent hover:border-primary/30 hover:bg-base-100 opacity-80 hover:opacity-100"
                        }`}
                        onClick={() => handleFlavorChange(f.id)}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-white rounded-xl shadow-inner transition-transform group-hover:scale-110">
                          <img
                            src={f.icon}
                            alt={f.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {f.label}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Community Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-2 py-0.5">
                    Community Flavors
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-base-content/10 to-transparent"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredFlavors
                    .filter((f) => f.category === "community")
                    .map((f) => (
                      <button
                        key={f.id}
                        className={`btn h-auto py-6 flex flex-col gap-3 transition-all duration-300 border-2 group ${
                          flavor === f.id
                            ? "btn-primary border-primary shadow-md scale-[1.02]"
                            : "bg-base-50 border-transparent hover:border-primary/30 hover:bg-base-100 opacity-80 hover:opacity-100"
                        }`}
                        onClick={() => handleFlavorChange(f.id)}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-white rounded-xl shadow-inner transition-transform group-hover:scale-110">
                          <img
                            src={f.icon}
                            alt={f.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {f.label}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Template */}
          <section className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="card-body p-0">
              <div className="p-6 border-b border-base-200 bg-base-50/30">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="card-title flex items-center gap-2">
                    <FiCheckCircle className="text-primary" /> Select Template
                  </h2>
                  {platform === "standard" && (
                    <div className="join bg-base-200 p-0.5 rounded-xl border border-base-300">
                      <button
                        className={`btn btn-xs join-item px-4 ${previewPlatform === "android" ? "btn-primary shadow-sm" : "btn-ghost opacity-50"}`}
                        onClick={() => setPreviewPlatform("android")}
                      >
                        Android
                      </button>
                      <button
                        className={`btn btn-xs join-item px-4 ${previewPlatform === "ios" ? "btn-primary shadow-sm" : "btn-ghost opacity-50"}`}
                        onClick={() => setPreviewPlatform("ios")}
                      >
                        iOS
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs opacity-50">
                  Choose a starting point for your application UI
                </p>
              </div>

              {/* Preview Area (Top) */}
              {platform === "standard" && (
                <div className="bg-base-200/30 p-8 flex justify-center items-center min-h-[500px] border-b border-base-200 relative">
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, currentColor 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  ></div>

                  {/* Realistic Phone Frame */}
                  <div className="relative">
                    {/* Phone Bezel */}
                    <div className="relative z-10 bg-[#1a1a1a] p-3 rounded-[3rem] shadow-[0_0_0_2px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.3)] border-4 border-[#333]">
                      {/* Notch/Speaker - Integrated with top bezel */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-3xl z-20 flex items-center justify-center pt-1">
                        <div className="w-12 h-1.5 bg-[#333] rounded-full border border-white/5 shadow-inner"></div>
                      </div>

                      {/* Screen Content */}
                      <div className="relative overflow-hidden rounded-[2.2rem] bg-base-100 h-[480px] w-[240px]">
                        {selectedTemplate?.previews &&
                        (selectedTemplate.previews as any)[previewPlatform] ? (
                          <img
                            src={
                              (selectedTemplate.previews as any)[
                                previewPlatform
                              ]
                            }
                            alt="Template Preview"
                            className="w-full h-full object-contain bg-white animate-in fade-in zoom-in duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-base-200 text-base-content/20 gap-4">
                            <FiPackage className="w-12 h-12" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              No Preview
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Home Indicator (iOS style) */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-black/20 rounded-full"></div>
                    </div>

                    {/* Phone Shadow/Reflection */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/20 blur-3xl rounded-full"></div>
                  </div>

                  <div className="absolute bottom-6 right-6">
                    <div className="badge badge-neutral gap-2 py-3 px-4 border-base-300 shadow-sm uppercase text-[10px] tracking-widest font-bold">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      Live Preview
                    </div>
                  </div>
                </div>
              )}

              {/* Template List (Bottom) */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTemplates.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                      template === t.id
                        ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                        : "border-base-200 hover:border-base-300 hover:bg-base-50"
                    }`}
                  >
                    <div className="mt-1">
                      <input
                        type="radio"
                        name="template"
                        className="radio radio-primary radio-sm"
                        checked={template === t.id}
                        onChange={() => setTemplate(t.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm group-hover:text-primary transition-colors">
                        {t.label}
                      </div>
                      <div className="text-[11px] opacity-60 leading-tight mt-1">
                        {t.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="card bg-neutral text-neutral-content sticky top-6">
            <div className="card-body">
              <h2 className="card-title text-sm uppercase tracking-widest opacity-70">
                Summary
              </h2>
              <div className="space-y-4 mt-4">
                <div>
                  <div className="text-[10px] opacity-50 uppercase">
                    Project Name
                  </div>
                  <div className="font-bold truncate">{name || "Not set"}</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-50 uppercase">Flavor</div>
                  <div className="font-bold">
                    {selectedFlavor?.label || "Not selected"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] opacity-50 uppercase">
                    Template
                  </div>
                  <div className="font-bold text-xs">
                    {selectedTemplate?.label || "Not selected"}
                  </div>
                </div>
                <div className="divider opacity-10"></div>
                {error && (
                  <div className="alert alert-error text-xs py-2 rounded-lg">
                    <span>{error}</span>
                  </div>
                )}
                <button
                  className={`btn btn-primary w-full ${props.isCreating ? "loading" : ""}`}
                  disabled={props.isCreating}
                  onClick={handleSubmit}
                >
                  {props.isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
