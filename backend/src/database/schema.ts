import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// OPERATORS TABLE
// ============================================================================
export const operators = mysqlTable(
  'operators',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    rut: varchar('rut', { length: 12 }), // Format: 21.023.531-0
    super: boolean('super').notNull().default(false),
    expiration: timestamp('expiration'),
    status: boolean('status').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    rutIdx: uniqueIndex('rut_idx').on(table.rut),
    statusIdx: index('status_idx').on(table.status),
    superIdx: index('super_idx').on(table.super),
  }),
);

export const operatorsRelations = relations(operators, ({ many }) => ({
  users: many(users),
  roles: many(roles),
}));

// ============================================================================
// ROLES TABLE
// ============================================================================
export const roles = mysqlTable(
  'roles',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 100 }).notNull(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('operator_id_idx').on(table.operatorId),
    operatorNameIdx: uniqueIndex('operator_name_idx').on(
      table.operatorId,
      table.name,
    ),
  }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  operator: one(operators, {
    fields: [roles.operatorId],
    references: [operators.id],
  }),
  users: many(users),
  roleGrants: many(roleGrants),
}));

// ============================================================================
// GRANTS TABLE (Universal - shared across all operators)
// ============================================================================
export const grants = mysqlTable(
  'grants',
  {
    id: int('id').primaryKey().autoincrement(),
    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    resourceActionIdx: uniqueIndex('resource_action_idx').on(
      table.resource,
      table.action,
    ),
  }),
);

export const grantsRelations = relations(grants, ({ many }) => ({
  roleGrants: many(roleGrants),
}));

// ============================================================================
// ROLE_GRANTS JUNCTION TABLE (Many-to-Many: Roles ↔ Grants)
// ============================================================================
export const roleGrants = mysqlTable(
  'role_grants',
  {
    roleId: int('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    grantId: int('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.grantId] }),
    grantIdIdx: index('grant_id_idx').on(table.grantId),
  }),
);

export const roleGrantsRelations = relations(roleGrants, ({ one }) => ({
  role: one(roles, {
    fields: [roleGrants.roleId],
    references: [roles.id],
  }),
  grant: one(grants, {
    fields: [roleGrants.grantId],
    references: [grants.id],
  }),
}));

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    status: boolean('status').notNull().default(true),
    lastActivityAt: timestamp('last_activity_at'),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    roleId: int('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('user_operator_id_idx').on(table.operatorId),
    roleIdIdx: index('user_role_id_idx').on(table.roleId),
    statusIdx: index('user_status_idx').on(table.status),
  }),
);

export const usersRelations = relations(users, ({ one }) => ({
  operator: one(operators, {
    fields: [users.operatorId],
    references: [operators.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// AUDIT_LOG TABLE
// ============================================================================
export const auditLog = mysqlTable(
  'audit_log',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }),
    resourceId: int('resource_id'),
    details: varchar('details', { length: 1000 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_user_id_idx').on(table.userId),
    operatorIdIdx: index('audit_operator_id_idx').on(table.operatorId),
    actionIdx: index('audit_action_idx').on(table.action),
    resourceIdx: index('audit_resource_idx').on(table.resource),
    createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
  }),
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [auditLog.operatorId],
    references: [operators.id],
  }),
}));

// ============================================================================
// DRIVERS TABLE (Choferes)
// ============================================================================
export const drivers = mysqlTable(
  'drivers',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    rut: varchar('rut', { length: 12 }).notNull(), // Format: 21.023.531-0
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    emergencyContactName: varchar('emergency_contact_name', { length: 200 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    licenseType: varchar('license_type', { length: 10 }).notNull(), // A1, A2, A3, A4, A5, B, C, D, E, F
    licenseNumber: varchar('license_number', { length: 50 }).notNull(),
    licenseExpirationDate: timestamp('license_expiration_date').notNull(),
    dateOfBirth: timestamp('date_of_birth'),
    address: varchar('address', { length: 500 }),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),
    status: boolean('status').notNull().default(true), // active/inactive
    isExternal: boolean('is_external').notNull().default(false), // chofer externo o de la empresa
    externalCompany: varchar('external_company', { length: 255 }), // nombre de empresa externa si aplica
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('driver_operator_id_idx').on(table.operatorId),
    rutIdx: uniqueIndex('driver_rut_idx').on(table.operatorId, table.rut),
    statusIdx: index('driver_status_idx').on(table.status),
    licenseExpirationIdx: index('driver_license_expiration_idx').on(
      table.licenseExpirationDate,
    ),
  }),
);

export const driversRelations = relations(drivers, ({ one, many }) => ({
  operator: one(operators, {
    fields: [drivers.operatorId],
    references: [operators.id],
  }),
  documents: many(driverDocuments),
  vehicleAssignments: many(driverVehicles),
  operations: many(operations),
}));

// ============================================================================
// DRIVER_DOCUMENTS TABLE (Documentación de Choferes)
// ============================================================================
export const driverDocuments = mysqlTable(
  'driver_documents',
  {
    id: int('id').primaryKey().autoincrement(),
    driverId: int('driver_id')
      .notNull()
      .references(() => drivers.id, { onDelete: 'cascade' }),
    documentType: varchar('document_type', { length: 50 }).notNull(), // license, certificate, medical, psychotechnical, etc.
    documentName: varchar('document_name', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileSize: int('file_size'), // bytes
    mimeType: varchar('mime_type', { length: 100 }),
    issueDate: timestamp('issue_date'),
    expirationDate: timestamp('expiration_date'),
    notes: varchar('notes', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    driverIdIdx: index('driver_document_driver_id_idx').on(table.driverId),
    expirationDateIdx: index('driver_document_expiration_idx').on(
      table.expirationDate,
    ),
    documentTypeIdx: index('driver_document_type_idx').on(table.documentType),
  }),
);

export const driverDocumentsRelations = relations(
  driverDocuments,
  ({ one }) => ({
    driver: one(drivers, {
      fields: [driverDocuments.driverId],
      references: [drivers.id],
    }),
  }),
);

// ============================================================================
// VEHICLES TABLE (Vehículos)
// ============================================================================
export const vehicles = mysqlTable(
  'vehicles',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    plateNumber: varchar('plate_number', { length: 20 }).notNull(), // Patente
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),
    year: int('year'),
    vehicleType: varchar('vehicle_type', { length: 50 }).notNull(), // truck, van, car, etc.
    capacity: int('capacity'), // capacidad de carga o pasajeros
    capacityUnit: varchar('capacity_unit', { length: 20 }), // kg, tons, passengers
    vin: varchar('vin', { length: 50 }), // VIN number
    color: varchar('color', { length: 50 }),
    status: boolean('status').notNull().default(true),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('vehicle_operator_id_idx').on(table.operatorId),
    plateNumberIdx: uniqueIndex('vehicle_plate_number_idx').on(
      table.operatorId,
      table.plateNumber,
    ),
    statusIdx: index('vehicle_status_idx').on(table.status),
  }),
);

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  operator: one(operators, {
    fields: [vehicles.operatorId],
    references: [operators.id],
  }),
  driverAssignments: many(driverVehicles),
  operations: many(operations),
  documents: many(vehicleDocuments),
}));

// ============================================================================
// DRIVER_VEHICLES TABLE (Asociación Chofer-Vehículo)
// ============================================================================
export const driverVehicles = mysqlTable(
  'driver_vehicles',
  {
    id: int('id').primaryKey().autoincrement(),
    driverId: int('driver_id')
      .notNull()
      .references(() => drivers.id, { onDelete: 'cascade' }),
    vehicleId: int('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
    unassignedAt: timestamp('unassigned_at'),
    isActive: boolean('is_active').notNull().default(true),
    notes: varchar('notes', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    driverIdIdx: index('driver_vehicle_driver_id_idx').on(table.driverId),
    vehicleIdIdx: index('driver_vehicle_vehicle_id_idx').on(table.vehicleId),
    isActiveIdx: index('driver_vehicle_is_active_idx').on(table.isActive),
  }),
);

export const driverVehiclesRelations = relations(driverVehicles, ({ one }) => ({
  driver: one(drivers, {
    fields: [driverVehicles.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [driverVehicles.vehicleId],
    references: [vehicles.id],
  }),
}));

// ============================================================================
// VEHICLE_DOCUMENTS TABLE (Documentación de Vehículos)
// ============================================================================
export const vehicleDocuments = mysqlTable(
  'vehicle_documents',
  {
    id: int('id').primaryKey().autoincrement(),
    vehicleId: int('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    documentType: varchar('document_type', { length: 50 }).notNull(), // circulation_permit, technical_review, insurance, ownership, etc.
    documentName: varchar('document_name', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }),
    filePath: varchar('file_path', { length: 500 }),
    fileSize: int('file_size'), // bytes
    mimeType: varchar('mime_type', { length: 100 }),
    issueDate: timestamp('issue_date'),
    expirationDate: timestamp('expiration_date'),
    insuranceCompany: varchar('insurance_company', { length: 255 }), // para documentos de seguro
    policyNumber: varchar('policy_number', { length: 100 }), // número de póliza
    coverageAmount: int('coverage_amount'), // monto de cobertura
    notes: varchar('notes', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    vehicleIdIdx: index('vehicle_document_vehicle_id_idx').on(table.vehicleId),
    expirationDateIdx: index('vehicle_document_expiration_idx').on(
      table.expirationDate,
    ),
    documentTypeIdx: index('vehicle_document_type_idx').on(table.documentType),
  }),
);

export const vehicleDocumentsRelations = relations(
  vehicleDocuments,
  ({ one }) => ({
    vehicle: one(vehicles, {
      fields: [vehicleDocuments.vehicleId],
      references: [vehicles.id],
    }),
  }),
);

// ============================================================================
// CLIENTS TABLE (Clientes)
// ============================================================================
export const clients = mysqlTable(
  'clients',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    businessName: varchar('business_name', { length: 255 }).notNull(), // razón social
    taxId: varchar('tax_id', { length: 20 }), // RUT de la empresa
    contactName: varchar('contact_name', { length: 200 }), // nombre de contacto
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    address: varchar('address', { length: 500 }),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),
    country: varchar('country', { length: 100 }).default('Chile'),
    industry: varchar('industry', { length: 100 }), // minería, construcción, industrial, agricultura, etc.
    status: boolean('status').notNull().default(true), // active/inactive
    observations: varchar('observations', { length: 1000 }), // observaciones generales
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('client_operator_id_idx').on(table.operatorId),
    businessNameIdx: index('client_business_name_idx').on(table.businessName),
    taxIdIdx: index('client_tax_id_idx').on(table.operatorId, table.taxId),
    industryIdx: index('client_industry_idx').on(table.industry),
    statusIdx: index('client_status_idx').on(table.status),
  }),
);

export const clientsRelations = relations(clients, ({ one, many }) => ({
  operator: one(operators, {
    fields: [clients.operatorId],
    references: [operators.id],
  }),
  operations: many(operations),
}));

// ============================================================================
// PROVIDERS TABLE (Proveedores de Transporte)
// ============================================================================
export const providers = mysqlTable(
  'providers',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    businessName: varchar('business_name', { length: 255 }).notNull(), // razón social
    taxId: varchar('tax_id', { length: 20 }), // RUT de la empresa
    contactName: varchar('contact_name', { length: 200 }), // nombre de contacto
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    address: varchar('address', { length: 500 }),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),
    country: varchar('country', { length: 100 }).default('Chile'),
    businessType: varchar('business_type', { length: 100 }), // tipo de servicio: transporte, logística, operador logístico, etc.
    serviceTypes: varchar('service_types', { length: 500 }), // tipos de servicios que ofrece (separados por coma)
    fleetSize: int('fleet_size'), // tamaño de flota
    status: boolean('status').notNull().default(true), // active/inactive
    rating: int('rating'), // calificación del proveedor (1-5)
    observations: varchar('observations', { length: 1000 }),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('provider_operator_id_idx').on(table.operatorId),
    businessNameIdx: index('provider_business_name_idx').on(table.businessName),
    taxIdIdx: index('provider_tax_id_idx').on(table.operatorId, table.taxId),
    businessTypeIdx: index('provider_business_type_idx').on(table.businessType),
    statusIdx: index('provider_status_idx').on(table.status),
  }),
);

export const providersRelations = relations(providers, ({ one, many }) => ({
  operator: one(operators, {
    fields: [providers.operatorId],
    references: [operators.id],
  }),
  operations: many(operations),
}));

// ============================================================================
// ROUTES TABLE (Tramos/Rutas)
// ============================================================================
export const routes = mysqlTable(
  'routes',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(), // nombre descriptivo del tramo
    code: varchar('code', { length: 50 }), // código interno del tramo
    origin: varchar('origin', { length: 500 }).notNull(),
    destination: varchar('destination', { length: 500 }).notNull(),
    distance: int('distance'), // km
    estimatedDuration: int('estimated_duration'), // minutos
    routeType: varchar('route_type', { length: 50 }), // urbana, interurbana, minera, rural, etc.
    difficulty: varchar('difficulty', { length: 20 }), // fácil, moderada, difícil
    roadConditions: varchar('road_conditions', { length: 500 }), // condiciones de la ruta
    tollsRequired: boolean('tolls_required').default(false), // si requiere peajes
    estimatedTollCost: int('estimated_toll_cost'), // costo estimado de peajes
    status: boolean('status').notNull().default(true), // active/inactive
    observations: varchar('observations', { length: 1000 }),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('route_operator_id_idx').on(table.operatorId),
    nameIdx: index('route_name_idx').on(table.name),
    codeIdx: index('route_code_idx').on(table.operatorId, table.code),
    routeTypeIdx: index('route_type_idx').on(table.routeType),
    statusIdx: index('route_status_idx').on(table.status),
  }),
);

export const routesRelations = relations(routes, ({ one, many }) => ({
  operator: one(operators, {
    fields: [routes.operatorId],
    references: [operators.id],
  }),
  operations: many(operations),
}));

// ============================================================================
// OPERATIONS TABLE (Operaciones/Viajes)
// ============================================================================
export const operations = mysqlTable(
  'operations',
  {
    id: int('id').primaryKey().autoincrement(),
    operatorId: int('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    clientId: int('client_id').references(() => clients.id, {
      onDelete: 'restrict',
    }), // cliente asociado (opcional)
    providerId: int('provider_id').references(() => providers.id, {
      onDelete: 'restrict',
    }), // proveedor de transporte (opcional)
    routeId: int('route_id').references(() => routes.id, {
      onDelete: 'restrict',
    }), // tramo/ruta asociada (opcional)
    driverId: int('driver_id')
      .notNull()
      .references(() => drivers.id, { onDelete: 'restrict' }),
    vehicleId: int('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'restrict' }),
    operationNumber: varchar('operation_number', { length: 50 }).notNull(),
    operationType: varchar('operation_type', { length: 50 }).notNull(), // delivery, pickup, transfer, etc.
    origin: varchar('origin', { length: 500 }).notNull(),
    destination: varchar('destination', { length: 500 }).notNull(),
    scheduledStartDate: timestamp('scheduled_start_date').notNull(),
    scheduledEndDate: timestamp('scheduled_end_date'),
    actualStartDate: timestamp('actual_start_date'),
    actualEndDate: timestamp('actual_end_date'),
    distance: int('distance'), // km
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, in-progress, completed, cancelled
    cargoDescription: varchar('cargo_description', { length: 1000 }),
    cargoWeight: int('cargo_weight'), // kg
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    createdBy: int('created_by'),
    updatedBy: int('updated_by'),
  },
  (table) => ({
    operatorIdIdx: index('operation_operator_id_idx').on(table.operatorId),
    clientIdIdx: index('operation_client_id_idx').on(table.clientId),
    providerIdIdx: index('operation_provider_id_idx').on(table.providerId),
    routeIdIdx: index('operation_route_id_idx').on(table.routeId),
    driverIdIdx: index('operation_driver_id_idx').on(table.driverId),
    vehicleIdIdx: index('operation_vehicle_id_idx').on(table.vehicleId),
    operationNumberIdx: uniqueIndex('operation_number_idx').on(
      table.operatorId,
      table.operationNumber,
    ),
    statusIdx: index('operation_status_idx').on(table.status),
    scheduledStartDateIdx: index('operation_scheduled_start_idx').on(
      table.scheduledStartDate,
    ),
  }),
);

export const operationsRelations = relations(operations, ({ one }) => ({
  operator: one(operators, {
    fields: [operations.operatorId],
    references: [operators.id],
  }),
  client: one(clients, {
    fields: [operations.clientId],
    references: [clients.id],
  }),
  provider: one(providers, {
    fields: [operations.providerId],
    references: [providers.id],
  }),
  route: one(routes, {
    fields: [operations.routeId],
    references: [routes.id],
  }),
  driver: one(drivers, {
    fields: [operations.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [operations.vehicleId],
    references: [vehicles.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Operator = typeof operators.$inferSelect;
export type NewOperator = typeof operators.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;

export type RoleGrant = typeof roleGrants.$inferSelect;
export type NewRoleGrant = typeof roleGrants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type NewDriverDocument = typeof driverDocuments.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type DriverVehicle = typeof driverVehicles.$inferSelect;
export type NewDriverVehicle = typeof driverVehicles.$inferInsert;

export type Operation = typeof operations.$inferSelect;
export type NewOperation = typeof operations.$inferInsert;

export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
export type NewVehicleDocument = typeof vehicleDocuments.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
