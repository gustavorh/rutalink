import { MySql2Database } from 'drizzle-orm/mysql2';
import { grants } from '../schema';

/**
 * Seed de permisos para el módulo de Trucks (Camiones)
 *
 * Este seed crea los permisos básicos CRUD para la gestión de camiones.
 */
export async function seedTrucksPermissions(db: MySql2Database<any>) {
  console.log('🚛 Seeding trucks permissions...');

  const trucksPermissions = [
    // CRUD básico para camiones
    { resource: 'trucks', action: 'create' },
    { resource: 'trucks', action: 'read' },
    { resource: 'trucks', action: 'update' },
    { resource: 'trucks', action: 'delete' },

    // Gestión de documentos de camiones
    { resource: 'trucks:documents', action: 'create' },
    { resource: 'trucks:documents', action: 'read' },
    { resource: 'trucks:documents', action: 'update' },
    { resource: 'trucks:documents', action: 'delete' },

    // Gestión de estado operativo
    { resource: 'trucks:status', action: 'read' },
    { resource: 'trucks:status', action: 'update' },

    // Historial de operaciones
    { resource: 'trucks:operations', action: 'read' },

    // Estadísticas de flota
    { resource: 'trucks:stats', action: 'read' },
  ];

  for (const permission of trucksPermissions) {
    try {
      await db.insert(grants).values(permission);
      console.log(
        `  ✓ Permission created: ${permission.resource}:${permission.action}`,
      );
    } catch {
      console.log(
        `  ℹ Permission already exists: ${permission.resource}:${permission.action}`,
      );
    }
  }

  console.log('✅ Trucks permissions seeded successfully!');
}
