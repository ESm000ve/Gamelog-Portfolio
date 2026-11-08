import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ type = "text", size: _size, ...props }, ref) {
    return <input ref={ref} type={type} {...props} />;
  }
);
export const SelectControl = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectControl({ size: _size, ...props }, ref) {
    return <select ref={ref} {...props} />;
  }
);
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea(props, ref) {
  return <textarea ref={ref} {...props} />;
});

export function CheckControl({
  label,
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <label style={{ display: "inline-flex", flexDirection: "row", alignItems: "start", gap: 8 }}>
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
