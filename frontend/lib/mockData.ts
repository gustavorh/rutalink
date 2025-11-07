// Mock data - will be replaced with API calls later

export const metricsData = [
  {
    value: 47,
    label: "Traslados Activos",
    trend: "+12% vs ayer",
    trendDirection: "up" as const,
    iconBgColor: "bg-purple-600/20",
    iconType: "truck" as const,
  },
  {
    value: 134,
    label: "Vehículos Operativos",
    trend: "95% disponibilidad",
    trendDirection: "up" as const,
    iconBgColor: "bg-blue-600/20",
    iconType: "vehicle" as const,
  },
  {
    value: 28,
    label: "Choferes en Ruta",
    trend: "de 45 totales",
    trendDirection: "neutral" as const,
    iconBgColor: "bg-orange-600/20",
    iconType: "driver" as const,
  },
  {
    value: "92%",
    label: "Entregas a Tiempo",
    trend: "+5% vs mes anterior",
    trendDirection: "up" as const,
    iconBgColor: "bg-green-600/20",
    iconType: "clock" as const,
  },
];

export const transfersData = [
  {
    id: "TR-2024-1547",
    status: "En Tránsito" as const,
    origin: "Santiago Centro",
    destination: "Valparaíso Puerto",
    vehicle: "Camión AB-2215",
    driver: "Juan Pérez",
    cargoType: "Maquinaria Pesada",
    eta: "14:30 (-15 min)",
    progress: 65,
    etaStatus: "early" as const,
  },
  {
    id: "TR-2024-1548",
    status: "Cargando" as const,
    origin: "Concepción Norte",
    destination: "Puerto Montt",
    vehicle: "Camión DL-6389",
    driver: "Carlos Silva",
    cargoType: "Contenedores",
    eta: "15:00",
    progress: 15,
    etaStatus: "ontime" as const,
  },
  {
    id: "TR-2024-1546",
    status: "Completado" as const,
    origin: "La Serena",
    destination: "Copiapó",
    vehicle: "Camión XY-9876",
    driver: "Ana Martínez",
    cargoType: "Materiales",
    eta: "12:45 ✓",
    progress: 100,
    etaStatus: "ontime" as const,
  },
];

export const modulesData = [
  {
    name: "Camiones",
    description: "Gestión de flota",
    total: 134,
    iconBgColor: "bg-blue-600/20",
    iconType: "truck" as const,
    stats: [
      {
        label: "Activos",
        value: 120,
        bgColor: "bg-green-600/20",
        textColor: "text-green-400",
      },
      {
        label: "Mantención",
        value: 14,
        bgColor: "bg-slate-700",
        textColor: "text-slate-400",
      },
    ],
  },
  {
    name: "Choferes",
    description: "Personal activo",
    total: 45,
    iconBgColor: "bg-orange-600/20",
    iconType: "driver" as const,
    stats: [
      {
        label: "En Ruta",
        value: 28,
        bgColor: "bg-blue-600/20",
        textColor: "text-blue-400",
      },
      {
        label: "Disponibles",
        value: 17,
        bgColor: "bg-green-600/20",
        textColor: "text-green-400",
      },
    ],
  },
  {
    name: "Clientes",
    description: "Base de datos",
    total: 87,
    iconBgColor: "bg-purple-600/20",
    iconType: "clients" as const,
    stats: [
      {
        label: "Activos hoy",
        value: 12,
        bgColor: "bg-green-600/20",
        textColor: "text-green-400",
      },
    ],
  },
  {
    name: "Proveedores",
    description: "Red de soporte",
    total: 23,
    iconBgColor: "bg-green-600/20",
    iconType: "suppliers" as const,
    stats: [
      {
        label: "Con contratos",
        value: 5,
        bgColor: "bg-blue-600/20",
        textColor: "text-blue-400",
      },
    ],
  },
  {
    name: "Tramos",
    description: "Rutas definidas",
    total: 156,
    iconBgColor: "bg-pink-600/20",
    iconType: "routes" as const,
    stats: [
      {
        label: "En uso",
        value: 47,
        bgColor: "bg-purple-600/20",
        textColor: "text-purple-400",
      },
    ],
  },
];

export const scheduleData = [
  {
    day: "Lunes",
    date: "8 Nov",
    totalTransfers: 12,
    borderColor: "border-purple-500",
    isExpanded: true,
    items: [
      {
        time: "06:00",
        route: "Santiago → Rancagua",
        vehicle: "AB-2215",
        cargo: "Maquinaria",
        client: "Constructora ABC",
      },
      {
        time: "08:30",
        route: "Valparaíso → Viña del Mar",
        vehicle: "DL-6389",
        cargo: "Contenedores",
        client: "Naviera Sur",
      },
    ],
  },
  {
    day: "Martes",
    date: "9 Nov",
    totalTransfers: 8,
    borderColor: "border-blue-500",
    isExpanded: true,
    items: [
      {
        time: "07:00",
        route: "Concepción → Temuco",
        vehicle: "XY-9876",
        cargo: "Materiales",
        client: "Minera del Sur",
      },
    ],
  },
  {
    day: "Miércoles",
    date: "10 Nov",
    totalTransfers: 15,
    borderColor: "border-slate-600",
    isExpanded: false,
    items: [],
  },
];

export const reportsData = [
  {
    title: "Rendimiento Diario",
    status: "Generado" as const,
    description: "Última actualización: Hoy 14:30",
    iconBgColor: "bg-green-600/20",
    iconType: "report" as const,
    actions: [
      { label: "Descargar PDF", onClick: () => console.log("Download PDF") },
      { label: "Ver Detalles", onClick: () => console.log("View details") },
    ],
  },
  {
    title: "Eficiencia de Flota",
    status: "Generado" as const,
    description: "Semanal - Semana 45",
    iconBgColor: "bg-blue-600/20",
    iconType: "report" as const,
    actions: [
      {
        label: "Descargar Excel",
        onClick: () => console.log("Download Excel"),
      },
      { label: "Programar Envío", onClick: () => console.log("Schedule") },
    ],
  },
  {
    title: "Tiempos de Entrega",
    status: "En progreso" as const,
    description: "Se generará: Hoy 18:00",
    iconBgColor: "bg-orange-600/20",
    iconType: "report" as const,
    progress: 75,
  },
  {
    title: "Costos Operacionales",
    status: "Generado" as const,
    description: "Mensual - Octubre 2024",
    iconBgColor: "bg-purple-600/20",
    iconType: "report" as const,
    actions: [
      { label: "Ver Dashboard", onClick: () => console.log("View dashboard") },
      { label: "Exportar", onClick: () => console.log("Export") },
    ],
  },
];

export const transferTableData = [
  {
    id: "TR-2024-1547",
    date: "Nov 7, 09:30",
    origin: "Santiago Centro",
    destination: "Valparaíso Puerto",
    distance: "125 km",
    vehicle: "AB-2215",
    driver: "Juan Pérez G.",
    cargoType: "Maquinaria Pesada",
    client: "Constructora ABC",
    status: {
      label: "En Tránsito",
      type: "in-transit" as const,
      detail: "65% completado",
    },
    eta: {
      time: "14:30",
      detail: "-15 min adelanto",
      type: "early" as const,
    },
    actions: [
      { label: "Ver detalles", onClick: () => console.log("View details") },
      {
        label: "Contactar chofer",
        onClick: () => console.log("Contact driver"),
      },
    ],
  },
  {
    id: "TR-2024-1548",
    date: "Nov 7, 13:00",
    origin: "Concepción Norte",
    destination: "Puerto Montt",
    distance: "568 km",
    vehicle: "DL-6389",
    driver: "Carlos Silva M.",
    cargoType: "Contenedores",
    client: "Naviera Sur SpA",
    status: {
      label: "Cargando",
      type: "loading" as const,
      detail: "15% completado",
    },
    eta: {
      time: "15:00",
      detail: "Inicio estimado",
      type: "ontime" as const,
    },
    actions: [
      { label: "Ver detalles", onClick: () => console.log("View details") },
      {
        label: "Actualizar estado",
        onClick: () => console.log("Update status"),
      },
    ],
  },
  {
    id: "TR-2024-1546",
    date: "Nov 7, 06:15",
    origin: "La Serena",
    destination: "Copiapó",
    distance: "156 km",
    vehicle: "XY-9876",
    driver: "Ana Martínez L.",
    cargoType: "Materiales",
    client: "Minera del Sur",
    status: {
      label: "Completado",
      type: "completed" as const,
      detail: "✓ Entregado",
    },
    eta: {
      time: "12:45",
      detail: "A tiempo",
      type: "ontime" as const,
    },
    actions: [
      { label: "Ver detalles", onClick: () => console.log("View details") },
      {
        label: "Generar reporte",
        onClick: () => console.log("Generate report"),
      },
    ],
  },
  {
    id: "TR-2024-1549",
    date: "Nov 7, 16:00",
    origin: "Rancagua",
    destination: "Talca",
    distance: "187 km",
    vehicle: "MN-4521",
    driver: "Pedro González",
    cargoType: "Equipamiento",
    client: "Agrícola Central",
    status: {
      label: "Programado",
      type: "scheduled" as const,
      detail: "Próximo inicio",
    },
    eta: {
      time: "19:30",
      detail: "Estimado",
      type: "ontime" as const,
    },
    actions: [
      { label: "Ver detalles", onClick: () => console.log("View details") },
      { label: "Modificar", onClick: () => console.log("Modify") },
    ],
  },
  {
    id: "TR-2024-1545",
    date: "Nov 7, 08:00",
    origin: "Temuco",
    destination: "Osorno",
    distance: "274 km",
    vehicle: "BC-7854",
    driver: "Luis Rojas V.",
    cargoType: "Productos Varios",
    client: "Comercial Sur",
    status: {
      label: "En Tránsito",
      type: "delayed" as const,
      detail: "⚠ Con retraso",
    },
    eta: {
      time: "15:45",
      detail: "+35 min retraso",
      type: "late" as const,
    },
    actions: [
      { label: "Ver detalles", onClick: () => console.log("View details") },
      { label: "Alerta urgente", onClick: () => console.log("Urgent alert") },
    ],
  },
];
