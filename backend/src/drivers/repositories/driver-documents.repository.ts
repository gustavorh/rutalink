import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { DriverDocument, NewDriverDocument } from '../../database/schema';

/**
 * Driver Documents Repository
 *
 * Handles all data access operations for driver documents.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class DriverDocumentsRepository extends BaseRepository<DriverDocument> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.driverDocuments);
  }

  /**
   * Find all documents for a driver
   */
  async findByDriverId(driverId: number): Promise<DriverDocument[]> {
    return this.db
      .select()
      .from(schema.driverDocuments)
      .where(eq(schema.driverDocuments.driverId, driverId))
      .orderBy(desc(schema.driverDocuments.createdAt));
  }

  /**
   * Create driver document and return the created document
   */
  async createDriverDocument(
    documentData: NewDriverDocument,
    userId: number,
  ): Promise<DriverDocument> {
    const [insertedDocument] = await this.db
      .insert(schema.driverDocuments)
      .values({
        ...documentData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdDocument = await this.findById(insertedDocument.id);
    if (!createdDocument) {
      throw new Error('Failed to retrieve created driver document');
    }
    return createdDocument;
  }

  /**
   * Update driver document and return the updated document
   */
  async updateDriverDocument(
    id: number,
    documentData: Partial<DriverDocument>,
    userId: number,
  ): Promise<DriverDocument> {
    await this.db
      .update(schema.driverDocuments)
      .set({
        ...documentData,
        updatedBy: userId,
      })
      .where(eq(schema.driverDocuments.id, id));

    const updatedDocument = await this.findById(id);
    if (!updatedDocument) {
      throw new Error('Failed to retrieve updated driver document');
    }
    return updatedDocument;
  }
}
