import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriversRepository } from './repositories/drivers.repository';
import { DriverDocumentsRepository } from './repositories/driver-documents.repository';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [DriversController],
  providers: [DriversService, DriversRepository, DriverDocumentsRepository],
  exports: [DriversService, DriversRepository, DriverDocumentsRepository],
})
export class DriversModule {}
