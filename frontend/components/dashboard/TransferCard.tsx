interface TransferCardProps {
  id: string;
  status: "En Tránsito" | "Cargando" | "Completado";
  origin: string;
  destination: string;
  vehicle: string;
  driver: string;
  cargoType: string;
  eta: string;
  progress: number;
  etaStatus?: "early" | "ontime" | "late";
}

export function TransferCard({
  id,
  status,
  origin,
  destination,
  vehicle,
  driver,
  cargoType,
  eta,
  progress,
  etaStatus = "ontime",
}: TransferCardProps) {
  const statusColors = {
    "En Tránsito": "bg-blue-600/20 text-blue-400",
    Cargando: "bg-orange-600/20 text-orange-400",
    Completado: "bg-green-600/20 text-green-400",
  };

  const progressColors = {
    "En Tránsito": "from-purple-500 to-blue-500",
    Cargando: "from-orange-500 to-yellow-500",
    Completado: "from-green-500 to-emerald-500",
  };

  const etaColors = {
    early: "text-green-400",
    ontime: "text-foreground",
    late: "text-red-400",
  };

  return (
    <div className="bg-ui-surface-elevated border border-border rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-semibold">{id}</span>
            <span
              className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}
            >
              {status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>{origin}</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{destination}</span>
            </div>
          </div>
        </div>
        <button className="text-secondary hover:text-secondary-light">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-slate-500 mb-1">Vehículo</div>
          <div className="text-white font-medium">{vehicle}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Chofer</div>
          <div className="text-white font-medium">{driver}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Tipo Carga</div>
          <div className="text-white font-medium">{cargoType}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">
            {status === "Completado" ? "Entregado" : "ETA"}
          </div>
          <div className={`font-medium ${etaColors[etaStatus]}`}>{eta}</div>
        </div>
      </div>
      <div className="mt-3 bg-slate-700/50 rounded-full h-2">
        <div
          className={`bg-gradient-to-r ${progressColors[status]} h-2 rounded-full`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
