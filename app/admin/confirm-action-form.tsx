"use client";

import type { ReactNode } from "react";

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  ariaLabel?: string;
  buttonClassName: string;
  buttonContent: ReactNode;
  confirmMessage: string;
  fields: Record<string, string>;
};

export function ConfirmActionForm({
  action,
  ariaLabel,
  buttonClassName,
  buttonContent,
  confirmMessage,
  fields,
}: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        aria-label={ariaLabel}
        className={buttonClassName}
        type="submit"
      >
        {buttonContent}
      </button>
    </form>
  );
}
