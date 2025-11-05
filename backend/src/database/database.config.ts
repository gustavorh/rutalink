import { drizzle } from 'drizzle-orm/mysql2';
import { createPool, Pool } from 'mysql2/promise';
import * as schema from './schema';

export class DatabaseConfig {
  private pool: Pool;

  constructor(
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
  ) {
    this.pool = createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  getDb() {
    return drizzle(this.pool, { schema, mode: 'default' });
  }

  async closeConnection() {
    await this.pool.end();
  }
}
