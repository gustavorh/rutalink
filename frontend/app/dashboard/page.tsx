"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, isAuthenticated, logout } from "@/lib/auth";
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
import {
  metricsData,
  transfersData,
  modulesData,
  scheduleData,
  reportsData,
  transferTableData,
} from "@/lib/mockData";
import { getIcon } from "@/lib/icons";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This runs only on the client after mount
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    // This is the standard pattern for preventing hydration issues in Next.js
    // See: https://nextjs.org/docs/messages/react-hydration-error
    setMounted(true); // eslint-disable-line
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2a2d3a]">
        <p className="text-slate-300">Cargando...</p>
      </div>
    );
  }

  const user = getUser();
  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-[#2a2d3a]">
      {/* Sidebar */}
      <DashboardSidebar
        currentPath="/dashboard"
        onNavigate={(path) => router.push(path)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader user={user} onLogout={handleLogout} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricsData.map((metric, index) => (
                <MetricCard
                  key={index}
                  value={metric.value}
                  label={metric.label}
                  trend={metric.trend}
                  trendDirection={metric.trendDirection}
                  iconBgColor={metric.iconBgColor}
                  icon={getIcon(metric.iconType, "w-5 h-5")}
                />
              ))}
            </div>

            {/* Real-time Transfers */}
            <Card className="bg-[#23262f] border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  Traslados en Tiempo Real
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </CardTitle>
                <button className="text-sm text-purple-400 hover:text-purple-300">
                  Ver todos
                </button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {transfersData.map((transfer) => (
                  <TransferCard key={transfer.id} {...transfer} />
                ))}
              </CardContent>
            </Card>

            {/* Modules Grid */}
            <Card className="bg-[#23262f] border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Módulos de Gestión
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {modulesData.map((module) => (
                  <ModuleCard
                    key={module.name}
                    name={module.name}
                    description={module.description}
                    total={module.total}
                    iconBgColor={module.iconBgColor}
                    icon={getIcon(module.iconType, "w-5 h-5")}
                    stats={module.stats}
                    onClick={() => console.log(`Navigate to ${module.name}`)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Scheduling and Reports Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scheduling */}
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Programación Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduleData.map((day) => (
                    <DaySchedule key={day.day} {...day} />
                  ))}
                </CardContent>
              </Card>

              {/* Automated Reports */}
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Reportes Automáticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reportsData.map((report) => (
                    <ReportItem
                      key={report.title}
                      title={report.title}
                      status={report.status}
                      description={report.description}
                      iconBgColor={report.iconBgColor}
                      icon={getIcon(report.iconType, "w-5 h-5")}
                      actions={report.actions}
                      progress={report.progress}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Transfer Table */}
            <Card className="bg-[#23262f] border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-100">
                  Seguimiento Completo de Traslados
                </CardTitle>
                <div className="flex gap-2">
                  <button className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded border border-slate-600 hover:border-slate-500">
                    Filtrar
                  </button>
                  <button className="text-sm text-slate-400 hover:text-slate-300 px-3 py-1 rounded border border-slate-600 hover:border-slate-500">
                    Exportar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          ID / Fecha
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Origen
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Destino
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Vehículo
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Chofer
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Carga
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Cliente
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">
                          Estado
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">
                          ETA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferTableData.map((transfer) => (
                        <TransferTableRow
                          key={transfer.id}
                          id={transfer.id}
                          date={transfer.date}
                          origin={transfer.origin}
                          destination={transfer.destination}
                          distance={transfer.distance}
                          vehicle={transfer.vehicle}
                          driver={transfer.driver}
                          cargoType={transfer.cargoType}
                          client={transfer.client}
                          status={transfer.status}
                          eta={transfer.eta}
                          actions={transfer.actions.map((action) => ({
                            icon: (
                              <svg
                                className="w-4 h-4"
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
                            ),
                            title: action.label,
                            onClick: action.onClick,
                          }))}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Mostrando 1 a 5 de 47 traslados
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-slate-300 border border-slate-600 hover:border-slate-500 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                      Anterior
                    </button>
                    <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                      1
                    </button>
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-slate-300 border border-slate-600 hover:border-slate-500 rounded">
                      2
                    </button>
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-slate-300 border border-slate-600 hover:border-slate-500 rounded">
                      3
                    </button>
                    <button className="px-3 py-1 text-sm text-slate-400 hover:text-slate-300 border border-slate-600 hover:border-slate-500 rounded">
                      Siguiente
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
