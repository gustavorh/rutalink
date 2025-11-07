interface ReportItemProps {
  title: string;
  status: "Generado" | "En progreso";
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  actions?: Array<{ label: string; onClick: () => void }>;
  progress?: number;
}

export function ReportItem({
  title,
  status,
  description,
  icon,
  iconBgColor,
  actions,
  progress,
}: ReportItemProps) {
  const statusColors = {
    Generado: "text-green-400",
    "En progreso": "text-orange-400",
  };

  return (
    <div className="bg-[#2a2d3a] border border-slate-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 ${iconBgColor} rounded`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white font-medium text-sm">{title}</h4>
            <span className={`text-xs ${statusColors[status]}`}>{status}</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">{description}</p>
          {progress !== undefined ? (
            <div className="w-full bg-slate-700/50 rounded-full h-1.5">
              <div
                className="bg-orange-400 h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          ) : (
            actions && (
              <div className="flex gap-2">
                {actions.map((action, index) => (
                  <span key={index}>
                    <button
                      onClick={action.onClick}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {action.label}
                    </button>
                    {index < actions.length - 1 && (
                      <span className="text-slate-600 mx-2">|</span>
                    )}
                  </span>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
