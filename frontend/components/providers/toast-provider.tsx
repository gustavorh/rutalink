"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          error: "bg-destructive/10 border-destructive/50 text-destructive",
          success: "bg-success/10 border-success/50 text-success",
          warning: "bg-warning/10 border-warning/50 text-warning",
          info: "bg-primary/10 border-primary/50 text-primary",
        },
      }}
    />
  );
}

