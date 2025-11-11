"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatisticsCardProps {
  value: string | number;
  label: string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  className?: string;
}

export function StatisticsCard({
  value,
  label,
  icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  valueColor = "text-foreground",
  className,
}: StatisticsCardProps) {
  return (
    <Card className={`bg-card border-border ${className || ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
          </div>
          <div
            className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}
          >
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

