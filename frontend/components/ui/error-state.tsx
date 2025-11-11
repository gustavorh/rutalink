"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className || ""}`}>
      <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <p className="text-destructive mb-4">{error}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
}

