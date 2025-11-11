"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  className?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  children,
  loading = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onCancel,
  maxWidth = "2xl",
  className,
}: FormDialogProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card border-border ${
          maxWidthClasses[maxWidth]
        } max-h-[90vh] overflow-y-auto ${className || ""}`}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
