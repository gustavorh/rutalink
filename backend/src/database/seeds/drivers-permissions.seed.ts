import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Seed de permisos para el módulo de choferes
 * Incluye permisos para: drivers, vehicles y operations
 */

const DRIVERS_PERMISSIONS = [
  // Drivers permissions
  { resource: 'drivers', action: 'create' },
  { resource: 'drivers', action: 'read' },
  { resource: 'drivers', action: 'update' },
  { resource: 'drivers', action: 'delete' },

  // Vehicles permissions
  { resource: 'vehicles', action: 'create' },
  { resource: 'vehicles', action: 'read' },
  { resource: 'vehicles', action: 'update' },
  { resource: 'vehicles', action: 'delete' },

  // Operations permissions
  { resource: 'operations', action: 'create' },
  { resource: 'operations', action: 'read' },
  { resource: 'operations', action: 'update' },
  { resource: 'operations', action: 'delete' },
];

async function seedDriversPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'transport_db',
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  console.log('🚀 Starting drivers permissions seed...\n');

  try {
    let createdCount = 0;
    let existingCount = 0;

    for (const permission of DRIVERS_PERMISSIONS) {
      // Check if permission already exists
      const existing = await db
        .select()
        .from(schema.grants)
        .where(
          and(
            eq(schema.grants.resource, permission.resource),
            eq(schema.grants.action, permission.action),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.grants).values({
          resource: permission.resource,
          action: permission.action,
        });
        console.log(
          `✅ Created permission: ${permission.resource}:${permission.action}`,
        );
        createdCount++;
      } else {
        console.log(
          `ℹ️  Permission already exists: ${permission.resource}:${permission.action}`,
        );
        existingCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} permissions`);
    console.log(`   ℹ️  Already existed: ${existingCount} permissions`);
    console.log(
      `   📝 Total processed: ${DRIVERS_PERMISSIONS.length} permissions`,
    );
    console.log('\n✅ Drivers permissions seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding drivers permissions:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedDriversPermissions()
    .then(() => {
      console.log('✅ Seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed process failed:', error);
      process.exit(1);
    });
}

export { seedDriversPermissions };
