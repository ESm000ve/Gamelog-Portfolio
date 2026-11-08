import type { ReactElement } from "react";
import { Button } from "../../components/ui/Button";

export function ActivityTabs<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: ReactElement; controls: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="activity-filter-buttons">
      {options.map((option) => (
        <Button
          key={option.value}
          aria-pressed={value === option.value}
          variant={value === option.value ? "primary" : "secondary"}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
