"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

/**
 * Shared admin modal built on Base UI Dialog: full screen on mobile, centered
 * from `sm` up. Base UI handles focus trapping, scroll lock, Escape, outside
 * press and focus return; the open and close motion is plain CSS.
 */
export function AdminModal({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />

        <Dialog.Popup className="fixed inset-0 z-50 h-dvh w-full min-w-0 overflow-y-auto overscroll-contain bg-white p-4 text-left shadow-xl transition-[translate,scale,opacity] duration-200 ease-out data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 motion-reduce:transition-none sm:m-auto sm:h-fit sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:rounded-xl sm:p-5 sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95 sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-2xl text-foreground sm:text-3xl">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close className="cursor-pointer rounded-md border px-3 py-2 text-sm">
              Cerrar
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
