"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export type AdminSelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

/** Trigger styles for selects that sit inside form fields. */
export const adminSelectFieldClassName =
  "w-full min-w-0 rounded-md border px-3 py-2 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

/** Trigger styles for the rounded filter selects. */
export const adminSelectPillClassName =
  "min-h-12 w-full min-w-0 rounded-full border border-border bg-card px-5 text-base text-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 xl:min-h-14";

export function AdminSelect({
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  className = adminSelectFieldClassName,
  defaultValue,
  disabled,
  name,
  onValueChange,
  options,
  required,
  value,
}: {
  "aria-describedby"?: string;
  "aria-label"?: string;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  options: AdminSelectOption[];
  required?: boolean;
  value?: string;
}) {
  return (
    <Select.Root
      defaultValue={defaultValue}
      disabled={disabled}
      items={options}
      name={name}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange?.(nextValue);
      }}
      required={required}
      value={value}
    >
      <Select.Trigger
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        className={`flex cursor-pointer items-center justify-between gap-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <Select.Value className="min-w-0 truncate" />
        <Select.Icon className="shrink-0 text-muted-foreground transition-transform data-[popup-open]:rotate-180 motion-reduce:transition-none">
          <ChevronDown aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          alignItemWithTrigger={false}
          className="z-[1001]"
          sideOffset={6}
        >
          <Select.Popup className="max-h-72 w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto overscroll-contain rounded-[12px] border border-border bg-card py-1 text-foreground shadow-lg outline-none transition duration-150 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            {options.map((option) => (
              <Select.Item
                className="flex min-h-10 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-secondary"
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="shrink-0">
                  <Check aria-hidden="true" className="size-4" strokeWidth={1.8} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
