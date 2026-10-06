"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";

/**
 * Bottom toast for admin feedback. The live region stays mounted so screen
 * readers announce each new message; the pill itself fades and slides in.
 */
export function AdminToast({
  message,
  tone = "default",
}: {
  message: string | null;
  tone?: "default" | "error";
}) {
  const isError = tone === "error";

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <div
          aria-live={isError ? "assertive" : "polite"}
          className="pointer-events-none fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0"
          role={isError ? "alert" : "status"}
        >
          <AnimatePresence>
            {message ? (
              <m.div
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-full border bg-card px-5 py-3 text-center text-sm font-medium shadow-lg ${
                  isError
                    ? "border-destructive text-destructive"
                    : "border-border text-foreground"
                }`}
                exit={{ opacity: 0, y: 12 }}
                initial={{ opacity: 0, y: 12 }}
                key={message}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                {message}
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
