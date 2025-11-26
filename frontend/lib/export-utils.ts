/**
 * Export Utilities for XLSX and PDF generation
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================================
// TYPES
// ============================================================================

export interface ExportColumn {
  key: string;
  header: string;
  accessor?: (row: unknown) => string | number;
  width?: number;
}

export interface ExportConfig {
  filename: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: unknown[];
  sheetName?: string;
}

// ============================================================================
// XLSX EXPORT
// ============================================================================

/**
 * Export data to XLSX format
 */
export function exportToXLSX(config: ExportConfig): void {
  const { filename, title, columns, data, sheetName = "Datos" } = config;

  // Transform data to plain object array for XLSX
  const exportData = data.map((row) => {
    const exportRow: Record<string, string | number> = {};
    columns.forEach((col) => {
      const value = col.accessor
        ? col.accessor(row)
        : getNestedValue(row, col.key);
      exportRow[col.header] = value ?? "";
    });
    return exportRow;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();

  // If title is provided, add it as header rows
  if (title) {
    // Create header row object
    const headerRow = Object.fromEntries(
      columns.map((col) => [col.header, col.header])
    );

    // Create worksheet with title
    const wsData = [
      // Title row (merged)
      Object.fromEntries(
        columns.map((col, i) => [col.header, i === 0 ? title : ""])
      ),
      // Empty row
      Object.fromEntries(columns.map((col) => [col.header, ""])),
      // Column headers row
      headerRow,
      // Data rows
      ...exportData,
    ];

    const worksheet = XLSX.utils.json_to_sheet(wsData, {
      skipHeader: true,
    });

    // Set column widths
    const colWidths = columns.map((col) => ({
      wch: col.width || Math.max(col.header.length, 15),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  } else {
    // Without title, just use json_to_sheet which auto-generates headers
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = columns.map((col) => ({
      wch: col.width || Math.max(col.header.length, 15),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  // Generate file and download
  const timestamp = formatTimestamp(new Date());
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Export data to PDF format
 */
export function exportToPDF(config: ExportConfig): void {
  const { filename, title, subtitle, columns, data } = config;

  // Create PDF document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);
  }

  // Add subtitle with timestamp
  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(subtitle || `Exportado: ${timestamp}`, 14, title ? 28 : 20);

  // Prepare table data
  const tableColumns = columns.map((col) => col.header);
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = col.accessor
        ? col.accessor(row)
        : getNestedValue(row, col.key);
      return String(value ?? "");
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableColumns],
    body: tableData,
    startY: title ? 35 : 25,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [99, 102, 241], // Indigo color
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
    didDrawPage: (data) => {
      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 10
      );
    },
  });

  // Generate file and download
  const timestampFile = formatTimestamp(new Date());
  const fullFilename = `${filename}_${timestampFile}.pdf`;
  doc.save(fullFilename);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, path: string): string | number {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return "";
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (current === null || current === undefined) {
    return "";
  }

  if (typeof current === "string" || typeof current === "number") {
    return current;
  }

  return String(current);
}

/**
 * Format timestamp for filenames
 */
function formatTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

// ============================================================================
// SPECIALIZED EXPORT FUNCTIONS
// ============================================================================

export interface OperationExportData {
  operation: {
    id: number;
    operationNumber: string;
    status: string;
    operationType?: string;
    origin: string;
    destination: string;
    scheduledStartDate: string;
    scheduledEndDate?: string | null;
  };
  client?: {
    businessName: string;
  };
  provider?: {
    businessName: string;
  };
  vehicle: {
    plateNumber: string;
    brand?: string | null;
    model?: string | null;
  };
}

/**
 * Status labels mapping
 */
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  "in-progress": "En Tránsito",
  completed: "Completada",
  cancelled: "Cancelada",
};

/**
 * Operation type labels mapping
 */
const OPERATION_TYPE_LABELS: Record<string, string> = {
  delivery: "Entrega",
  pickup: "Retiro",
  transfer: "Traslado",
  transport: "Transporte",
  service: "Servicio",
};

/**
 * Export operations to XLSX format
 */
export function exportOperationsToXLSX(
  operations: OperationExportData[],
  filename: string = "operaciones"
): void {
  const columns: ExportColumn[] = [
    {
      key: "operationNumber",
      header: "N° Operación",
      accessor: (row) => (row as OperationExportData).operation.operationNumber,
      width: 15,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        STATUS_LABELS[(row as OperationExportData).operation.status] ||
        (row as OperationExportData).operation.status,
      width: 15,
    },
    {
      key: "operationType",
      header: "Tipo",
      accessor: (row) => {
        const type = (row as OperationExportData).operation.operationType;
        return type ? OPERATION_TYPE_LABELS[type] || type : "";
      },
      width: 12,
    },
    {
      key: "client",
      header: "Cliente",
      accessor: (row) =>
        (row as OperationExportData).client?.businessName || "Sin cliente",
      width: 25,
    },
    {
      key: "provider",
      header: "Proveedor",
      accessor: (row) =>
        (row as OperationExportData).provider?.businessName || "Sin proveedor",
      width: 25,
    },
    {
      key: "origin",
      header: "Origen",
      accessor: (row) => (row as OperationExportData).operation.origin,
      width: 25,
    },
    {
      key: "destination",
      header: "Destino",
      accessor: (row) => (row as OperationExportData).operation.destination,
      width: 25,
    },
    {
      key: "vehicle",
      header: "Vehículo",
      accessor: (row) => {
        const v = (row as OperationExportData).vehicle;
        return `${v.plateNumber}${v.brand ? ` - ${v.brand}` : ""}${
          v.model ? ` ${v.model}` : ""
        }`;
      },
      width: 20,
    },
    {
      key: "scheduledStartDate",
      header: "Fecha Programada",
      accessor: (row) => {
        const date = new Date(
          (row as OperationExportData).operation.scheduledStartDate
        );
        return date.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
      width: 15,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Operaciones",
    columns,
    data: operations,
    sheetName: "Operaciones",
  });
}

/**
 * Export operations to PDF format
 */
export function exportOperationsToPDF(
  operations: OperationExportData[],
  filename: string = "operaciones"
): void {
  const columns: ExportColumn[] = [
    {
      key: "operationNumber",
      header: "N° Operación",
      accessor: (row) => (row as OperationExportData).operation.operationNumber,
      width: 25,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        STATUS_LABELS[(row as OperationExportData).operation.status] ||
        (row as OperationExportData).operation.status,
      width: 22,
    },
    {
      key: "client",
      header: "Cliente",
      accessor: (row) =>
        (row as OperationExportData).client?.businessName || "Sin cliente",
      width: 35,
    },
    {
      key: "provider",
      header: "Proveedor",
      accessor: (row) =>
        (row as OperationExportData).provider?.businessName || "Sin proveedor",
      width: 35,
    },
    {
      key: "origin",
      header: "Origen",
      accessor: (row) => (row as OperationExportData).operation.origin,
      width: 35,
    },
    {
      key: "destination",
      header: "Destino",
      accessor: (row) => (row as OperationExportData).operation.destination,
      width: 35,
    },
    {
      key: "vehicle",
      header: "Vehículo",
      accessor: (row) => (row as OperationExportData).vehicle.plateNumber,
      width: 20,
    },
    {
      key: "scheduledStartDate",
      header: "Fecha",
      accessor: (row) => {
        const date = new Date(
          (row as OperationExportData).operation.scheduledStartDate
        );
        return date.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
      width: 22,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Operaciones",
    subtitle: `Total: ${operations.length} operaciones • Exportado: ${timestamp}`,
    columns,
    data: operations,
  });
}

// ============================================================================
// TRUCK EXPORT FUNCTIONS
// ============================================================================

export interface TruckExportData {
  id: number;
  plateNumber: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  vehicleType: string;
  capacity?: number | null;
  capacityUnit?: string | null;
  vin?: string | null;
  color?: string | null;
  operationalStatus?: string | null;
  status: boolean;
  totalOperations?: number;
  upcomingOperations?: number;
}

/**
 * Vehicle type labels mapping
 */
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck: "Camión",
  semi_truck: "Tracto Camión",
  trailer: "Remolque",
  lowboy: "Cama Baja",
  flatbed: "Plataforma",
  tanker: "Cisterna",
  refrigerated: "Refrigerado",
  container: "Portacontenedor",
  dump_truck: "Tolva",
  mixer: "Mixer/Betonera",
  crane: "Grúa",
  other: "Otro",
};

/**
 * Operational status labels mapping
 */
const OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  maintenance: "En Mantención",
  "out-of-service": "Fuera de Servicio",
  "in-transit": "En Tránsito",
};

/**
 * Export trucks to XLSX format
 */
export function exportTrucksToXLSX(
  trucks: TruckExportData[],
  filename: string = "vehiculos"
): void {
  const columns: ExportColumn[] = [
    {
      key: "plateNumber",
      header: "Patente",
      accessor: (row) => (row as TruckExportData).plateNumber,
      width: 12,
    },
    {
      key: "brand",
      header: "Marca",
      accessor: (row) => (row as TruckExportData).brand || "N/A",
      width: 15,
    },
    {
      key: "model",
      header: "Modelo",
      accessor: (row) => (row as TruckExportData).model || "N/A",
      width: 15,
    },
    {
      key: "year",
      header: "Año",
      accessor: (row) => (row as TruckExportData).year || "N/A",
      width: 8,
    },
    {
      key: "vehicleType",
      header: "Tipo",
      accessor: (row) =>
        VEHICLE_TYPE_LABELS[(row as TruckExportData).vehicleType] ||
        (row as TruckExportData).vehicleType,
      width: 15,
    },
    {
      key: "capacity",
      header: "Capacidad",
      accessor: (row) => {
        const t = row as TruckExportData;
        return t.capacity ? `${t.capacity} ${t.capacityUnit || ""}` : "N/A";
      },
      width: 12,
    },
    {
      key: "vin",
      header: "VIN",
      accessor: (row) => (row as TruckExportData).vin || "N/A",
      width: 20,
    },
    {
      key: "color",
      header: "Color",
      accessor: (row) => (row as TruckExportData).color || "N/A",
      width: 10,
    },
    {
      key: "operationalStatus",
      header: "Estado Operativo",
      accessor: (row) => {
        const status = (row as TruckExportData).operationalStatus;
        return status ? OPERATIONAL_STATUS_LABELS[status] || status : "N/A";
      },
      width: 15,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as TruckExportData).status ? "Activo" : "Inactivo",
      width: 10,
    },
    {
      key: "totalOperations",
      header: "Total Operaciones",
      accessor: (row) => (row as TruckExportData).totalOperations || 0,
      width: 15,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Vehículos",
    columns,
    data: trucks,
    sheetName: "Vehículos",
  });
}

/**
 * Export trucks to PDF format
 */
export function exportTrucksToPDF(
  trucks: TruckExportData[],
  filename: string = "vehiculos"
): void {
  const columns: ExportColumn[] = [
    {
      key: "plateNumber",
      header: "Patente",
      accessor: (row) => (row as TruckExportData).plateNumber,
      width: 20,
    },
    {
      key: "brand",
      header: "Marca",
      accessor: (row) => (row as TruckExportData).brand || "N/A",
      width: 25,
    },
    {
      key: "model",
      header: "Modelo",
      accessor: (row) => (row as TruckExportData).model || "N/A",
      width: 25,
    },
    {
      key: "year",
      header: "Año",
      accessor: (row) => (row as TruckExportData).year || "N/A",
      width: 15,
    },
    {
      key: "vehicleType",
      header: "Tipo",
      accessor: (row) =>
        VEHICLE_TYPE_LABELS[(row as TruckExportData).vehicleType] ||
        (row as TruckExportData).vehicleType,
      width: 25,
    },
    {
      key: "capacity",
      header: "Capacidad",
      accessor: (row) => {
        const t = row as TruckExportData;
        return t.capacity ? `${t.capacity} ${t.capacityUnit || ""}` : "N/A";
      },
      width: 20,
    },
    {
      key: "operationalStatus",
      header: "Estado Op.",
      accessor: (row) => {
        const status = (row as TruckExportData).operationalStatus;
        return status ? OPERATIONAL_STATUS_LABELS[status] || status : "N/A";
      },
      width: 22,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as TruckExportData).status ? "Activo" : "Inactivo",
      width: 18,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Vehículos",
    subtitle: `Total: ${trucks.length} vehículos • Exportado: ${timestamp}`,
    columns,
    data: trucks,
  });
}

// ============================================================================
// DRIVER EXPORT FUNCTIONS
// ============================================================================

export interface DriverExportData {
  id: number;
  rut: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  licenseType: string;
  licenseNumber: string;
  licenseExpirationDate: string;
  isExternal: boolean;
  externalCompany?: string | null;
  status: boolean;
  city?: string | null;
  region?: string | null;
}

/**
 * Export drivers to XLSX format
 */
export function exportDriversToXLSX(
  drivers: DriverExportData[],
  filename: string = "choferes"
): void {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const columns: ExportColumn[] = [
    {
      key: "rut",
      header: "RUT",
      accessor: (row) => (row as DriverExportData).rut,
      width: 15,
    },
    {
      key: "firstName",
      header: "Nombre",
      accessor: (row) => (row as DriverExportData).firstName,
      width: 15,
    },
    {
      key: "lastName",
      header: "Apellido",
      accessor: (row) => (row as DriverExportData).lastName,
      width: 15,
    },
    {
      key: "email",
      header: "Email",
      accessor: (row) => (row as DriverExportData).email || "N/A",
      width: 25,
    },
    {
      key: "phone",
      header: "Teléfono",
      accessor: (row) => (row as DriverExportData).phone || "N/A",
      width: 15,
    },
    {
      key: "licenseType",
      header: "Tipo Licencia",
      accessor: (row) => (row as DriverExportData).licenseType,
      width: 12,
    },
    {
      key: "licenseNumber",
      header: "N° Licencia",
      accessor: (row) => (row as DriverExportData).licenseNumber,
      width: 15,
    },
    {
      key: "licenseExpirationDate",
      header: "Vencimiento",
      accessor: (row) =>
        formatDate((row as DriverExportData).licenseExpirationDate),
      width: 12,
    },
    {
      key: "type",
      header: "Tipo Chofer",
      accessor: (row) =>
        (row as DriverExportData).isExternal ? "Externo" : "Interno",
      width: 12,
    },
    {
      key: "externalCompany",
      header: "Empresa Externa",
      accessor: (row) => (row as DriverExportData).externalCompany || "N/A",
      width: 20,
    },
    {
      key: "city",
      header: "Ciudad",
      accessor: (row) => (row as DriverExportData).city || "N/A",
      width: 15,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as DriverExportData).status ? "Activo" : "Inactivo",
      width: 10,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Choferes",
    columns,
    data: drivers,
    sheetName: "Choferes",
  });
}

/**
 * Export drivers to PDF format
 */
export function exportDriversToPDF(
  drivers: DriverExportData[],
  filename: string = "choferes"
): void {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const columns: ExportColumn[] = [
    {
      key: "rut",
      header: "RUT",
      accessor: (row) => (row as DriverExportData).rut,
      width: 22,
    },
    {
      key: "name",
      header: "Nombre Completo",
      accessor: (row) => {
        const d = row as DriverExportData;
        return `${d.firstName} ${d.lastName}`;
      },
      width: 35,
    },
    {
      key: "phone",
      header: "Teléfono",
      accessor: (row) => (row as DriverExportData).phone || "N/A",
      width: 22,
    },
    {
      key: "licenseType",
      header: "Licencia",
      accessor: (row) => (row as DriverExportData).licenseType,
      width: 18,
    },
    {
      key: "licenseExpirationDate",
      header: "Vencimiento",
      accessor: (row) =>
        formatDate((row as DriverExportData).licenseExpirationDate),
      width: 22,
    },
    {
      key: "type",
      header: "Tipo",
      accessor: (row) =>
        (row as DriverExportData).isExternal ? "Externo" : "Interno",
      width: 18,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as DriverExportData).status ? "Activo" : "Inactivo",
      width: 18,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Choferes",
    subtitle: `Total: ${drivers.length} choferes • Exportado: ${timestamp}`,
    columns,
    data: drivers,
  });
}

// ============================================================================
// CLIENT EXPORT FUNCTIONS
// ============================================================================

export interface ClientExportData {
  id: number;
  businessName: string;
  taxId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  industry?: string | null;
  status: boolean;
  observations?: string | null;
}

/**
 * Industry labels mapping
 */
const INDUSTRY_LABELS: Record<string, string> = {
  mining: "Minería",
  construction: "Construcción",
  agriculture: "Agricultura",
  forestry: "Forestal",
  energy: "Energía",
  manufacturing: "Manufactura",
  logistics: "Logística",
  retail: "Retail",
  government: "Gobierno",
  other: "Otro",
};

/**
 * Export clients to XLSX format
 */
export function exportClientsToXLSX(
  clients: ClientExportData[],
  filename: string = "clientes"
): void {
  const columns: ExportColumn[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (row) => (row as ClientExportData).businessName,
      width: 30,
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (row) => (row as ClientExportData).taxId || "N/A",
      width: 15,
    },
    {
      key: "contactName",
      header: "Contacto",
      accessor: (row) => (row as ClientExportData).contactName || "N/A",
      width: 20,
    },
    {
      key: "contactEmail",
      header: "Email",
      accessor: (row) => (row as ClientExportData).contactEmail || "N/A",
      width: 25,
    },
    {
      key: "contactPhone",
      header: "Teléfono",
      accessor: (row) => (row as ClientExportData).contactPhone || "N/A",
      width: 15,
    },
    {
      key: "address",
      header: "Dirección",
      accessor: (row) => (row as ClientExportData).address || "N/A",
      width: 30,
    },
    {
      key: "city",
      header: "Ciudad",
      accessor: (row) => (row as ClientExportData).city || "N/A",
      width: 15,
    },
    {
      key: "region",
      header: "Región",
      accessor: (row) => (row as ClientExportData).region || "N/A",
      width: 15,
    },
    {
      key: "industry",
      header: "Rubro",
      accessor: (row) => {
        const industry = (row as ClientExportData).industry;
        return industry ? INDUSTRY_LABELS[industry] || industry : "N/A";
      },
      width: 15,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as ClientExportData).status ? "Activo" : "Inactivo",
      width: 10,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Clientes",
    columns,
    data: clients,
    sheetName: "Clientes",
  });
}

/**
 * Export clients to PDF format
 */
export function exportClientsToPDF(
  clients: ClientExportData[],
  filename: string = "clientes"
): void {
  const columns: ExportColumn[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (row) => (row as ClientExportData).businessName,
      width: 40,
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (row) => (row as ClientExportData).taxId || "N/A",
      width: 22,
    },
    {
      key: "contactName",
      header: "Contacto",
      accessor: (row) => (row as ClientExportData).contactName || "N/A",
      width: 30,
    },
    {
      key: "contactPhone",
      header: "Teléfono",
      accessor: (row) => (row as ClientExportData).contactPhone || "N/A",
      width: 22,
    },
    {
      key: "city",
      header: "Ciudad",
      accessor: (row) => (row as ClientExportData).city || "N/A",
      width: 22,
    },
    {
      key: "industry",
      header: "Rubro",
      accessor: (row) => {
        const industry = (row as ClientExportData).industry;
        return industry ? INDUSTRY_LABELS[industry] || industry : "N/A";
      },
      width: 22,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as ClientExportData).status ? "Activo" : "Inactivo",
      width: 18,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Clientes",
    subtitle: `Total: ${clients.length} clientes • Exportado: ${timestamp}`,
    columns,
    data: clients,
  });
}

// ============================================================================
// PROVIDER EXPORT FUNCTIONS
// ============================================================================

export interface ProviderExportData {
  id: number;
  businessName: string;
  taxId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  businessType?: string | null;
  serviceTypes?: string | null;
  fleetSize?: number | null;
  rating?: number | null;
  status: boolean;
}

/**
 * Business type labels mapping
 */
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  carrier: "Transportista",
  freight_forwarder: "Agente de Carga",
  logistics_operator: "Operador Logístico",
  owner_operator: "Propietario Operador",
  broker: "Broker",
  other: "Otro",
};

/**
 * Export providers to XLSX format
 */
export function exportProvidersToXLSX(
  providers: ProviderExportData[],
  filename: string = "proveedores"
): void {
  const columns: ExportColumn[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (row) => (row as ProviderExportData).businessName,
      width: 30,
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (row) => (row as ProviderExportData).taxId || "N/A",
      width: 15,
    },
    {
      key: "contactName",
      header: "Contacto",
      accessor: (row) => (row as ProviderExportData).contactName || "N/A",
      width: 20,
    },
    {
      key: "contactEmail",
      header: "Email",
      accessor: (row) => (row as ProviderExportData).contactEmail || "N/A",
      width: 25,
    },
    {
      key: "contactPhone",
      header: "Teléfono",
      accessor: (row) => (row as ProviderExportData).contactPhone || "N/A",
      width: 15,
    },
    {
      key: "city",
      header: "Ciudad",
      accessor: (row) => (row as ProviderExportData).city || "N/A",
      width: 15,
    },
    {
      key: "businessType",
      header: "Tipo de Servicio",
      accessor: (row) => {
        const type = (row as ProviderExportData).businessType;
        return type ? BUSINESS_TYPE_LABELS[type] || type : "N/A";
      },
      width: 18,
    },
    {
      key: "serviceTypes",
      header: "Servicios",
      accessor: (row) => (row as ProviderExportData).serviceTypes || "N/A",
      width: 25,
    },
    {
      key: "fleetSize",
      header: "Flota",
      accessor: (row) => {
        const size = (row as ProviderExportData).fleetSize;
        return size ? `${size} vehículos` : "N/A";
      },
      width: 12,
    },
    {
      key: "rating",
      header: "Calificación",
      accessor: (row) => {
        const rating = (row as ProviderExportData).rating;
        return rating ? `${rating}/5` : "N/A";
      },
      width: 12,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as ProviderExportData).status ? "Activo" : "Inactivo",
      width: 10,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Proveedores",
    columns,
    data: providers,
    sheetName: "Proveedores",
  });
}

/**
 * Export providers to PDF format
 */
export function exportProvidersToPDF(
  providers: ProviderExportData[],
  filename: string = "proveedores"
): void {
  const columns: ExportColumn[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (row) => (row as ProviderExportData).businessName,
      width: 40,
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (row) => (row as ProviderExportData).taxId || "N/A",
      width: 22,
    },
    {
      key: "contactName",
      header: "Contacto",
      accessor: (row) => (row as ProviderExportData).contactName || "N/A",
      width: 28,
    },
    {
      key: "businessType",
      header: "Tipo",
      accessor: (row) => {
        const type = (row as ProviderExportData).businessType;
        return type ? BUSINESS_TYPE_LABELS[type] || type : "N/A";
      },
      width: 25,
    },
    {
      key: "fleetSize",
      header: "Flota",
      accessor: (row) => {
        const size = (row as ProviderExportData).fleetSize;
        return size ? `${size}` : "N/A";
      },
      width: 15,
    },
    {
      key: "rating",
      header: "Rating",
      accessor: (row) => {
        const rating = (row as ProviderExportData).rating;
        return rating ? `${rating}/5` : "N/A";
      },
      width: 15,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as ProviderExportData).status ? "Activo" : "Inactivo",
      width: 18,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Proveedores",
    subtitle: `Total: ${providers.length} proveedores • Exportado: ${timestamp}`,
    columns,
    data: providers,
  });
}

// ============================================================================
// ROUTE EXPORT FUNCTIONS
// ============================================================================

export interface RouteExportData {
  id: number;
  name: string;
  code?: string | null;
  origin: string;
  destination: string;
  distance?: number | null;
  estimatedDuration?: number | null;
  routeType?: string | null;
  difficulty?: string | null;
  roadConditions?: string | null;
  tollsRequired?: boolean;
  estimatedTollCost?: number | null;
  status: boolean;
}

/**
 * Route type labels mapping
 */
const ROUTE_TYPE_LABELS: Record<string, string> = {
  highway: "Autopista",
  urban: "Urbana",
  rural: "Rural",
  mountain: "Montaña",
  coastal: "Costera",
  mixed: "Mixta",
};

/**
 * Difficulty labels mapping
 */
const DIFFICULTY_LABELS: Record<string, string> = {
  fácil: "Fácil",
  moderada: "Moderada",
  difícil: "Difícil",
};

/**
 * Format duration in minutes to hours and minutes
 */
function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  }
  return `${mins}m`;
}

/**
 * Export routes to XLSX format
 */
export function exportRoutesToXLSX(
  routes: RouteExportData[],
  filename: string = "rutas"
): void {
  const columns: ExportColumn[] = [
    {
      key: "name",
      header: "Nombre",
      accessor: (row) => (row as RouteExportData).name,
      width: 25,
    },
    {
      key: "code",
      header: "Código",
      accessor: (row) => (row as RouteExportData).code || "N/A",
      width: 12,
    },
    {
      key: "origin",
      header: "Origen",
      accessor: (row) => (row as RouteExportData).origin,
      width: 25,
    },
    {
      key: "destination",
      header: "Destino",
      accessor: (row) => (row as RouteExportData).destination,
      width: 25,
    },
    {
      key: "distance",
      header: "Distancia (km)",
      accessor: (row) => {
        const distance = (row as RouteExportData).distance;
        return distance ? `${distance}` : "N/A";
      },
      width: 12,
    },
    {
      key: "estimatedDuration",
      header: "Duración",
      accessor: (row) => {
        const duration = (row as RouteExportData).estimatedDuration;
        return duration ? formatDurationMinutes(duration) : "N/A";
      },
      width: 12,
    },
    {
      key: "routeType",
      header: "Tipo",
      accessor: (row) => {
        const type = (row as RouteExportData).routeType;
        return type ? ROUTE_TYPE_LABELS[type] || type : "N/A";
      },
      width: 12,
    },
    {
      key: "difficulty",
      header: "Dificultad",
      accessor: (row) => {
        const difficulty = (row as RouteExportData).difficulty;
        return difficulty ? DIFFICULTY_LABELS[difficulty] || difficulty : "N/A";
      },
      width: 12,
    },
    {
      key: "tollsRequired",
      header: "Peajes",
      accessor: (row) => ((row as RouteExportData).tollsRequired ? "Sí" : "No"),
      width: 8,
    },
    {
      key: "estimatedTollCost",
      header: "Costo Peajes",
      accessor: (row) => {
        const cost = (row as RouteExportData).estimatedTollCost;
        return cost ? `$${cost.toLocaleString("es-CL")}` : "N/A";
      },
      width: 12,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as RouteExportData).status ? "Activa" : "Inactiva",
      width: 10,
    },
  ];

  exportToXLSX({
    filename,
    title: "Reporte de Rutas",
    columns,
    data: routes,
    sheetName: "Rutas",
  });
}

/**
 * Export routes to PDF format
 */
export function exportRoutesToPDF(
  routes: RouteExportData[],
  filename: string = "rutas"
): void {
  const columns: ExportColumn[] = [
    {
      key: "name",
      header: "Nombre",
      accessor: (row) => (row as RouteExportData).name,
      width: 30,
    },
    {
      key: "origin",
      header: "Origen",
      accessor: (row) => (row as RouteExportData).origin,
      width: 30,
    },
    {
      key: "destination",
      header: "Destino",
      accessor: (row) => (row as RouteExportData).destination,
      width: 30,
    },
    {
      key: "distance",
      header: "Distancia",
      accessor: (row) => {
        const distance = (row as RouteExportData).distance;
        return distance ? `${distance} km` : "N/A";
      },
      width: 18,
    },
    {
      key: "estimatedDuration",
      header: "Duración",
      accessor: (row) => {
        const duration = (row as RouteExportData).estimatedDuration;
        return duration ? formatDurationMinutes(duration) : "N/A";
      },
      width: 18,
    },
    {
      key: "routeType",
      header: "Tipo",
      accessor: (row) => {
        const type = (row as RouteExportData).routeType;
        return type ? ROUTE_TYPE_LABELS[type] || type : "N/A";
      },
      width: 20,
    },
    {
      key: "status",
      header: "Estado",
      accessor: (row) =>
        (row as RouteExportData).status ? "Activa" : "Inactiva",
      width: 18,
    },
  ];

  const timestamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  exportToPDF({
    filename,
    title: "Reporte de Rutas",
    subtitle: `Total: ${routes.length} rutas • Exportado: ${timestamp}`,
    columns,
    data: routes,
  });
}
