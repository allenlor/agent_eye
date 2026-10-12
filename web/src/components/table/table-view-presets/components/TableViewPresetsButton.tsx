import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { t } from "@/src/features/i18n";

type TableViewPresetsButtonProps = Pick<
  ComponentProps<typeof Button>,
  | "id"
  | "ref"
  | "onClick"
  | "onPointerDown"
  | "onKeyDown"
  | "aria-expanded"
  | "aria-controls"
  | "aria-haspopup"
> & {
  selectedView: {
    name: string;
    defaultLabel: "Your default" | "Project default" | null;
  } | null;
  count: number;
};

export function TableViewPresetsButton({
  selectedView,
  count,
  ...props
}: TableViewPresetsButtonProps) {
  const label = selectedView?.name ?? t("My Views");
  const title = selectedView?.defaultLabel
    ? `${label} (${t(selectedView.defaultLabel)})`
    : label;

  return (
    <Button
      {...props}
      variant={selectedView ? "default" : "outline"}
      className="max-w-64 gap-1.5"
      title={title}
    >
      <span className="truncate" title={title}>
        {label}
      </span>
      {selectedView ? (
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <span className="bg-input rounded-sm px-1 text-xs">{count}</span>
      )}
    </Button>
  );
}
