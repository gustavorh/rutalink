interface TransferRowProps {
  id: string;
  date: string;
  origin: string;
  destination: string;
  distance: string;
  vehicle: string;
  driver: string;
  cargoType: string;
  client: string;
  status: {
    label: string;
    type: "in-transit" | "loading" | "completed" | "scheduled" | "delayed";
    detail: string;
  };
  eta: {
    time: string;
    detail: string;
    type: "early" | "ontime" | "late";
  };
  actions: Array<{
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    color?: string;
  }>;
}

export function TransferTableRow({
  id,
  date,
  origin,
  destination,
  distance,
  vehicle,
  driver,
  cargoType,
  client,
  status,
  eta,
  actions,
}: TransferRowProps) {
  const statusConfig = {
    "in-transit": {
      dotColor: "bg-blue-400 animate-pulse",
      textColor: "text-blue-300",
    },
    loading: {
      dotColor: "bg-orange-400",
      textColor: "text-orange-300",
    },
    completed: {
      dotColor: "bg-green-400",
      textColor: "text-green-300",
    },
    scheduled: {
      dotColor: "bg-slate-400",
      textColor: "text-foreground",
    },
    delayed: {
      dotColor: "bg-yellow-400 animate-pulse",
      textColor: "text-yellow-300",
    },
  };

  const etaConfig = {
    early: "text-green-400",
    ontime: "text-foreground",
    late: "text-red-400",
  };

  const currentStatus = statusConfig[status.type];
  const currentEta = etaConfig[eta.type];

  return (
    <tr className="border-b border-border/50 hover:bg-ui-surface-elevated transition-colors">
      <td className="py-4">
        <input type="checkbox" className="rounded border-border" />
      </td>
      <td className="py-4">
        <div className="text-white font-medium">{id}</div>
        <div className="text-xs text-slate-500">{date}</div>
      </td>
      <td className="py-4">
        <div className="text-foreground">{origin}</div>
        <div className="text-xs text-slate-500">→ {destination}</div>
        <div className="text-xs text-secondary">{distance}</div>
      </td>
      <td className="py-4">
        <div className="text-white">{vehicle}</div>
        <div className="text-xs text-muted-foreground">{driver}</div>
      </td>
      <td className="py-4">
        <span className="text-foreground text-xs">{cargoType}</span>
      </td>
      <td className="py-4 text-foreground">{client}</td>
      <td className="py-4">
        <span className="flex items-center gap-2">
          <div
            className={`w-2 h-2 ${currentStatus.dotColor} rounded-full`}
          ></div>
          <span className={currentStatus.textColor}>{status.label}</span>
        </span>
        <div className="text-xs text-slate-500 mt-1">{status.detail}</div>
      </td>
      <td className="py-4">
        <div className={`font-medium ${currentEta}`}>{eta.time}</div>
        <div className={`text-xs ${currentEta}`}>{eta.detail}</div>
      </td>
      <td className="py-4">
        <div className="flex gap-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-1 ${
                action.color || "text-muted-foreground hover:text-white"
              }`}
              title={action.title}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
