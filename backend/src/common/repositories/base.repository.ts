import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, SQL } from 'drizzle-orm';

// Table type with common columns
interface TableWithId {
  id: unknown;
}

interface TableWithOperatorId extends TableWithId {
  operatorId: unknown;
}

/**
 * Base Repository Pattern
 *
 * Provides common CRUD operations for all repositories.
 * Separates data access logic from business logic.
 *
 */
export abstract class BaseRepository<T> {
  constructor(
    protected readonly db: MySql2Database<Record<string, unknown>>,
    protected readonly table: TableWithId & TableWithOperatorId,
  ) {}

  /**
   * Find a single record by ID
   */
  async findById(id: number): Promise<T | null> {
    const tableRef = this.table as TableWithId;
    const [record] = await this.db
      .select()
      .from(this.table as Parameters<typeof this.db.select>[0])
      .where(eq(tableRef.id as Parameters<typeof eq>[0], id))
      .limit(1);
    return (record as T) || null;
  }

  /**
   * Find all records for a specific operator
   */
  async findByOperatorId(operatorId: number): Promise<T[]> {
    const tableRef = this.table as TableWithOperatorId;
    return this.db
      .select()
      .from(this.table as Parameters<typeof this.db.select>[0])
      .where(
        eq(tableRef.operatorId as Parameters<typeof eq>[0], operatorId),
      ) as Promise<T[]>;
  }

  /**
   * Create a new record
   * @returns The ID of the created record
   */
  async create(data: Partial<T>, userId: number): Promise<number> {
    const [result] = await this.db
      .insert(this.table as Parameters<typeof this.db.insert>[0])
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId,
      } as Record<string, unknown>);
    return result.insertId;
  }

  /**
   * Update an existing record
   */
  async update(id: number, data: Partial<T>, userId: number): Promise<void> {
    const tableRef = this.table as TableWithId;
    await this.db
      .update(this.table as Parameters<typeof this.db.update>[0])
      .set({
        ...data,
        updatedBy: userId,
      } as Record<string, unknown>)
      .where(eq(tableRef.id as Parameters<typeof eq>[0], id));
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<void> {
    const tableRef = this.table as TableWithId;
    await this.db
      .delete(this.table as Parameters<typeof this.db.delete>[0])
      .where(eq(tableRef.id as Parameters<typeof eq>[0], id));
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
