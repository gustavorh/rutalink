import { ReactNode } from "react";

interface ModuleCardProps {
  name: string;
  description: string;
  total: number;
  icon: ReactNode;
  iconBgColor: string;
  stats: Array<{
    label: string;
    value: string | number;
    bgColor: string;
    textColor: string;
  }>;
  onClick?: () => void;
}

export function ModuleCard({
  name,
  description,
  total,
  icon,
  iconBgColor,
  stats,
  onClick,
}: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-ui-surface-elevated border border-border rounded-lg p-4 hover:border-primary transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${iconBgColor} rounded`}>{icon}</div>
          <div>
            <div className="text-white font-medium text-sm">{name}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{total}</div>
      </div>
      <div className="flex gap-2 text-xs">
        {stats.map((stat, index) => (
          <span
            key={index}
            className={`${stat.bgColor} ${stat.textColor} px-2 py-1 rounded`}
          >
            {stat.label}: {stat.value}
          </span>
        ))}
      </div>
    </button>
  );
}
