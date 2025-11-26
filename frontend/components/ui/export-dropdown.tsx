"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "xlsx" | "pdf";

export interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// EXPORT DROPDOWN COMPONENT
// ============================================================================

export function ExportDropdown({
  onExport,
  loading = false,
  disabled = false,
  className = "",
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleExport = (format: ExportFormat) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="border-border text-foreground hover:bg-ui-surface-elevated"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Exportar datos"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Exportar
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-ui-surface-elevated border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="export-menu-button"
        >
          <div className="py-1">
            <button
              onClick={() => handleExport("xlsx")}
              className="group flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-green-500/10 hover:text-green-500 transition-colors duration-150"
              role="menuitem"
            >
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Excel (.xlsx)</span>
                <span className="text-xs text-muted-foreground group-hover:text-green-500/70">
                  Hoja de cálculo
                </span>
              </div>
            </button>

            <button
              onClick={() => handleExport("pdf")}
              className="group flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors duration-150"
              role="menuitem"
            >
              <FileText className="h-5 w-5 text-red-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">PDF (.pdf)</span>
                <span className="text-xs text-muted-foreground group-hover:text-red-500/70">
                  Documento portable
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
