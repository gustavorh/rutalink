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
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <Card className="bg-[#23262f] border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
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
