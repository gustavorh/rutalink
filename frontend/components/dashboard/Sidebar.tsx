import Image from "next/image";
import { useState } from "react";

interface SidebarProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export function DashboardSidebar({
  currentPath = "/dashboard",
  onNavigate,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isActive = (path: string) => currentPath === path;
  const isParentActive = (basePath: string) => currentPath.startsWith(basePath);

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } flex-shrink-0 bg-ui-sidebar-bg p-6 flex flex-col transition-all duration-300 relative`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-ui-surface-elevated hover:bg-ui-surface-hover text-foreground rounded-full p-1.5 shadow-lg z-10 transition-colors border border-border"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Brand */}
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/logo-bilix.png"
          alt="Bilix Ingeniería"
          width={32}
          height={32}
          className="object-contain"
        />
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-sm">
              RutaLink
            </span>
            <span className="text-muted-foreground text-xs">
              Bilix Ingeniería
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? "space-y-4" : "space-y-1"}`}>
        <div className={isCollapsed ? "" : "mb-4"}>
          <button
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center" : "gap-2"
            } px-3 py-2 rounded text-sm transition-colors ${
              isActive("/dashboard")
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
            }`}
            title={isCollapsed ? "Panel de Control" : ""}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {!isCollapsed && (
              <>
                <span>Panel de Control</span>
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              <div
                onClick={() => onNavigate("/dashboard")}
                className={`px-3 py-2 text-xs cursor-pointer rounded transition-colors ${
                  isActive("/dashboard")
                    ? "bg-primary/20 text-primary border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-ui-surface-hover"
                }`}
              >
                Dashboard
              </div>
              <div
                onClick={() => onNavigate("/operations")}
                className={`px-3 py-2 text-xs cursor-pointer rounded transition-colors ${
                  isActive("/operations")
                    ? "bg-primary/20 text-primary border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-ui-surface-hover"
                }`}
              >
                Programación de Operaciones
              </div>
              <div
                onClick={() => onNavigate("/dashboard")}
                className={`px-3 py-2 text-xs cursor-pointer rounded transition-colors ${
                  isActive("/dashboard/reports")
                    ? "bg-primary/20 text-primary border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-ui-surface-hover"
                }`}
              >
                Reportes Automáticos
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate("/trucks")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/trucks")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Camiones" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m-4 0v-1m4 1v-1m6 0a2 2 0 104 0m-4 0a2 2 0 114 0m-4 0v-1m4 1v-1"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Camiones</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/drivers")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/drivers")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Choferes" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Choferes</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/clients")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/clients")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Clientes" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Clientes</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/providers")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/providers")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Proveedores" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Proveedores</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/routes")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/routes")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Tramos y Rutas" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Tramos y Rutas</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/maintenance")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/maintenance")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Mantención" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {!isCollapsed && (
            <>
              <span>Mantención</span>
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => onNavigate("/dashboard/analytics")}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded text-sm transition-colors ${
            isParentActive("/dashboard/analytics")
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-ui-surface-elevated hover:text-foreground"
          }`}
          title={isCollapsed ? "Analíticas" : ""}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {!isCollapsed && <span>Analíticas</span>}
        </button>
      </nav>
    </aside>
  );
}
