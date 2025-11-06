#!/usr/bin/env tsx

/**
 * Script to run the permissions seed
 *
 * Usage:
 *   npm run seed:permissions
 *   or
 *   tsx src/database/seeds/run-seed.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { seedPermissions } from './permissions.seed';
import { seedTrucksPermissions } from './trucks-permissions.seed';

dotenv.config();

async function main() {
  console.log('🚀 Starting seed process...\n');

  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'fullstack_db',
  });

  console.log('✅ Database connection established\n');

  const db = drizzle(connection);

  try {
    await seedPermissions(db);
    await seedTrucksPermissions(db);
    console.log('\n🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('👋 Database connection closed');
  }
}

void main();
