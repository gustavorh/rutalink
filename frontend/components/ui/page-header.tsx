"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  actionLabel?: string | ReactNode;
  onAction?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
  actionLabel,
  onAction,
  className,
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className || ""}`}>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action || (onAction && actionLabel)
        ? action || (
            <Button
              onClick={onAction}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              {actionLabel}
            </Button>
          )
        : null}
    </div>
  );
}
