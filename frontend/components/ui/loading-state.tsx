"use client";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Cargando...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-ui-surface-elevated ${className || ""}`}
    >
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${sizeClasses[size]}`}
        ></div>
        <p className="text-foreground mt-4">{message}</p>
      </div>
    </div>
  );
}

