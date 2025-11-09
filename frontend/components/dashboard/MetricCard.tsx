import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: ReactNode;
  iconBgColor: string;
}

export function MetricCard({
  value,
  label,
  trend,
  trendDirection = "neutral",
  icon,
  iconBgColor,
}: MetricCardProps) {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="bg-card border-border dark:border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {value}
            </div>
            <div className="text-sm text-muted-foreground">{label}</div>
            {trend && (
              <div className={`text-xs mt-1 ${trendColors[trendDirection]}`}>
                {trend}
              </div>
            )}
          </div>
          <div className={`p-2 ${iconBgColor} rounded`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
