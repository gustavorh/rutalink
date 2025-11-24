import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { DriverVehicle } from '../../database/schema';

/**
 * Driver-Vehicles Repository
 *
 * Handles all data access operations for driver-vehicle assignments.
 */
@Injectable()
export class DriverVehiclesRepository extends BaseRepository<DriverVehicle> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.driverVehicles);
  }

  /**
   * Get all assignments for a driver
   */
  async findByDriverId(driverId: number) {
    return this.db
      .select({
        assignment: schema.driverVehicles,
        vehicle: schema.vehicles,
      })
      .from(schema.driverVehicles)
      .leftJoin(
        schema.vehicles,
        eq(schema.driverVehicles.vehicleId, schema.vehicles.id),
      )
      .where(eq(schema.driverVehicles.driverId, driverId))
      .orderBy(desc(schema.driverVehicles.assignedAt));
  }

  /**
   * Get active assignment for a driver
   */
  async findActiveByDriverId(driverId: number) {
    const [assignment] = await this.db
      .select({
        assignment: schema.driverVehicles,
        vehicle: schema.vehicles,
      })
      .from(schema.driverVehicles)
      .leftJoin(
        schema.vehicles,
        eq(schema.driverVehicles.vehicleId, schema.vehicles.id),
      )
      .where(
        and(
          eq(schema.driverVehicles.driverId, driverId),
          eq(schema.driverVehicles.isActive, true),
        ),
      )
      .limit(1);

    return assignment || null;
  }

  /**
   * Deactivate all active assignments for a driver
   */
  async deactivateActiveAssignments(
    driverId: number,
    userId: number,
  ): Promise<void> {
    await this.db
      .update(schema.driverVehicles)
      .set({
        isActive: false,
        unassignedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        and(
          eq(schema.driverVehicles.driverId, driverId),
          eq(schema.driverVehicles.isActive, true),
        ),
      );
  }

  /**
   * Create a new driver-vehicle assignment
   */
  async createAssignment(
    driverId: number,
    vehicleId: number,
    notes: string | undefined,
    userId: number,
  ): Promise<number> {
    const [result] = await this.db.insert(schema.driverVehicles).values({
      driverId,
      vehicleId,
      notes,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });
    return result.insertId;
  }

  /**
   * Unassign (deactivate) a specific assignment
   */
  async unassignById(
    assignmentId: number,
    notes: string | undefined,
    userId: number,
  ): Promise<void> {
    const assignment = await this.findById(assignmentId);

    await this.db
      .update(schema.driverVehicles)
      .set({
        isActive: false,
        unassignedAt: new Date(),
        notes: notes || assignment?.notes,
        updatedBy: userId,
      })
      .where(eq(schema.driverVehicles.id, assignmentId));
  }
}
