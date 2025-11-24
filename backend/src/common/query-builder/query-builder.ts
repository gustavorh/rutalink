import { SQL, eq, like, or, and, gte, lte, inArray } from 'drizzle-orm';

/**
 * Query Builder Pattern
 *
 * Provides a fluent interface for building complex SQL WHERE clauses.
 * Eliminates code duplication across services.
 *
 * @example
 * const whereClause = new QueryBuilder()
 *   .addEquals(schema.clients.operatorId, operatorId)
 *   .addEquals(schema.clients.status, true)
 *   .addSearch([schema.clients.businessName, schema.clients.taxId], 'search term')
 *   .build();
 */
export class QueryBuilder {
  private conditions: SQL[] = [];

  /**
   * Add an equality condition (field = value)
   * Automatically skips if value is undefined or null
   */
  addEquals(field: any, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(eq(field, value));
    }
    return this;
  }

  /**
   * Add a LIKE search condition across multiple fields (OR)
   * Creates: (field1 LIKE '%term%' OR field2 LIKE '%term%' OR ...)
   */
  addSearch(fields: any[], searchTerm?: string): this {
    if (searchTerm && searchTerm.trim()) {
      const searchConditions = fields.map((field) =>
        like(field, `%${searchTerm}%`),
      );
      const orCondition = or(...searchConditions);
      if (orCondition) {
        this.conditions.push(orCondition);
      }
    }
    return this;
  }

  /**
   * Add a date range condition
   * @param field The date field to filter
   * @param startDate Optional start date (inclusive)
   * @param endDate Optional end date (inclusive)
   */
  addDateRange(field: any, startDate?: Date, endDate?: Date): this {
    if (startDate) {
      this.conditions.push(gte(field, startDate));
    }
    if (endDate) {
      this.conditions.push(lte(field, endDate));
    }
    return this;
  }

  /**
   * Add a greater than or equal condition (field >= value)
   */
  addGreaterThanOrEqual(field: any, value?: number | Date): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(gte(field, value));
    }
    return this;
  }

  /**
   * Add a less than or equal condition (field <= value)
   */
  addLessThanOrEqual(field: any, value?: number | Date): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(lte(field, value));
    }
    return this;
  }

  /**
   * Add an IN condition (field IN (value1, value2, ...))
   */
  addIn(field: any, values?: any[]): this {
    if (values && values.length > 0) {
      this.conditions.push(inArray(field, values));
    }
    return this;
  }

  /**
   * Add a custom SQL condition
   * Use this for complex conditions not covered by other methods
   */
  addCondition(condition: SQL | undefined): this {
    if (condition) {
      this.conditions.push(condition);
    }
    return this;
  }

  /**
   * Add an OR condition between multiple fields with the same value
   * Creates: (field1 = value OR field2 = value OR ...)
   */
  addOrEquals(fields: any[], value: any): this {
    if (value !== undefined && value !== null && fields.length > 0) {
      const orConditions = fields.map((field) => eq(field, value));
      const orCondition = or(...orConditions);
      if (orCondition) {
        this.conditions.push(orCondition);
      }
    }
    return this;
  }

  /**
   * Build the final WHERE clause
   * @returns SQL condition combining all added conditions with AND, or undefined if no conditions
   */
  build(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }

  /**
   * Get the number of conditions added
   */
  getConditionCount(): number {
    return this.conditions.length;
  }

  /**
   * Reset all conditions (useful for reusing the builder)
   */
  reset(): this {
    this.conditions = [];
    return this;
  }
}
