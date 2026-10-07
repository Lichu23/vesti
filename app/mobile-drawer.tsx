"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

// Tailwind needs the full class names to be present in the source.
const HIDE_FROM = {
  lg: {
    backdrop: "lg:hidden",
    popup: "lg:hidden",
    trigger: "lg:hidden",
  },
  xl: {
    backdrop: "xl:hidden",
    popup: "xl:hidden",
    trigger: "xl:hidden",
  },
} as const;

const iconButtonClassName =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function MobileDrawer({
  children,
  closeLabel,
  header,
  hideFrom,
  isDisabled = false,
  onOpenChange,
  triggerLabel,
}: {
  // Receives `closeAfterNavigation`, to call from every link inside the drawer.
  children: (api: { closeAfterNavigation: () => void }) => ReactNode;
  closeLabel: string;
  // Rendered to the left of the close button; it must contain a Dialog.Title.
  header: ReactNode;
  hideFrom: keyof typeof HIDE_FROM;
  isDisabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollToTopOnClose, setScrollToTopOnClose] = useState(false);
  const hide = HIDE_FROM[hideFrom];

  function handleOpenChange(open: boolean) {
    onOpenChange?.(open);
    setIsOpen(open);
  }

  function closeAfterNavigation() {
    setScrollToTopOnClose(true);
    setIsOpen(false);
  }

  // Base UI locks page scroll while open and restores the old position when it
  // unlocks, which would undo the scroll-to-top of the navigation.
  function handleOpenChangeComplete(open: boolean) {
    if (open || !scrollToTopOnClose) return;

    setScrollToTopOnClose(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <Dialog.Root
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      open={isOpen}
    >
      <Dialog.Trigger
        aria-disabled={isDisabled}
        aria-label={triggerLabel}
        className={`${iconButtonClassName} relative z-20 size-11 md:size-12 ${hide.trigger}`}
        disabled={isDisabled}
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          className={`fixed inset-0 z-[1000] bg-foreground/35 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none ${hide.backdrop}`}
        />

        <Dialog.Popup
          className={`fixed left-0 top-0 z-[1000] flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-4 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none sm:p-6 ${hide.popup}`}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            {header}
            <Dialog.Close
              aria-label={closeLabel}
              className={`${iconButtonClassName} -mr-2 size-11`}
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>

          {children({ closeAfterNavigation })}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
