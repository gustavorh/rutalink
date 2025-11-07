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
      textColor: "text-slate-300",
    },
    delayed: {
      dotColor: "bg-yellow-400 animate-pulse",
      textColor: "text-yellow-300",
    },
  };

  const etaConfig = {
    early: "text-green-400",
    ontime: "text-slate-300",
    late: "text-red-400",
  };

  const currentStatus = statusConfig[status.type];
  const currentEta = etaConfig[eta.type];

  return (
    <tr className="border-b border-slate-700/50 hover:bg-[#2a2d3a] transition-colors">
      <td className="py-4">
        <input type="checkbox" className="rounded border-slate-600" />
      </td>
      <td className="py-4">
        <div className="text-white font-medium">{id}</div>
        <div className="text-xs text-slate-500">{date}</div>
      </td>
      <td className="py-4">
        <div className="text-slate-300">{origin}</div>
        <div className="text-xs text-slate-500">→ {destination}</div>
        <div className="text-xs text-purple-400">{distance}</div>
      </td>
      <td className="py-4">
        <div className="text-white">{vehicle}</div>
        <div className="text-xs text-slate-400">{driver}</div>
      </td>
      <td className="py-4">
        <span className="text-slate-300 text-xs">{cargoType}</span>
      </td>
      <td className="py-4 text-slate-300">{client}</td>
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
                action.color || "text-slate-400 hover:text-white"
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
