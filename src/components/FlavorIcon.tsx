const flavorIcons: Record<string, string> = {
  Angular: "/assets/images/flavors/angular.svg",
  React: "/assets/images/flavors/reactjs.svg",
  Solid: "/assets/images/flavors/solid.svg",
  Svelte: "/assets/images/flavors/svelte.svg",
  Vue: "/assets/images/flavors/vue.svg",
  Core: "/assets/images/flavors/typescript.svg",
  "Core (TS)": "/assets/images/flavors/typescript.svg",
  "Core (JS)": "/assets/images/flavors/javascript.svg",
};

export function getFlavorIcon(
  framework: string | null | undefined,
): string | null {
  if (!framework) return null;

  // Try direct match
  if (flavorIcons[framework]) return flavorIcons[framework];

  // Try case-insensitive match
  const key = Object.keys(flavorIcons).find(
    (k) => k.toLowerCase() === framework.toLowerCase(),
  );

  return key ? flavorIcons[key] : null;
}

interface FlavorIconProps {
  framework: string | null | undefined;
  showLabel?: boolean;
  iconClassName?: string;
  className?: string;
}

export function FlavorIcon({
  framework,
  showLabel = true,
  iconClassName = "w-4 h-4",
  className = "flex items-center gap-1.5",
}: FlavorIconProps) {
  const icon = getFlavorIcon(framework);

  if (!icon) {
    return (
      <div className={className}>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">
          {framework || "-"}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={iconClassName}>
        <img
          src={icon}
          alt={framework || "flavor"}
          className="w-full h-full object-contain"
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
          {framework}
        </span>
      )}
    </div>
  );
}
