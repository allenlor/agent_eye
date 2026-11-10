import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
import { cn } from "@/src/utils/tailwind";
import { PlusIcon } from "lucide-react";

export const LangfuseLogo = ({
  logoLightModeHref,
  logoDarkModeHref,
}: {
  logoLightModeHref?: string;
  logoDarkModeHref?: string;
}) => {
  if (logoLightModeHref && logoDarkModeHref) {
    // logo is a url, maximum aspect ratio of 1:3 needs to be supported according to docs
    return (
      <div className="flex items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoLightModeHref}
          alt="AgentEye"
          className={cn(
            "group-data-[collapsible=icon]:hidden dark:hidden",
            "max-h-4 max-w-14",
          )}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDarkModeHref}
          alt="AgentEye"
          className={cn(
            "hidden group-data-[collapsible=icon]:hidden dark:block",
            "max-h-4 max-w-14",
          )}
        />
        <PlusIcon size={8} className="group-data-[collapsible=icon]:hidden" />
        <LangfuseIcon size={16} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
        AgentEye
      </span>
      <div className="hidden scale-120 group-data-[collapsible=icon]:block">
        <LangfuseIcon size={28} />
      </div>
    </div>
  );
};
