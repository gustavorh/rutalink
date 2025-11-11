"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string | ReactNode;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No se encontraron datos",
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className || ""}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      {title && <p className="text-muted-foreground mb-2">{title}</p>}
      {description && (
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
      )}
      {action || (onAction && actionLabel)
        ? action || (
            <Button
              onClick={onAction}
              className="mt-4 bg-primary hover:bg-primary-dark"
            >
              {typeof actionLabel === "string" ? actionLabel : actionLabel}
            </Button>
          )
        : null}
    </div>
  );
}
