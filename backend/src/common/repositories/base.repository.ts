import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, SQL } from 'drizzle-orm';

/**
 * Base Repository Pattern
 *
 * Provides common CRUD operations for all repositories.
 * Separates data access logic from business logic.
 *
 */
export abstract class BaseRepository<T> {
  constructor(
    protected readonly db: MySql2Database<any>,
    protected readonly table: any,
  ) {}

  /**
   * Find a single record by ID
   */
  async findById(id: number): Promise<T | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return (record as T) || null;
  }

  /**
   * Find all records for a specific operator
   */
  async findByOperatorId(operatorId: number): Promise<T[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(this.table.operatorId, operatorId)) as Promise<T[]>;
  }

  /**
   * Create a new record
   * @returns The ID of the created record
   */
  async create(data: Partial<T>, userId: number): Promise<number> {
    const [result] = await this.db.insert(this.table).values({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });
    return result.insertId;
  }

  /**
   * Update an existing record
   */
  async update(id: number, data: Partial<T>, userId: number): Promise<void> {
    await this.db
      .update(this.table)
      .set({
        ...data,
        updatedBy: userId,
      })
      .where(eq(this.table.id, id));
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: number): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Count records with optional WHERE clause
   */
  async count(whereClause?: SQL): Promise<number> {
    const query = this.db.select().from(this.table);

    if (whereClause) {
      query.where(whereClause);
    }

    const result = await query;
    return result.length;
  }

  /**
   * Helper method to build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: SQL[]): SQL | undefined {
    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
