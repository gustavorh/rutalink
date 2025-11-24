import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { VehicleDocumentsRepository } from './repositories/vehicle-documents.repository';
import { DatabaseModule } from '../database/database.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [DatabaseModule, OperationsModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepository, VehicleDocumentsRepository],
  exports: [VehiclesService],
})
export class VehiclesModule {}
