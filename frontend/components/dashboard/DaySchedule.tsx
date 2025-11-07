interface ScheduleItemProps {
  time: string;
  route: string;
  vehicle: string;
  cargo: string;
  client: string;
}

interface DayScheduleProps {
  day: string;
  date: string;
  totalTransfers: number;
  items: ScheduleItemProps[];
  borderColor: string;
  isExpanded?: boolean;
}

export function DaySchedule({
  day,
  date,
  totalTransfers,
  items,
  borderColor,
  isExpanded = true,
}: DayScheduleProps) {
  return (
    <div className={`border-l-2 ${borderColor} pl-4 py-2`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white font-medium">
          {day}, {date}
        </div>
        <span className="text-xs text-slate-400">
          {totalTransfers} traslados
        </span>
      </div>
      {isExpanded ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="bg-[#2a2d3a] rounded p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">
                  {item.time} - {item.route}
                </span>
                <span className="text-purple-400">{item.vehicle}</span>
              </div>
              <div className="text-slate-500">
                {item.cargo} - Cliente: {item.client}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500">Ver detalles completos →</div>
      )}
    </div>
  );
}
