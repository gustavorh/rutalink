# Dashboard Components - Quick Reference

## Import Statement

```typescript
import {
  DashboardSidebar,
  DashboardHeader,
  MetricCard,
  TransferCard,
  ModuleCard,
  DaySchedule,
  ReportItem,
  TransferTableRow,
} from "@/components/dashboard";
```

## Component Usage Examples

### 1. MetricCard

```tsx
<MetricCard
  value={47}
  label="Traslados Activos"
  trend="+12% vs ayer"
  trendDirection="up"
  iconBgColor="bg-purple-600/20"
  icon={<TruckIcon className="w-5 h-5" />}
/>
```

### 2. TransferCard

```tsx
<TransferCard
  id="TR-2024-1547"
  status="En Tránsito"
  origin="Santiago Centro"
  destination="Valparaíso Puerto"
  vehicle="Camión AB-2215"
  driver="Juan Pérez"
  cargoType="Maquinaria Pesada"
  eta="14:30 (-15 min)"
  progress={65}
  etaStatus="early"
/>
```

### 3. ModuleCard

```tsx
<ModuleCard
  name="Camiones"
  description="Gestión de flota"
  total={134}
  iconBgColor="bg-blue-600/20"
  icon={<TruckIcon className="w-5 h-5" />}
  stats={[
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
  ]}
  onClick={() => console.log("Navigate to Camiones")}
/>
```

### 4. DaySchedule

```tsx
<DaySchedule
  day="Lunes"
  date="8 Nov"
  totalTransfers={12}
  borderColor="border-purple-500"
  isExpanded={true}
  items={[
    {
      time: "06:00",
      route: "Santiago → Rancagua",
      vehicle: "AB-2215",
      cargo: "Maquinaria",
      client: "Constructora ABC",
    },
  ]}
/>
```

### 5. ReportItem

```tsx
<ReportItem
  title="Rendimiento Diario"
  status="Generado"
  description="Última actualización: Hoy 14:30"
  iconBgColor="bg-green-600/20"
  icon={<ReportIcon className="w-5 h-5" />}
  actions={[
    { label: "Descargar PDF", onClick: () => {} },
    { label: "Ver Detalles", onClick: () => {} },
  ]}
/>;

{
  /* Or with progress */
}
<ReportItem
  title="Tiempos de Entrega"
  status="En progreso"
  description="Se generará: Hoy 18:00"
  iconBgColor="bg-orange-600/20"
  icon={<ReportIcon className="w-5 h-5" />}
  progress={75}
/>;
```

### 6. TransferTableRow

```tsx
<TransferTableRow
  id="TR-2024-1547"
  date="Nov 7, 09:30"
  origin="Santiago Centro"
  destination="Valparaíso Puerto"
  distance="125 km"
  vehicle="AB-2215"
  driver="Juan Pérez G."
  cargoType="Maquinaria Pesada"
  client="Constructora ABC"
  status={{
    label: "En Tránsito",
    type: "in-transit",
    detail: "65% completado",
  }}
  eta={{
    time: "14:30",
    detail: "-15 min adelanto",
    type: "early",
  }}
  actions={[
    {
      icon: <EyeIcon />,
      title: "Ver detalles",
      onClick: () => {},
    },
  ]}
/>
```

### 7. DashboardSidebar

```tsx
<DashboardSidebar
  currentPath="/dashboard"
  onNavigate={(path) => router.push(path)}
/>
```

### 8. DashboardHeader

```tsx
<DashboardHeader user={user} onLogout={handleLogout} />
```

## TypeScript Interfaces

### MetricCardProps

```typescript
{
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: ReactNode;
  iconBgColor: string;
}
```

### TransferCardProps

```typescript
{
  id: string;
  status: "En Tránsito" | "Cargando" | "Completado";
  origin: string;
  destination: string;
  vehicle: string;
  driver: string;
  cargoType: string;
  eta: string;
  progress: number;
  etaStatus: "early" | "ontime" | "late";
}
```

### ModuleCardProps

```typescript
{
  name: string;
  description: string;
  total: number;
  icon: ReactNode;
  iconBgColor: string;
  stats: Array<{
    label: string;
    value: number;
    bgColor: string;
    textColor: string;
  }>;
  onClick: () => void;
}
```

## Helper Functions

### getIcon(type, className)

```typescript
import { getIcon } from "@/lib/icons";

const icon = getIcon("truck", "w-5 h-5");
// Returns the appropriate icon component
```

Available icon types:

- `"truck"`
- `"vehicle"`
- `"driver"`
- `"clock"`
- `"clients"`
- `"suppliers"`
- `"routes"`
- `"report"`

## Mock Data

Import mock data for testing:

```typescript
import {
  metricsData,
  transfersData,
  modulesData,
  scheduleData,
  reportsData,
  transferTableData,
} from "@/lib/mockData";
```

## Color Palette

- Background: `#2a2d3a`
- Cards: `#23262f`
- Borders: `border-slate-700`
- Primary Accent: Purple (`text-purple-400`, `bg-purple-600`)
- Success: Green (`text-green-400`, `bg-green-600`)
- Warning: Orange (`text-orange-400`, `bg-orange-600`)
- Danger: Red (`text-red-400`, `bg-red-600`)
- Info: Blue (`text-blue-400`, `bg-blue-600`)
