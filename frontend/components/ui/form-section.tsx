"use client";

import { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

