import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { PdfService } from './pdf.service';
import { ExcelService } from './excel.service';
import { OperationsRepository } from './repositories/operations.repository';
import { DriverVehiclesRepository } from './repositories/driver-vehicles.repository';
import { DatabaseModule } from '../database/database.module';
import { DriversRepository } from '../drivers/repositories/drivers.repository';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { RoutesRepository } from '../routes/repositories/routes.repository';
import { ClientsRepository } from '../clients/repositories/clients.repository';
import { ProvidersRepository } from '../providers/repositories/providers.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [OperationsController],
  providers: [
    OperationsService,
    PdfService,
    ExcelService,
    OperationsRepository,
    DriverVehiclesRepository,
    DriversRepository,
    VehiclesRepository,
    RoutesRepository,
    ClientsRepository,
    ProvidersRepository,
  ],
  exports: [OperationsService, OperationsRepository],
})
export class OperationsModule {}
