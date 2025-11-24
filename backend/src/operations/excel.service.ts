import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface OperationExcelRow {
  row: number;
  operationNumber: string;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  clientName?: string;
  providerName?: string;
  routeName?: string;
  driverRut: string;
  vehiclePlateNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  distance?: number;
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

@Injectable()
export class ExcelService {
  /**
   * Generates an Excel template for batch upload of operations
   */
  async generateOperationsTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Operaciones', {
      properties: { tabColor: { argb: 'FF0070C0' } },
    });

    // Define columns with proper widths and formatting
    worksheet.columns = [
      {
        header: 'N° Operación (*)',
        key: 'operationNumber',
        width: 20,
      },
      {
        header: 'Fecha/Hora Inicio (*)',
        key: 'scheduledStartDate',
        width: 20,
      },
      {
        header: 'Fecha/Hora Fin',
        key: 'scheduledEndDate',
        width: 20,
      },
      {
        header: 'Cliente',
        key: 'clientName',
        width: 30,
      },
      {
        header: 'Proveedor',
        key: 'providerName',
        width: 30,
      },
      {
        header: 'Tramo/Ruta',
        key: 'routeName',
        width: 30,
      },
      {
        header: 'RUT Chofer (*)',
        key: 'driverRut',
        width: 15,
      },
      {
        header: 'Patente Camión (*)',
        key: 'vehiclePlateNumber',
        width: 15,
      },
      {
        header: 'Tipo Operación (*)',
        key: 'operationType',
        width: 20,
      },
      {
        header: 'Origen (*)',
        key: 'origin',
        width: 40,
      },
      {
        header: 'Destino (*)',
        key: 'destination',
        width: 40,
      },
      {
        header: 'Distancia (km)',
        key: 'distance',
        width: 15,
      },
      {
        header: 'Descripción Carga',
        key: 'cargoDescription',
        width: 40,
      },
      {
        header: 'Peso Carga (kg)',
        key: 'cargoWeight',
        width: 15,
      },
      {
        header: 'Observaciones',
        key: 'notes',
        width: 50,
      },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 20;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Add example rows
    const exampleRows = [
      {
        operationNumber: 'OP-001',
        scheduledStartDate: '2025-11-20 08:00',
        scheduledEndDate: '2025-11-20 18:00',
        clientName: 'Minera del Norte',
        providerName: '',
        routeName: 'Santiago - Calama',
        driverRut: '12.345.678-9',
        vehiclePlateNumber: 'ABCD12',
        operationType: 'delivery',
        origin: 'Santiago, Región Metropolitana',
        destination: 'Calama, Región de Antofagasta',
        distance: 1650,
        cargoDescription: 'Equipos mineros',
        cargoWeight: 15000,
        notes: 'Carga frágil, manejar con cuidado',
      },
      {
        operationNumber: 'OP-002',
        scheduledStartDate: '2025-11-21 09:00',
        scheduledEndDate: '2025-11-21 15:00',
        clientName: '',
        providerName: 'Transportes del Sur',
        routeName: '',
        driverRut: '98.765.432-1',
        vehiclePlateNumber: 'EFGH34',
        operationType: 'pickup',
        origin: 'Valparaíso, Región de Valparaíso',
        destination: 'Santiago, Región Metropolitana',
        distance: 120,
        cargoDescription: 'Contenedores',
        cargoWeight: 8000,
        notes: '',
      },
    ];

    // Add example rows to worksheet
    exampleRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);
      excelRow.height = 18;
      excelRow.alignment = { vertical: 'middle' };

      // Add alternating row colors
      if (index % 2 === 0) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' },
        };
      }

      // Add borders
      excelRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instrucciones', {
      properties: { tabColor: { argb: 'FFFF6600' } },
    });

    instructionsSheet.columns = [{ width: 100 }];

    const instructions = [
      {
        title: 'INSTRUCCIONES PARA CARGA MASIVA DE OPERACIONES',
        style: { bold: true, size: 14, color: { argb: 'FF0070C0' } },
      },
      { title: '', style: {} },
      {
        title: 'CAMPOS OBLIGATORIOS (marcados con *):',
        style: { bold: true, size: 12 },
      },
      {
        title:
          '  • N° Operación: Número único de la operación (máx. 50 caracteres)',
        style: {},
      },
      {
        title:
          '  • Fecha/Hora Inicio: Fecha y hora programada de inicio (formato: YYYY-MM-DD HH:MM)',
        style: {},
      },
      {
        title:
          '  • RUT Chofer: RUT del chofer asignado (formato: 12.345.678-9)',
        style: {},
      },
      {
        title: '  • Patente Camión: Patente del vehículo asignado',
        style: {},
      },
      {
        title:
          '  • Tipo Operación: Tipo de operación (delivery, pickup, transfer, etc.)',
        style: {},
      },
      { title: '  • Origen: Lugar de origen de la operación', style: {} },
      { title: '  • Destino: Lugar de destino de la operación', style: {} },
      { title: '', style: {} },
      { title: 'CAMPOS OPCIONALES:', style: { bold: true, size: 12 } },
      {
        title:
          '  • Fecha/Hora Fin: Fecha y hora estimada de finalización (formato: YYYY-MM-DD HH:MM)',
        style: {},
      },
      {
        title:
          '  • Cliente: Nombre del cliente (debe existir previamente en el sistema)',
        style: {},
      },
      {
        title:
          '  • Proveedor: Nombre del proveedor (debe existir previamente en el sistema)',
        style: {},
      },
      {
        title:
          '  • Tramo/Ruta: Nombre del tramo o ruta (debe existir previamente en el sistema)',
        style: {},
      },
      { title: '  • Distancia: Distancia en kilómetros', style: {} },
      {
        title:
          '  • Descripción Carga: Descripción de la mercancía a transportar',
        style: {},
      },
      { title: '  • Peso Carga: Peso de la carga en kilogramos', style: {} },
      {
        title: '  • Observaciones: Notas adicionales sobre la operación',
        style: {},
      },
      { title: '', style: {} },
      { title: 'VALIDACIONES:', style: { bold: true, size: 12 } },
      {
        title:
          '  • El sistema validará que el chofer y vehículo existan y pertenezcan al operador',
        style: {},
      },
      {
        title:
          '  • El chofer y vehículo deben estar activos en el momento de la carga',
        style: {},
      },
      {
        title: '  • El número de operación debe ser único dentro del operador',
        style: {},
      },
      {
        title:
          '  • Si se especifica Cliente, Proveedor o Tramo, deben existir en el sistema',
        style: {},
      },
      {
        title:
          '  • Las fechas deben estar en formato correcto (YYYY-MM-DD HH:MM)',
        style: {},
      },
      {
        title: '  • Los valores numéricos deben ser positivos',
        style: {},
      },
      { title: '', style: {} },
      { title: 'RECOMENDACIONES:', style: { bold: true, size: 12 } },
      {
        title:
          '  • Completar la plantilla con cuidado para evitar errores de validación',
        style: {},
      },
      {
        title: '  • Eliminar las filas de ejemplo antes de cargar el archivo',
        style: {},
      },
      {
        title:
          '  • Verificar que todos los datos referenciales (clientes, choferes, vehículos) existan',
        style: {},
      },
      {
        title:
          '  • El sistema reportará todos los errores detectados para su corrección',
        style: {},
      },
      {
        title:
          '  • Solo las operaciones válidas serán registradas en el sistema',
        style: {},
      },
    ];

    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow([instruction.title]);
      row.font = instruction.style;
      row.alignment = { vertical: 'middle', wrapText: true };
      if (index === 0) {
        row.height = 25;
      }
    });

    // Generate and return buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Parses an Excel file and extracts operation data
   */
  async parseOperationsExcel(fileBuffer: Buffer): Promise<{
    data: OperationExcelRow[];
    errors: ValidationError[];
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet('Operaciones');
    if (!worksheet) {
      return {
        data: [],
        errors: [
          {
            row: 0,
            field: 'general',
            message: 'No se encontró la hoja "Operaciones" en el archivo Excel',
            value: null,
          },
        ],
      };
    }

    const data: OperationExcelRow[] = [];
    const errors: ValidationError[] = [];

    // Skip header row (row 1)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Skip empty rows
      if (this.isRowEmpty(row)) {
        continue;
      }

      const rowData: OperationExcelRow = {
        row: rowNumber,
        operationNumber: this.getCellValue(row, 1),
        scheduledStartDate: this.getCellValue(row, 2),
        scheduledEndDate: this.getCellValue(row, 3) || undefined,
        clientName: this.getCellValue(row, 4) || undefined,
        providerName: this.getCellValue(row, 5) || undefined,
        routeName: this.getCellValue(row, 6) || undefined,
        driverRut: this.getCellValue(row, 7),
        vehiclePlateNumber: this.getCellValue(row, 8),
        operationType: this.getCellValue(row, 9),
        origin: this.getCellValue(row, 10),
        destination: this.getCellValue(row, 11),
        distance: this.getNumericValue(row, 12),
        cargoDescription: this.getCellValue(row, 13) || undefined,
        cargoWeight: this.getNumericValue(row, 14),
        notes: this.getCellValue(row, 15) || undefined,
      };

      // Basic field validation
      this.validateRow(rowData, errors);

      data.push(rowData);
    }

    return { data, errors };
  }

  /**
   * Validates a row of data
   */
  private validateRow(
    rowData: OperationExcelRow,
    errors: ValidationError[],
  ): void {
    const { row } = rowData;

    // Required fields validation
    if (!rowData.operationNumber) {
      errors.push({
        row,
        field: 'operationNumber',
        message: 'El número de operación es obligatorio',
        value: rowData.operationNumber,
      });
    } else if (rowData.operationNumber.length > 50) {
      errors.push({
        row,
        field: 'operationNumber',
        message: 'El número de operación no puede exceder 50 caracteres',
        value: rowData.operationNumber,
      });
    }

    if (!rowData.scheduledStartDate) {
      errors.push({
        row,
        field: 'scheduledStartDate',
        message: 'La fecha/hora de inicio es obligatoria',
        value: rowData.scheduledStartDate,
      });
    } else if (!this.isValidDate(rowData.scheduledStartDate)) {
      errors.push({
        row,
        field: 'scheduledStartDate',
        message:
          'La fecha/hora de inicio tiene un formato inválido. Use: YYYY-MM-DD HH:MM',
        value: rowData.scheduledStartDate,
      });
    }

    if (
      rowData.scheduledEndDate &&
      !this.isValidDate(rowData.scheduledEndDate)
    ) {
      errors.push({
        row,
        field: 'scheduledEndDate',
        message:
          'La fecha/hora de fin tiene un formato inválido. Use: YYYY-MM-DD HH:MM',
        value: rowData.scheduledEndDate,
      });
    }

    if (!rowData.driverRut) {
      errors.push({
        row,
        field: 'driverRut',
        message: 'El RUT del chofer es obligatorio',
        value: rowData.driverRut,
      });
    }

    if (!rowData.vehiclePlateNumber) {
      errors.push({
        row,
        field: 'vehiclePlateNumber',
        message: 'La patente del vehículo es obligatoria',
        value: rowData.vehiclePlateNumber,
      });
    }

    if (!rowData.operationType) {
      errors.push({
        row,
        field: 'operationType',
        message: 'El tipo de operación es obligatorio',
        value: rowData.operationType,
      });
    } else if (rowData.operationType.length > 50) {
      errors.push({
        row,
        field: 'operationType',
        message: 'El tipo de operación no puede exceder 50 caracteres',
        value: rowData.operationType,
      });
    }

    if (!rowData.origin) {
      errors.push({
        row,
        field: 'origin',
        message: 'El origen es obligatorio',
        value: rowData.origin,
      });
    } else if (rowData.origin.length > 500) {
      errors.push({
        row,
        field: 'origin',
        message: 'El origen no puede exceder 500 caracteres',
        value: rowData.origin,
      });
    }

    if (!rowData.destination) {
      errors.push({
        row,
        field: 'destination',
        message: 'El destino es obligatorio',
        value: rowData.destination,
      });
    } else if (rowData.destination.length > 500) {
      errors.push({
        row,
        field: 'destination',
        message: 'El destino no puede exceder 500 caracteres',
        value: rowData.destination,
      });
    }

    // Optional fields validation
    if (rowData.distance !== undefined && rowData.distance < 0) {
      errors.push({
        row,
        field: 'distance',
        message: 'La distancia debe ser un número positivo',
        value: rowData.distance,
      });
    }

    if (rowData.cargoWeight !== undefined && rowData.cargoWeight < 0) {
      errors.push({
        row,
        field: 'cargoWeight',
        message: 'El peso de la carga debe ser un número positivo',
        value: rowData.cargoWeight,
      });
    }

    if (rowData.cargoDescription && rowData.cargoDescription.length > 1000) {
      errors.push({
        row,
        field: 'cargoDescription',
        message: 'La descripción de la carga no puede exceder 1000 caracteres',
        value: rowData.cargoDescription,
      });
    }

    if (rowData.notes && rowData.notes.length > 1000) {
      errors.push({
        row,
        field: 'notes',
        message: 'Las observaciones no pueden exceder 1000 caracteres',
        value: rowData.notes,
      });
    }
  }

  /**
   * Checks if a row is empty
   */
  private isRowEmpty(row: ExcelJS.Row): boolean {
    let isEmpty = true;
    row.eachCell({ includeEmpty: false }, () => {
      isEmpty = false;
    });
    return isEmpty;
  }

  /**
   * Gets cell value as string
   */
  private getCellValue(row: ExcelJS.Row, colNumber: number): string {
    const cell = row.getCell(colNumber);
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }

    if (cell.value instanceof Date) {
      return this.formatDate(cell.value);
    }

    if (typeof cell.value === 'object') {
      const cellValue = cell.value as Record<string, unknown>;
      if ('text' in cellValue) {
        return String(cellValue.text).trim();
      }
      if ('result' in cellValue) {
        return String(cellValue.result).trim();
      }
      // For other object types, try to get a string representation
      return '';
    }

    return String(cell.value).trim();
  }

  /**
   * Gets cell value as number
   */
  private getNumericValue(
    row: ExcelJS.Row,
    colNumber: number,
  ): number | undefined {
    const value = this.getCellValue(row, colNumber);
    if (!value) {
      return undefined;
    }

    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Validates date format (YYYY-MM-DD HH:MM or ISO format)
   */
  private isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    // Try parsing as ISO date first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return true;
    }

    // Check for format: YYYY-MM-DD HH:MM
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/;
    if (dateTimeRegex.test(dateString)) {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    }

    return false;
  }

  /**
   * Formats a date object to YYYY-MM-DD HH:MM
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
