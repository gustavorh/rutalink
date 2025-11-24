import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, lt, asc, desc, sql } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { VehicleDocument, Vehicle } from '../../database/schema';

/**
 * Vehicle Documents Repository
 *
 * Handles all data access operations for vehicle documents.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class VehicleDocumentsRepository extends BaseRepository<VehicleDocument> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.vehicleDocuments);
  }

  /**
   * Find all documents for a vehicle
   */
  async findByVehicleId(vehicleId: number): Promise<VehicleDocument[]> {
    return this.db
      .select()
      .from(schema.vehicleDocuments)
      .where(eq(schema.vehicleDocuments.vehicleId, vehicleId))
      .orderBy(desc(schema.vehicleDocuments.expirationDate));
  }

  /**
   * Create document with proper date handling
   */
  async createDocument(
    data: Partial<VehicleDocument>,
    userId: number,
  ): Promise<number> {
    const issueDateValue = data.issueDate;
    const expirationDateValue = data.expirationDate;

    const insertData = {
      vehicleId: data.vehicleId!,
      documentType: data.documentType!,
      documentName: data.documentName!,
      fileName: data.fileName ?? null,
      filePath: data.filePath ?? null,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      issueDate: issueDateValue
        ? new Date(issueDateValue as string | number | Date)
        : null,
      expirationDate: expirationDateValue
        ? new Date(expirationDateValue as string | number | Date)
        : null,
      insuranceCompany: data.insuranceCompany ?? null,
      policyNumber: data.policyNumber ?? null,
      coverageAmount: data.coverageAmount ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [result] = await this.db
      .insert(schema.vehicleDocuments)
      .values(insertData);
    return result.insertId;
  }

  /**
   * Update document with proper date handling
   */
  async updateDocument(
    id: number,
    data: Partial<VehicleDocument>,
    userId: number,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedBy: userId,
    };

    // Handle date conversions
    const issueDateValue = data.issueDate;
    const expirationDateValue = data.expirationDate;

    if (issueDateValue !== undefined) {
      updateData.issueDate = issueDateValue
        ? new Date(issueDateValue as string | number | Date)
        : null;
    }
    if (expirationDateValue !== undefined) {
      updateData.expirationDate = expirationDateValue
        ? new Date(expirationDateValue as string | number | Date)
        : null;
    }

    await this.db
      .update(schema.vehicleDocuments)
      .set(updateData)
      .where(eq(schema.vehicleDocuments.id, id));
  }

  /**
   * Get expiring documents for vehicles in an operator
   */
  async findExpiringDocuments(
    operatorId: number,
    days: number = 30,
  ): Promise<Array<{ document: VehicleDocument; vehicle: Vehicle }>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.db
      .select({
        document: schema.vehicleDocuments,
        vehicle: schema.vehicles,
      })
      .from(schema.vehicleDocuments)
      .innerJoin(
        schema.vehicles,
        eq(schema.vehicleDocuments.vehicleId, schema.vehicles.id),
      )
      .where(
        and(
          eq(schema.vehicles.operatorId, operatorId),
          lt(schema.vehicleDocuments.expirationDate, futureDate),
          sql`${schema.vehicleDocuments.expirationDate} >= CURDATE()`,
        ),
      )
      .orderBy(asc(schema.vehicleDocuments.expirationDate));
  }

  /**
   * Check if vehicle has expired documents
   */
  async hasExpiredDocuments(vehicleId: number): Promise<boolean> {
    const [document] = await this.db
      .select()
      .from(schema.vehicleDocuments)
      .where(
        and(
          eq(schema.vehicleDocuments.vehicleId, vehicleId),
          lt(schema.vehicleDocuments.expirationDate, new Date()),
        ),
      )
      .limit(1);
    return document !== null;
  }
}
