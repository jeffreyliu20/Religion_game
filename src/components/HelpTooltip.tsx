import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

type HelpTooltipProps = {
  label: string;
  children: ReactNode;
};

export default function HelpTooltip({ label, children }: HelpTooltipProps) {
  return (
    <span className="help-tooltip">
      <button type="button" aria-label={label}>
        <HelpCircle size={14} />
      </button>
      <span className="tooltip-bubble" role="tooltip">
        {children}
      </span>
    </span>
  );
}
